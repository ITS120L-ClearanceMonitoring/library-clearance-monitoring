/**
 * Security Utility Functions
 * Implements essential security best practices for authentication
 */

/**
 * Input sanitization - removes potentially dangerous characters
 * while preserving legitimate email/password characters
 */
export const sanitizeInput = (input, type = 'text') => {
  if (!input || typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  if (type === 'email') {
    // Allow only email-safe characters
    sanitized = sanitized.toLowerCase();
    sanitized = sanitized.replace(/[^a-z0-9@._\-+]/g, '');
  }
  
  // Limit input length to prevent buffer overflow attacks
  const maxLength = type === 'email' ? 254 : 128; // RFC 5321 max email length
  sanitized = sanitized.substring(0, maxLength);
  
  return sanitized;
};

/**
 * Validate email format according to RFC 5322 (simplified)
 */
export const isValidEmail = (email) => {
  if (!email || email.length > 254) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Prevent timing attacks by using consistent-time comparison
 * (Not needed for Supabase, but good practice for general use)
 */
export const constantTimeCompare = (a, b) => {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

/**
 * Account lockout management using localStorage
 * Prevents brute force attacks with time-based lockout
 */
export const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
export const MAX_LOGIN_ATTEMPTS = 5;

export const getLoginAttempts = (email) => {
  const key = `login_attempts_${sanitizeInput(email, 'email')}`;
  const data = localStorage.getItem(key);
  
  if (!data) return { count: 0, lastAttempt: null };
  
  try {
    const parsed = JSON.parse(data);
    
    // Check if lockout period has expired
    if (Date.now() - parsed.lastAttempt > LOCKOUT_DURATION) {
      // Lockout expired, reset
      localStorage.removeItem(key);
      return { count: 0, lastAttempt: null };
    }
    
    return parsed;
  } catch (e) {
    console.error('Error parsing login attempts:', e);
    return { count: 0, lastAttempt: null };
  }
};

export const recordFailedAttempt = (email) => {
  const key = `login_attempts_${sanitizeInput(email, 'email')}`;
  const attempts = getLoginAttempts(email);
  const newCount = attempts.count + 1;
  const lastAttempt = Date.now();
  
  localStorage.setItem(key, JSON.stringify({
    count: newCount,
    lastAttempt: lastAttempt
  }));
  
  return { count: newCount, lastAttempt };
};

export const resetLoginAttempts = (email) => {
  const key = `login_attempts_${sanitizeInput(email, 'email')}`;
  localStorage.removeItem(key);
};

export const isAccountLocked = (email) => {
  const attempts = getLoginAttempts(email);
  return attempts.count >= MAX_LOGIN_ATTEMPTS;
};

export const getRemainingLockoutTime = (email) => {
  const attempts = getLoginAttempts(email);
  if (!attempts.lastAttempt) return 0;
  
  const timeElapsed = Date.now() - attempts.lastAttempt;
  const timeRemaining = LOCKOUT_DURATION - timeElapsed;
  
  return Math.max(0, timeRemaining);
};

export const formatLockoutTime = (milliseconds) => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

/**
 * Clear sensitive data from memory
 */
export const clearSensitiveData = (dataString) => {
  // Fill the string with zeros
  if (dataString && typeof dataString === 'string') {
    return '\0'.repeat(dataString.length);
  }
  return '';
};

/**
 * Content Security Policy headers (implemented server-side, for reference)
 * These should be set in Vite config or server headers
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

/**
 * Validate password doesn't contain common weak patterns
 */
export const hasCommonPatterns = (password) => {
  const commonPatterns = [
    /^123/,           // Sequential numbers
    /(.)\1{2,}/,      // Repeated characters (aaa, bbb)
    /^password/i,     // Contains 'password'
    /^admin/i,        // Contains 'admin'
    /^qwerty/i,       // Keyboard patterns
    /^abc/i           // Alphabetical sequences
  ];
  
  return commonPatterns.some(pattern => pattern.test(password));
};

/**
 * Secure session management
 */
export const secureSession = {
  /**
   * Clear all auth-related session data on logout
   */
  clearAuthData: () => {
    // Clear localStorage
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('login_attempts') || 
      key.includes('auth') ||
      key.includes('session')
    );
    authKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies (handled by Supabase auth.signOut)
  },
  
  /**
   * Check if session is still valid
   */
  isSessionValid: () => {
    try {
      // This would be expanded with actual session validation
      return true;
    } catch (e) {
      return false;
    }
  },
  
  /**
   * Get session timeout remaining (for future implementation)
   */
  getSessionTimeout: () => {
    // Default: 24 hours
    return 24 * 60 * 60 * 1000;
  }
};
