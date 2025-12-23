import api from '../../lib/axios';

export const dashboardApi = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  }
};

export default dashboardApi;
