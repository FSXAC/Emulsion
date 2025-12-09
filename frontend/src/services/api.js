import axios from 'axios';

// Base API configuration
// In production, use relative URL (served from same origin)
// In development, point to backend server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.MODE === 'production' 
    ? ''  // Empty string - routes already have /api prefix from backend router
    : 'http://localhost:8200'  // Backend dev server
);

// Log configuration for debugging
console.log('[API Config]', {
  mode: import.meta.env.MODE,
  baseURL: API_BASE_URL,
  envVar: import.meta.env.VITE_API_BASE_URL,
});

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // Always log in console for debugging (including production)
    console.log(`[API] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Success response - return data directly
    return response.data;
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      console.error(`[API Error] ${status}:`, data);
      
      // Enhance error with user-friendly message
      const enhancedError = new Error(
        data?.detail || data?.message || `Request failed with status ${status}`
      );
      enhancedError.status = status;
      enhancedError.response = error.response;
      
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Request made but no response received
      console.error('[API Error] No response received:', error.message);
      const networkError = new Error('Unable to connect to server. Please check your connection.');
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    } else {
      // Something else happened
      console.error('[API Error] Request setup failed:', error.message);
      return Promise.reject(error);
    }
  }
);

export default api;
