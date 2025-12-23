import api from '../../lib/axios';

export const updateApi = {
  // ORGANIZER: Submit a request
  submitUpdateRequest: async (eventID, formData) => {
    const response = await api.post(`/updates/event/${eventID}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // ADMIN: Get pending updates
  getPendingUpdates: async () => {
    const response = await api.get('/updates/pending');
    return response.data.data;
  },

  // ADMIN: Approve/Reject
  approveUpdate: async (requestID) => {
    const response = await api.put(`/updates/${requestID}/approve`);
    return response.data;
  },

  rejectUpdate: async (requestID, reason) => {
    const response = await api.put(`/updates/${requestID}/reject`, { reason });
    return response.data;
  }
};
