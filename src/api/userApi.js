import apiClient from './apiClient';

export const loginUser = async (email, password) => {
  const response = await apiClient.post('/users/login', { email, password });
  return response.data;
};

export const registerUser = async ({ name, email, password }) => {
  const response = await apiClient.post('/users/register', { name, email, password });
  return response.data;
};

export const fetchMyProfile = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};

export const fetchAllUsers = async () => {
  const response = await apiClient.get('/users');
  return response.data;
};

export const requestPasswordResetOtp = async (email) => {
  const response = await apiClient.post('/users/forgot-password', { email });
  return response.data;
};

export const verifyPasswordResetOtp = async ({ email, otp }) => {
  const response = await apiClient.post('/users/verify-reset-otp', { email, otp });
  return response.data;
};

export const resetPasswordWithOtp = async ({ email, resetToken, password, confirmPassword }) => {
  const response = await apiClient.post('/users/reset-password', {
    email,
    resetToken,
    password,
    confirmPassword,
  });
  return response.data;
};
