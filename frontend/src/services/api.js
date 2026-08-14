import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

function resolveBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
  if (!configured) return '/api';
  return configured.endsWith('/api') ? configured : `${configured}/api`;
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
