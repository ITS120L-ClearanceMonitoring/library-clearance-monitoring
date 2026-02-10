import { supabase } from '../../../services/supabaseClient';

export const submitStudentLog = async (formData) => {
    // 1. Check if student already exists or create new entry
    const { data: student, error: sError } = await supabase
        .from('student')
        .insert([{
            student_number: formData.studentNo,
            first_name: formData.firstName,
            last_name: formData.lastName,
            program: formData.program,
            purpose_of_clearance: formData.purpose
            // created_at is handled by DB
        }])
        .select()
        .single();

    if (sError) throw sError;

    // 2. Create the initial Clearance Log entry
    const { error: logError } = await supabase
        .from('clearance') // Matches the table name in your ERD
        .insert([{
            student_id: student.student_id, // Links via FK1
            clearance_status: 'NOT CLEARED', // Matches the ENUM requirement
            data_logged: new Date().toISOString() // Matches the datetime requirement
        }]);

    if (logError) throw logError;
};