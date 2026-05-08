import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordResetOtp } from '../api/userApi';
import { clearResetSession, saveResetEmail } from '../passwordResetSession';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await requestPasswordResetOtp(email.trim().toLowerCase());
      const normalizedEmail = email.trim().toLowerCase();

      clearResetSession();
      saveResetEmail(normalizedEmail);
      setSuccess(response.message || 'OTP sent successfully.');

      navigate('/verify-reset-otp', {
        state: {
          email: normalizedEmail,
          message: response.message || 'OTP sent successfully.',
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card auth-card-wide">
      <p className="hero-badge admin-badge">Password Recovery</p>
      <h2 className="section-title">Forgot your password?</h2>
      <p className="auth-description">
        Enter your registered email address and we will send you a one-time verification code.
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="forgot-email">Registered Email</label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email address"
          required
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>

      {error ? <p className="status-msg error">{error}</p> : null}
      {success ? <p className="status-msg">{success}</p> : null}

      <p className="auth-switch">
        Remembered your password? <Link to="/login">Back to Login</Link>
      </p>
    </section>
  );
};

export default ForgotPassword;
