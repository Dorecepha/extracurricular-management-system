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
    console.error("AXIOS DEBUG:", error); // DNA: See if it's ERR_NETWORK or 403
    const data = error.response?.data;
    const message =
      (typeof data === 'string' && data) ||
      (typeof data === 'object' && data?.message) ||
      `Connection failed. Is the backend running at ${import.meta.env.VITE_API_BASE_URL}?`;

    return Promise.reject(new Error(message));
  }
);

export default api;
