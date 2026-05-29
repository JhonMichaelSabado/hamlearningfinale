import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

const ForgotPassword = ({ onBackToLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://hamlearningfinale.vercel.app/_backend/api/password/forgot-password', { email });
      setCodeSent(true);
      setMessage({ type: 'success', text: response.data.message || 'A 5-digit code was sent to your email.' });
      // keep the email in the form so user can see which address was used
    } catch (error) {
      console.error('Forgot-password error:', error);
      // still allow entering the code (useful for testing) but show the error
      setCodeSent(true);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send reset code. If you received an email, enter the code below.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetWithCode = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!email || !code || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (!/^[0-9]{5}$/.test(code)) {
      setMessage({ type: 'error', text: 'Code must be a 5-digit number' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      const resp = await axios.post('https://hamlearningfinale.vercel.app/_backend/api/password/reset-password-with-code', {
        email,
        code,
        newPassword
      });

      setMessage({ type: 'success', text: resp.data.message || 'Password reset successfully!' });
      setCodeSent(false);
      setTimeout(() => navigate('/'), 1800);
    } catch (err) {
      console.error('Reset with code error:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reset password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="brand-header">
        <img src="/images/header-banner.png" alt="HamLearning" className="auth-logo" />
        <p className="tagline">Learn smarter, together</p>
      </div>

      <div className="auth-card">
        <div className="welcome-section">
          <h2>Reset Password</h2>
          <p>Enter your email address and we'll send you a 5-digit code to reset your password</p>
          <p className="auth-hint">
            Use the same Gmail or email account you registered with so you can receive the reset code.
          </p>
        </div>

        <form onSubmit={codeSent ? handleResetWithCode : handleSendCode} className="auth-form">
          {message.text && (
            <div className={`${message.type}-message`}>
              {message.text}
            </div>
          )}

          {!codeSent && (
            <>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </>
          )}

          {codeSent && (
            <>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>5-digit Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="12345"
                  maxLength={5}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </>
          )}

          <div className="back-to-login">
            <button
              type="button"
              onClick={onBackToLogin}
              className="link-button"
            >
              ← Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
