import axios from 'axios';

const api = axios.create({
  // VITE_ prefix is required for Vite env vars
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If no token, just send the request without it (guest browsing)
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // API returns { statusCode: 200, message: "...", data: { ... } }
    // We unwrap it here so components just get the inner 'data' or the full wrapper if preferred.
    // Let's return the full response object for now, components access response.data
    return response;
  },
  (error) => {
    let message = 'Something went wrong. Please try again later.';

    // Handle Backend Wrapper Error format if exists
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === 'string') {
        message = data;
      } else if (typeof data === 'object') {
        // Look for standard error fields
        message = data.message || data.error || message;
      }
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
