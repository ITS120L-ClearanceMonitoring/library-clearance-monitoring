import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Button, Loader } from '../../../components/ui';
import { validatePassword, getPasswordStrength } from '../services/authService';
import { secureSession } from '../services/securityUtils';
import '../change-password.css';

const ChangePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Clear sensitive data on unmount
  useEffect(() => {
    return () => {
      setPassword('');
      setConfirmPassword('');
    };
  }, []);

  const validation = validatePassword(password);
  const strength = getPasswordStrength(password);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    // Validation checks
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!validation.isValid) {
      setError('Password does not meet security requirements. Check all requirements below.');
      return;
    }

    setLoading(true);

    try {
      // 1. Update the auth user's password
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      // 2. Update the must_change_password flag in the users table directly
      const { error: updateError } = await supabase
        .from('users')
        .update({ must_change_password: false })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error("Failed to update password flag:", updateError.message);
        throw updateError;
      }

      // 3. Wait a moment for the database to commit
      await new Promise(resolve => setTimeout(resolve, 300));

      // 4. Verify the update was successful by fetching fresh data
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('must_change_password')
        .eq('user_id', user.id)
        .single();
      
      if (verifyError) {
        console.error("Verification failed:", verifyError.message);
        throw new Error("Could not verify password change. Please try again.");
      }
      
      if (verifyData.must_change_password !== false) {
        throw new Error("Password change was not saved. Please try again.");
      }

      // 5. Sign out the user so they must log in again with new password
      await logout();
      
      // Clear sensitive session data
      secureSession.clearAuthData();
      
      // 6. Navigate to login
      alert("Password set successfully! Please log in with your new password.");
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Password change error:', err.message);
      setError(err.message || 'Failed to update password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {loading && <Loader fullscreen size="md" />}
      <form onSubmit={handleUpdate} className="auth-form">
        <h2>Set Your Password</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          Create a strong, unique password to secure your account
        </p>
        <div className="form-group password-group">
          <label htmlFor="password">New Password</label>
          <div className="password-field-wrapper">
            <input 
              id="password"
              type={showPassword ? 'text' : 'password'} 
              placeholder="Enter a strong password" 
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              disabled={loading}
              required
              autoComplete="new-password"
              className="password-input"
              onFocus={() => setShowValidation(true)}
              onBlur={() => setShowValidation(false)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={!password || loading}
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

          {showValidation && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  flex: 1,
                  height: '4px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(strength.level / 5) * 100}%`,
                    backgroundColor: strength.color,
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: strength.color, fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {strength.label}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: '#666' }}>
                <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Password must have:</p>
                <ul style={{ margin: '0', padding: '0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', listStyle: 'none' }}>
                  <li style={{ color: validation.requirements.minLength ? '#4caf50' : '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {validation.requirements.minLength ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    )}
                    <span>At least 8 characters</span>
                  </li>
                  <li style={{ color: validation.requirements.hasUpperCase ? '#4caf50' : '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {validation.requirements.hasUpperCase ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    )}
                    <span>One uppercase letter (A-Z)</span>
                  </li>
                  <li style={{ color: validation.requirements.hasLowerCase ? '#4caf50' : '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {validation.requirements.hasLowerCase ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    )}
                    <span>One lowercase letter (a-z)</span>
                  </li>
                  <li style={{ color: validation.requirements.hasNumber ? '#4caf50' : '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {validation.requirements.hasNumber ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    )}
                    <span>One number (0-9)</span>
                  </li>
                  <li style={{ color: validation.requirements.hasSpecialChar ? '#4caf50' : '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {validation.requirements.hasSpecialChar ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    )}
                    <span>One special character (!@#$%^&*)</span>
                  </li>
                  <li style={{ color: validation.requirements.noCommonPatterns ? '#4caf50' : '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {validation.requirements.noCommonPatterns ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    )}
                    <span>No common weak patterns</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="form-group password-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="password-field-wrapper">
            <input 
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'} 
              placeholder="Re-enter your password" 
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              disabled={loading}
              required
              autoComplete="new-password"
              className="password-input"
              style={{ borderColor: confirmPassword && password !== confirmPassword ? '#d32f2f' : 'inherit' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={!confirmPassword || loading}
              className="password-toggle"
              title={confirmPassword ? (showConfirmPassword ? 'Hide password' : 'Show password') : 'Enter password'}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              style={{ background: 'none', border: 'none', boxShadow: 'none' }}
            >
              {showConfirmPassword ? (
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
          {confirmPassword && password !== confirmPassword && (
            <div style={{ fontSize: '12px', color: '#d32f2f', marginTop: '4px' }}>
              Passwords do not match
            </div>
          )}
          {confirmPassword && password === confirmPassword && validation.isValid && (
            <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Passwords match</span>
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={loading || !validation.isValid || password !== confirmPassword} 
          variant="primary" 
          size="md"
          style={{ width: '100%' }}
        >
          {loading ? 'Setting Password...' : 'Complete Setup'}
        </Button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;