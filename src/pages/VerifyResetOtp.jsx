import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { requestPasswordResetOtp, verifyPasswordResetOtp } from '../api/userApi';
import { clearResetSession, getResetEmail, saveResetEmail, saveResetToken } from '../passwordResetSession';

const VerifyResetOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = useMemo(
    () => location.state?.email || getResetEmail(),
    [location.state]
  );

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');

  const handleVerify = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await verifyPasswordResetOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      saveResetEmail(email.trim().toLowerCase());
      saveResetToken(response.resetToken);

      navigate('/reset-password', {
        state: {
          email: email.trim().toLowerCase(),
          resetToken: response.resetToken,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResending(true);
      setError('');
      setSuccess('');

      const response = await requestPasswordResetOtp(email.trim().toLowerCase());
      clearResetSession();
      saveResetEmail(email.trim().toLowerCase());
      setSuccess(response.message || 'A new OTP has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="auth-card auth-card-wide">
      <p className="hero-badge admin-badge">OTP Verification</p>
      <h2 className="section-title">Verify your reset code</h2>
      <p className="auth-description">
        Enter the 6-digit OTP sent to your email to continue with password reset.
      </p>

      <form onSubmit={handleVerify} className="auth-form">
        <label htmlFor="verify-email">Email</label>
        <input
          id="verify-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email address"
          required
        />

        <label htmlFor="verify-otp">OTP</label>
        <input
          id="verify-otp"
          type="text"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit OTP"
          className="otp-input"
          inputMode="numeric"
          maxLength={6}
          required
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Verifying OTP...' : 'Verify OTP'}
        </button>
      </form>

      {error ? <p className="status-msg error">{error}</p> : null}
      {success ? <p className="status-msg">{success}</p> : null}

      <div className="auth-secondary-actions">
        <button type="button" className="btn-secondary" onClick={handleResendOtp} disabled={resending}>
          {resending ? 'Resending...' : 'Resend OTP'}
        </button>
        <Link to="/forgot-password" className="btn-link auth-inline-link">
          Change Email
        </Link>
      </div>
    </section>
  );
};

export default VerifyResetOtp;
