import { supabase } from '../../../services/supabaseClient';

/**
 * Submits a student log and creates an initial 'NOT CLEARED' record.
 */
export const submitStudentLog = async (formData) => {
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

  const { error: logError } = await supabase
    .from('clearance')
    .insert([{
      student_id: student.student_id,
      clearance_status: 'NOT CLEARED',
      data_logged: new Date().toISOString()
    }]);

  if (logError) throw logError;
};

/**
 * Fetches clearance list for the UI dashboard.
 */
export const fetchClearances = async () => {
  const { data: clearanceData, error: clearanceError } = await supabase
    .from('clearance')
    .select('*')
    .order('data_logged', { ascending: false });

  if (clearanceError) throw clearanceError;
  if (!clearanceData || clearanceData.length === 0) return [];

  const studentIds = Array.from(new Set(clearanceData.map((c) => c.student_id).filter(Boolean)));
  const { data: studentsData, error: studentsError } = await supabase
    .from('student')
    .select('*')
    .in('student_id', studentIds);

  if (studentsError) throw studentsError;
  const studentById = Object.fromEntries((studentsData || []).map((s) => [s.student_id, s]));

  return clearanceData.map((c) => ({
    ...c,
    student: studentById[c.student_id] || null,
  }));
};

/**
 * Specialized query for the CSV Report using Schema Joins.
 */
export const fetchClearanceReportData = async () => {
  const { data, error } = await supabase
    .from('clearance')
    .select(`
      clearance_status,
      data_logged,
      student:student_id (
        student_number, first_name, last_name, program, purpose_of_clearance
      ),
      librarian:last_updated_by (
        first_name, last_name
      )
    `)
    .order('data_logged', { ascending: false });

  if (error) throw error;
  return data || [];
};