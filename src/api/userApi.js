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
