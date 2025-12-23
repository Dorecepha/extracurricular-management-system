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

  // ADMIN: Get single update
  getUpdateById: async (requestID) => {
    const response = await api.get(`/updates/${requestID}`);
    return response.data.data;
  },

  // ADMIN: Approve/Reject with optional notify
  approveUpdate: async (requestID, notify = false) => {
    const response = await api.put(`/updates/${requestID}/approve?notify=${notify}`);
    return response.data;
  },

  rejectUpdate: async (requestID, reason, notify = false) => {
    const response = await api.put(`/updates/${requestID}/reject?notify=${notify}`, { rejectionReason: reason });
    return response.data;
  }
};

export default updateApi;
