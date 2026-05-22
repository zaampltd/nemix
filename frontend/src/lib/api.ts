import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 60000, // 60s — enough for large dataset uploads
});

// ── Request interceptor: attach JWT token ──────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────
let _offlineWarningShown = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError = !error.response;

    if (isNetworkError) {
      if (!_offlineWarningShown) {
        console.warn('[API] Backend is offline. Running in offline/demo mode.');
        _offlineWarningShown = true;
      }
      error.isOffline = true;
    }

    // Auto-redirect on 401 (expired/invalid token)
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const token = localStorage.getItem('token');
      // Only redirect if we're inside the dashboard (not on auth pages) and NOT using a local sandbox token
      if (path.startsWith('/dashboard') && (!token || !token.startsWith('local-token-'))) {
        localStorage.removeItem('token');
        localStorage.removeItem('current_user');
        window.location.href = '/auth/login?expired=true';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
