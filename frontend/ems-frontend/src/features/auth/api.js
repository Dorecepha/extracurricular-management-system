import api from '../../lib/axios';

export const authApi = {
  login: async (payload) => {
    const response = await api.post('/auth/login', payload);
    return response.data.data;
  }
};
