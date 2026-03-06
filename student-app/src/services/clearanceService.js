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
            program_id: formData.program_id,
            purpose_id: formData.purpose_id,
            notes: formData.notes
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
            clearance_status: 'PENDING',
            data_logged: now,
            last_updated_at: now
        }]);

    if (logError) throw logError;

    // Send submission confirmation email via Brevo
    try {
        const studentFullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();
        
        // Fetch program name and purpose name from database
        const [programRes, purposeRes] = await Promise.all([
            supabase.from('program').select('program_name').eq('id', formData.program_id).single(),
            supabase.from('purpose').select('purpose_name').eq('id', formData.purpose_id).single()
        ]);

        const programName = programRes.data?.program_name || 'N/A';
        const purposeName = purposeRes.data?.purpose_name || 'N/A';

        const payload = {
            email: formData.email,
            studentName: studentFullName,
            studentNumber: formData.studentNo,
            program: programName,
            purpose: purposeName
        };

        console.log('Invoking send-submission-confirmation with:', payload);

        // Use direct fetch with Supabase API key header
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const response = await fetch(
            'https://rmdgexukylhfjobnwmfe.supabase.co/functions/v1/send-submission-confirmation',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`,
                    'x-client-info': 'supabase-js/2.94.0'
                },
                body: JSON.stringify(payload)
            }
        );

        const result = await response.json();
        console.log('Email function response:', { status: response.status, data: result });

        if (!response.ok) {
            console.error('Email function error:', result);
        }
    } catch (emailError) {
        console.error('Failed to send submission confirmation email:', emailError);
        // Don't throw - submission was successful, just email failed
        // User is still notified of successful submission in the form
    }

    return student;
};
