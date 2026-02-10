import { supabase } from '../../../services/supabaseClient';

export const submitStudentLog = async (formData) => {
    // 1. Insert into "Student" table (Matches ERD exactly)
    const { data: student, error: sError } = await supabase
        .from('student')
        .insert([{
            student_number: formData.studentNo,
            first_name: formData.firstName,
            middle_name: formData.middleName,
            last_name: formData.lastName,
            program: formData.program,
            purpose_of_clearance: formData.purpose
        }])
        .select()
        .single();

    if (sError) throw sError;

    // 2. Insert into "Clearance Log" table (Matches ERD exactly)
    const { error: logError } = await supabase
        .from('clearance')
        .insert([{
            student_id: student.student_id,
            clearance_status: 'NOT CLEARED',
            data_logged: new Date().toISOString()
        }]);

    if (logError) throw logError;
};