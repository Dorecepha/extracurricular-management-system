import api from '../../lib/axios';

export const dashboardApiV2 = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats-v2');
    return response.data.data; // Extract data from Response wrapper
  },
};
