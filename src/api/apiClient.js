import axios from 'axios';

// Central axios instance so API base URL can be managed from one place.
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token on every request when user is logged in.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('markethub_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
