import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to automatically attach authorization bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('geoguard_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('geoguard_access_token');
      localStorage.removeItem('geoguard_refresh_token');
    }
    return Promise.reject(error);
  }
);
