import api from '../../lib/axios';

export const authApi = {
  /**
   * Login user and return unwrapped auth data
   * Backend returns: { statusCode: 200, message: "Login Successful", data: AuthResponse }
   * AuthResponse: { token: string, email: string, role: string, id: Long }
   */
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    // Unwrap the response wrapper to get the actual data
    return response.data.data;
  },

  /**
   * Register new user
   * Backend returns: { statusCode: 201, message: "User Registered Successfully", data: AuthResponse }
   */
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data.data;
  },

  /**
   * Logout user (if backend endpoint exists)
   */
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  }
};
