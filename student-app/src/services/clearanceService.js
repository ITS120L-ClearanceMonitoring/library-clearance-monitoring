import { supabase } from './supabaseClient';

// Student Logging - Submit clearance request
export const submitStudentLog = async (formData) => {
  // Insert into "student" table first
  const { data: student, error: sError } = await supabase
    .from('student')
    .insert([{
      student_number: formData.studentNo,
      first_name: formData.firstName,
      middle_name: formData.middleName,
      last_name: formData.lastName,
      email: formData.email,
      program: formData.program,
      purpose_of_clearance: formData.purpose
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

  // Send submission confirmation email via Brevo
  try {
    const studentFullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();
    
    await supabase.functions.invoke('send-submission-confirmation', {
      body: {
        email: formData.email,
        studentName: studentFullName,
        studentNumber: formData.studentNo,
        program: formData.program,
        purpose: formData.purpose
      }
    });
  } catch (emailError) {
    console.error('Failed to send submission confirmation email:', emailError);
    // Don't throw - log submission was successful, just email failed
    // User is still notified of successful submission in the form
  }

  return student;
};
