import { useState, useEffect } from 'react';
import { loginUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Button, Loader } from '../../../components/ui';
import {
  sanitizeInput,
  isValidEmail,
  getLoginAttempts,
  recordFailedAttempt,
  resetLoginAttempts,
  isAccountLocked,
  getRemainingLockoutTime,
  formatLockoutTime,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION
} from '../services/securityUtils';
import '../login.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Clear password on unmount for security
  useEffect(() => {
    return () => {
      setPassword('');
    };
  }, []);

  // Check lockout status on mount and update timer
  useEffect(() => {
    if (email) {
      const locked = isAccountLocked(email);
      if (locked) {
        const remaining = getRemainingLockoutTime(email);
        setLockoutTimeRemaining(remaining);
        
        // Update timer every second
        const interval = setInterval(() => {
          const newRemaining = getRemainingLockoutTime(email);
          setLockoutTimeRemaining(newRemaining);
          
          if (newRemaining <= 0) {
            clearInterval(interval);
          }
        }, 1000);
        
        return () => clearInterval(interval);
      }
    }
  }, [email]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Check account lockout
    if (isAccountLocked(email)) {
      const remaining = getRemainingLockoutTime(email);
      setError(`Account locked. Try again in ${formatLockoutTime(remaining)}`);
      return;
    }

    // Input sanitization and validation
    const sanitizedEmail = sanitizeInput(email, 'email');
    
    if (!sanitizedEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    if (!isValidEmail(sanitizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsLoggingIn(true);
    
    try {
      await loginUser(sanitizedEmail, password);
      // Success - reset attempts
      resetLoginAttempts(sanitizedEmail);
      // The user will be set by onAuthStateChange in AuthContext
      // and the useEffect above will handle the redirect
    } catch (err) {
      // Record failed attempt
      const attempt = recordFailedAttempt(sanitizedEmail);
      
      // Generic error message for security (don't reveal if email exists)
      setError("Invalid email or password. Please try again.");
      console.error("Login error:", err.message);
      
      // Warn user about account lockout
      if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
        const remaining = getRemainingLockoutTime(sanitizedEmail);
        setError(`Account locked due to multiple failed attempts. Try again in ${formatLockoutTime(remaining)}`);
      } else if (attempt.count >= 3) {
        setError(`Invalid email or password. ${MAX_LOGIN_ATTEMPTS - attempt.count} attempts remaining before account lock.`);
      }
      
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="auth-container">
      {isLoggingIn && <Loader fullscreen size="md" />}
      <form onSubmit={handleLogin} className="auth-form">
        <h1>Library Login</h1>
       
        
        {error && (
          <div className="error-message" style={{ 
            animation: 'slideIn 0.3s ease-out',
            marginBottom: '16px'
          }}>
            {error}
            {isAccountLocked(email) && lockoutTimeRemaining > 0 && (
              <div style={{ fontSize: '12px', color: '#d32f2f', marginTop: '8px' }}>
                You are locked out. Time remaining: {formatLockoutTime(lockoutTimeRemaining)}
              </div>
            )}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input 
            id="email"
            type="email" 
            placeholder="your.email@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoggingIn || isAccountLocked}
            required
            autoComplete="email"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>

        <div className="form-group password-group">
          <label htmlFor="password">Password</label>
          <div className="password-field-wrapper">
            <input 
              id="password"
              type={showPassword ? 'text' : 'password'} 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoggingIn || isAccountLocked(email)}
              required
              autoComplete="current-password"
              className="password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              disabled={!password || isLoggingIn || isAccountLocked(email)}
              className="password-toggle"
              title={password ? (showPassword ? 'Hide password' : 'Show password') : 'Enter password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{ background: 'none', border: 'none', boxShadow: 'none' }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
          </div>
        </div>

        {email && getLoginAttempts(email).count > 0 && getLoginAttempts(email).count < MAX_LOGIN_ATTEMPTS && (
          <div style={{ 
            fontSize: '12px', 
            color: '#f57c00', 
            marginBottom: '12px',
            padding: '8px 12px',
            backgroundColor: '#fff3e0',
            borderRadius: '4px'
          }}>
            {MAX_LOGIN_ATTEMPTS - getLoginAttempts(email).count} login attempt{MAX_LOGIN_ATTEMPTS - getLoginAttempts(email).count !== 1 ? 's' : ''} remaining
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoggingIn || isAccountLocked(email)} 
          variant="primary" 
          size="md"
          style={{ width: '100%' }}
        >
          {isLoggingIn ? 'Signing In...' : 'Sign In'}
        </Button>
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <a
            href="/forgot-password"
            style={{ color: '#1976d2', textDecoration: 'underline', fontSize: '14px' }}
          >
            Forgot Password?
          </a>
        </div>
      </form>

    </div>
  );
};

export default LoginPage;