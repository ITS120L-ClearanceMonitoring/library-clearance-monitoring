import { useState } from 'react';
import { resetPasswordForEmail } from '../services/authService';
import { Button } from '../../../components/ui';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await resetPasswordForEmail(email);
      setMessage('If this email exists, a password reset link has been sent.');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Unable to send reset link. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Forgot Password?</h1>
        <p>Enter your email address to receive a password reset link.</p>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading} variant="primary" style={{ width: '100%' }}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
    </div>
  );
};

import '../forgot-password.css';
export default ForgotPasswordPage;
