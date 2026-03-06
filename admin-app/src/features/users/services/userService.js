import { supabase } from '../../../services/supabaseClient';

/**
 * Fetch all users from the database
 */
export const fetchUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch users error:", error.message);
      throw error;
    }
    
    return data || [];
  } catch (err) {
    console.error("Fetch users error:", err.message);
    throw err;
  }
};

/**
 * Send staff invitation via Edge Function
 */
export const inviteStaff = async (staffData) => {
  try {
    const payload = {
      email: staffData.email,
      first_name: staffData.first_name,
      last_name: staffData.last_name,
      role: staffData.role
    };
    
    const { data, error } = await supabase.functions.invoke('invite-staff', {
      body: payload
    });

    if (error) {
      // Parse the error response to get code and message
      let errorCode = 'unknown_error';
      let errorMessage = 'An error occurred during invitation';
      
      try {
        if (error.context && typeof error.context.json === 'function') {
          const errorBody = await error.context.json();
          errorCode = errorBody.code || errorCode;
          errorMessage = errorBody.error || errorMessage;
        } else {
          errorMessage = error.message;
        }
      } catch (parseErr) {
        errorMessage = error.message;
      }
      
      const err = new Error(errorMessage);
      err.code = errorCode;
      throw err;
    }

    return data;
  } catch (err) {
    console.error("Invitation failed:", err.message);
    throw err;
  }
};

/**
 * Update user information
 */
export const updateUser = async (userId, userData) => {
  try {
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

    if (error) {
      console.error("User update error:", error.message);
      throw error;
    }

    return true;
  } catch (err) {
    console.error("Update failed:", err.message);
    throw err;
  }
};

/**
 * Delete a user (from both database and auth via Edge Function)
 */
export const deleteUser = async (userId) => {
  try {
    // Get session to include in Authorization header
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session. Please log in again.');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }

    return true;
  } catch (err) {
    console.error("Delete failed:", err.message);
    throw err;
  }
};
