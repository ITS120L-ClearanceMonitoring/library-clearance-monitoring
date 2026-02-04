import { supabase } from '../../../services/supabaseClient';
import { sanitizeInput, hasCommonPatterns } from './securityUtils';

/**
 * Password validation rules
 * Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, passCount: 0, requirements: {} };
  }

  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommonPatterns: !hasCommonPatterns(password)
  };

  const isValid = Object.values(requirements).every(Boolean);
  const passCount = Object.values(requirements).filter(Boolean).length;

  return {
    isValid,
    passCount,
    requirements
  };
};

/**
 * Get password strength indicator
 */
export const getPasswordStrength = (password) => {
  if (!password) return { level: 0, label: 'None', color: '#ccc' };
  
  const { passCount } = validatePassword(password);
  
  if (passCount === 1) return { level: 1, label: 'Weak', color: '#d32f2f' };
  if (passCount === 2) return { level: 2, label: 'Fair', color: '#f57c00' };
  if (passCount === 3) return { level: 3, label: 'Good', color: '#fbc02d' };
  if (passCount === 4) return { level: 4, label: 'Strong', color: '#388e3c' };
  return { level: 5, label: 'Very Strong', color: '#1b5e20' };
};

// Handles user login
export const loginUser = async (email, password) => {
  // Sanitize inputs before sending
  const sanitizedEmail = sanitizeInput(email, 'email');
  
  if (!sanitizedEmail || !password) {
    throw new Error('Email and password are required');
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });
    
    if (error) throw error;
    
    return data;
  } catch (err) {
    // Don't expose specific error details to prevent user enumeration
    console.error('Login error:', err);
    throw new Error('Invalid email or password');
  }
};

// Handles user logout with complete cleanup
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear sensitive auth data from browser
    clearAuthData();
    
    return true;
  } catch (err) {
    console.error('Logout error:', err);
    // Still clear data even if logout fails
    clearAuthData();
    throw err;
  }
};

/**
 * Clear all authentication data from browser storage
 */
const clearAuthData = () => {
  // Clear any login attempt tracking
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('login_attempts')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear sessionStorage
  sessionStorage.clear();
};

// Handles the "Change password on first login" logic
export const updateFirstPassword = async (newPassword) => {
  // 1. Validate password strength
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    throw new Error('Password does not meet security requirements');
  }

  // 2. Update the password in Supabase Auth
  const { data, error: authError } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (authError) throw authError;

  // 3. Update the 'must_change_password' flag in your SQL 'users' table
  // We use the user_id from the session to find the right row
  const { error: dbError } = await supabase
    .from('users')
    .update({ must_change_password: false })
    .eq('user_id', data.user.id);

  if (dbError) throw dbError;

  return data;
};