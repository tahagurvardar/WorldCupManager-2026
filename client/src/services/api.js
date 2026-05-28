import axios from 'axios';

const tokenKey = 'wcm2026.token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(tokenKey);
    }
    return Promise.reject(error);
  },
);

export function getApiError(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}
