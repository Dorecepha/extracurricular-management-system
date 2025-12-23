import api from '../../lib/axios';

export const eventApi = {
  /**
   * Corrected for: Response<Page<EventDTO>> 
   */
  getEvents: async (page = 0) => {
    const response = await api.get(`/events?page=${page}&size=9`);
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

  resubmitProposal: async (proposalID, data) => {
    const response = await api.put(`/proposals/${proposalID}/resubmit`, data);
    return response.data;
  }
};

export default eventApi;
