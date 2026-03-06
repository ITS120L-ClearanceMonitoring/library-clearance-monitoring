import { supabase } from './supabaseClient';

export const updateClearanceWithAudit = async (data) => {
    const { clearance_uuid, student_id, old_status, new_status, performed_by, editor_name, remarks, last_fetched_at } = data;

    // 1. Update with WHERE clause check (Conflict Resolution)
    let updateQuery = supabase
        .from('clearance')
        .update({
            clearance_status: new_status,
            last_updated_by: performed_by,
            last_updated_at: new Date().toISOString()
        })
        .eq('clearance_uuid', clearance_uuid);

    // Use .is() for NULL comparisons instead of .eq()
    if (last_fetched_at === null) {
        updateQuery = updateQuery.is('last_updated_at', null);
    } else {
        updateQuery = updateQuery.eq('last_updated_at', last_fetched_at);
    }

    const { data: updateData, error: clearanceError, count } = await updateQuery.select();

    // If count is 0 but there was no error, someone else updated it first
    if (!clearanceError && (!updateData || updateData.length === 0)) {
        throw new Error("CONFLICT_DETECTED: This record was recently updated by another librarian. Please refresh the page.");
    }

    if (clearanceError) throw clearanceError;

  // 2. Insert into Audit Trail Table (FR4.1)
  const { error: auditError } = await supabase
    .from('audit_trail')
    .insert([{
      clearance_uuid,
      student_id,
      action_type: 'STATUS_CHANGE',
      old_status,
      new_status,
      performed_by,
      editor_name,
      remarks, // Mandatory if "Not Cleared" per FR3.3
      timestamp: new Date().toISOString()
    }]);

  if (auditError) throw auditError;
};

  export const updateStudentInfoWithAudit = async (data) => {
    const {
      student_id,
      old_first_name,
      old_last_name,
      old_student_number,
      new_first_name,
      new_last_name,
      new_student_number,
      performed_by,
      editor_name,
      clearance_uuid,
      clearance_status
    } = data;

    const { error: studentUpdateError } = await supabase
      .from('student')
      .update({
        first_name: new_first_name,
        last_name: new_last_name,
        student_number: new_student_number
      })
      .eq('student_id', student_id);

    if (studentUpdateError) throw studentUpdateError;

    const changedFields = [];
    if (old_first_name !== new_first_name) {
      changedFields.push(`First Name: ${old_first_name || '-'} → ${new_first_name || '-'}`);
    }
    if (old_last_name !== new_last_name) {
      changedFields.push(`Last Name: ${old_last_name || '-'} → ${new_last_name || '-'}`);
    }
    if (old_student_number !== new_student_number) {
      changedFields.push(`Student Number: ${old_student_number || '-'} → ${new_student_number || '-'}`);
    }

    const remarks = changedFields.length > 0
      ? changedFields.join(' | ')
      : 'Student information edit submitted with no field changes.';

    const { error: auditError } = await supabase
      .from('audit_trail')
      .insert([{
        clearance_uuid,
        student_id,
        action_type: 'STUDENT_INFO_EDIT',
        old_status: clearance_status,
        new_status: clearance_status,
        performed_by,
        editor_name,
        remarks,
        timestamp: new Date().toISOString()
      }]);

    if (auditError) throw auditError;
  };