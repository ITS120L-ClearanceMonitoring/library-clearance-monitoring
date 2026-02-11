import { supabase } from './supabaseClient';

export const updateClearanceWithAudit = async (data) => {
  const { clearance_uuid, student_id, old_status, new_status, performed_by, editor_name, remarks } = data;

  // 1. Update the Clearance Table (FR3.2, FR3.4)
  const { error: clearanceError } = await supabase
    .from('clearance')
    .update({ 
      clearance_status: new_status,
      last_updated_by: performed_by,
      last_updated_at: new Date().toISOString()
    })
    .eq('clearance_uuid', clearance_uuid);

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