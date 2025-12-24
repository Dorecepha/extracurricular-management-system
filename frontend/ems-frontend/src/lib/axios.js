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
    // Extract the message from our Backend Response Wrapper
    const data = error.response?.data;
    const message =
      (typeof data === 'string' && data) ||
      (typeof data === 'object' && data?.message) ||
      'An unexpected error occurred.';

    return Promise.reject(new Error(message));
  }
);

export default api;
