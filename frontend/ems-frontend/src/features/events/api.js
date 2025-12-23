import api from '../../lib/axios';

export const eventApi = {
  /**
   * Corrected for: Response<Page<EventDTO>>
   */
  getEvents: async (page = 0, search = '') => {
    const params = new URLSearchParams({ page, size: 9 });
    if (search) params.append('search', search);
    const response = await api.get(`/events?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Corrected for: ProposalRequest DTO mapping
   */
  createProposal: async (payload) => {
    const response = await api.post('/proposals', payload);
    return response.data;
  },

  getMyProposals: async () => {
    const response = await api.get('/proposals');
    return response.data.data;
  },

  resubmitProposal: async (proposalID, formData) => {
    const response = await api.put(`/proposals/${proposalID}/resubmit`, formData);
    return response.data;
  },

  registerForEvent: async (eventID) => {
    const response = await api.post(`/registrations/event/${eventID}`);
    return response.data;
  },

  getMyRegistrations: async () => {
    const response = await api.get('/registrations/me');
    return response.data.data;
  },

  cancelRegistration: async (registrationID) => {
    const response = await api.delete(`/registrations/${registrationID}`);
    return response.data;
  },

  getEventById: async (eventID) => {
    const response = await api.get(`/events/${eventID}`);
    return response.data.data;
  },

  getManagedEvents: async () => {
    const response = await api.get('/events/managed');
    return response.data.data;
  },
};

export default eventApi;
