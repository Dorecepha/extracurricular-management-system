import api from '../../lib/axios';

export const reportApi = {
  getReport: async (eventID) => {
    const response = await api.get(`/reports/${eventID}`);
    return response.data.data;
  },

  submitReport: async (eventID, formData) => {
    const response = await api.post(`/reports/${eventID}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getCompletedEvents: async () => {
    const response = await api.get('/events/managed/completed');
    return response.data.data;
  },
};
