import { supabase } from '../../../services/supabaseClient';

/**
 * Fetch all users from the database
 */
export const fetchUsers = async () => {
  try {
    console.log('Starting user fetch...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Fetch response - Error:', error);
    console.log('Fetch response - Data count:', data?.length || 0);
    console.log('Full data:', data);

    if (error) {
      console.error("Supabase error:", error.code, error.message);
      throw error;
    }
    
    console.log('Successfully fetched', data?.length || 0, 'users');
    return data || [];
  } catch (err) {
    console.error("Fetch users error:", err.message);
    console.error("Full error object:", err);
    throw err;
  }
};

/**
 * Send staff invitation via Edge Function
 */
export const inviteStaff = async (staffData) => {
  try {
    console.log('Sending invitation with:', staffData);
    console.log('   - Email:', staffData.email);
    console.log('   - First Name:', staffData.first_name);
    console.log('   - Last Name:', staffData.last_name);
    console.log('   - Role:', staffData.role);
    
    const payload = {
      email: staffData.email,
      first_name: staffData.first_name,
      last_name: staffData.last_name,
      role: staffData.role
    };
    
    console.log('Payload being sent:', JSON.stringify(payload));
    
    const { data, error } = await supabase.functions.invoke('invite-staff', {
      body: payload
    });

    if (error) {
      console.error('Edge Function error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check for specific error codes
      if (error.context?.error?.code === 'email_exists' || error.message?.includes('already been registered')) {
        const emailExistsError = new Error('This email address is already registered. Please use a different email or delete the existing account first.');
        emailExistsError.code = 'email_exists';
        throw emailExistsError;
      }
      
      // Try to extract error message from response
      if (error.context?.error?.message) {
        console.error('Server error message:', error.context.error.message);
        throw new Error(error.context.error.message);
      }
      
      throw error;
    }

    console.log('Invitation sent successfully:', data);
    return data;
  } catch (err) {
    console.error("Invitation failed:", err);
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    throw err;
  }
};

/**
 * Update user information
 */
export const updateUser = async (userId, userData) => {
  try {
    console.log('Updating user:', userId, userData);
    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: userData.first_name,
        middle_name: userData.middle_name,
        last_name: userData.last_name,
        role: userData.role
      })
      .eq('user_id', userId)
      .select();

    console.log('Update response - Error:', error);
    console.log('Update response - Data:', data);

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }

    console.log('✅ User updated successfully');
    return true;
  } catch (err) {
    console.error("❌ Update failed:", err);
    throw err;
  }
};

/**
 * Delete a user (from database via RLS policies)
 */
export const deleteUser = async (userId) => {
  try {
    console.log('🔵 Deleting user:', userId);
    
    // Delete from users table (RLS policy will allow if current user is admin)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('❌ Database delete error:', deleteError);
      throw deleteError;
    }

    console.log('✅ User deleted successfully from database');
    return true;
  } catch (err) {
    console.error("❌ Delete failed:", err);
    throw err;
  }
};
