import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resetPasswordWithOtp } from '../api/userApi';
import { clearResetSession, getResetEmail, getResetToken } from '../passwordResetSession';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = useMemo(() => location.state?.email || getResetEmail(), [location.state]);
  const resetToken = useMemo(() => location.state?.resetToken || getResetToken(), [location.state]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password must match');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await resetPasswordWithOtp({
        email,
        resetToken,
        password,
        confirmPassword,
      });

      clearResetSession();
      navigate('/login', {
        state: {
          resetSuccess: response.message || 'Password reset successful. Please log in.',
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!email || !resetToken) {
    return (
      <section className="auth-card auth-card-wide">
        <p className="hero-badge admin-badge">Reset Password</p>
        <h2 className="section-title">Reset session expired</h2>
        <p className="auth-description">
          Please request a fresh OTP and verify it again before setting a new password.
        </p>
        <div className="auth-secondary-actions">
          <Link to="/forgot-password" className="btn-primary">Request New OTP</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-card auth-card-wide">
      <p className="hero-badge admin-badge">Set New Password</p>
      <h2 className="section-title">Create your new password</h2>
      <p className="auth-description">
        Choose a strong password for <strong>{email}</strong>.
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="reset-password">New Password</label>
        <input
          id="reset-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your new password"
          required
        />

        <label htmlFor="reset-confirm-password">Confirm Password</label>
        <input
          id="reset-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm your new password"
          required
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>

      {error ? <p className="status-msg error">{error}</p> : null}

      <p className="auth-switch">
        Need a new OTP? <Link to="/verify-reset-otp">Go back to verification</Link>
      </p>
    </section>
  );
};

export default ResetPassword;
