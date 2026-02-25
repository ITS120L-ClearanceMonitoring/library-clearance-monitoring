import { supabase } from './supabaseClient';

// Student Logging - Submit clearance request
export const submitStudentLog = async (formData) => {
    // Insert into "student" table using the NEW column names
    const { data: student, error: sError } = await supabase
        .from('student')
        .insert([{
            student_number: formData.studentNo,
            first_name: formData.firstName,
            middle_name: formData.middleName,
            last_name: formData.lastName,
            email: formData.email,
            // FIX: Changed 'program' to 'program_id'
            // and 'purpose_of_clearance' to 'purpose_id'
            program_id: formData.program_id,
            purpose_id: formData.purpose_id
        }])
        .select()
        .single();

    if (sError) throw sError;

    // Then insert into "clearance" table
    const now = new Date().toISOString();
    const { error: logError } = await supabase
        .from('clearance')
        .insert([{
            student_id: student.student_id,
            clearance_status: 'NOT CLEARED',
            data_logged: now,
            last_updated_at: now
        }]);

    if (logError) throw logError;
};