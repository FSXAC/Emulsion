import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for logging (development only)
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    }
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
