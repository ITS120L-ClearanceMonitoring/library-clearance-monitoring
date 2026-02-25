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
      console.error('Edge Function error object:', error);
      console.error('Error message:', error.message);
      
      // Parse the error response to get code and message
      let errorCode = 'unknown_error';
      let errorMessage = 'An error occurred during invitation';
      
      // error.context is a Response object, we need to extract the body
      try {
        if (error.context && typeof error.context.json === 'function') {
          const errorBody = await error.context.json();
          console.error('Error response body:', errorBody);
          errorCode = errorBody.code || errorCode;
          errorMessage = errorBody.error || errorMessage;
        } else {
          errorMessage = error.message;
        }
      } catch (parseErr) {
        console.error('Failed to parse error response:', parseErr);
        errorMessage = error.message;
      }
      
      console.error('Parsed error code:', errorCode);
      console.error('Parsed error message:', errorMessage);
      
      // Create and throw error with proper code
      const err = new Error(errorMessage);
      err.code = errorCode;
      throw err;
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
 * Delete a user (from both database and auth via Edge Function)
 */
export const deleteUser = async (userId) => {
  try {
    console.log('🔵 Deleting user:', userId);
    
    // Call edge function to delete from both Auth and database
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });

    if (error) {
      console.error('❌ Delete function error:', error);
      console.error('Error message:', error.message);
      console.error('Error context:', error.context);
      
      // Try to extract error response body
      try {
        if (error.context && typeof error.context.json === 'function') {
          const errorBody = await error.context.json();
          console.error('Error response body:', errorBody);
          throw new Error(errorBody.error || error.message);
        }
      } catch (parseErr) {
        console.error('Failed to parse error response:', parseErr);
      }
      
      throw error;
    }

    console.log('✅ User deleted successfully from Auth and database:', data);
    return true;
  } catch (err) {
    console.error("❌ Delete failed:", err);
    throw err;
  }
};
