import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 5000, // Don't hang forever — fail fast after 5s
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

// ── Response interceptor: silence network-down noise ──────────────────────
// When the backend is offline every mounted page fires an AxiosError: Network Error.
// We convert those to a quiet, typed error so catch blocks can distinguish
// "server is offline" from real API errors without flooding the console.
let _offlineWarningShown = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError = !error.response; // no response = backend unreachable

    if (isNetworkError) {
      if (!_offlineWarningShown) {
        console.warn('[API] Backend is offline (localhost:8000). Running in offline mode.');
        _offlineWarningShown = true;
      }
      // Tag the error so pages can detect it without re-checking
      error.isOffline = true;
    }

    return Promise.reject(error);
  }
);

export default api;
