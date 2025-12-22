import api from '../../lib/axios';

export const eventApi = {
  /**
   * Corrected for: Response<Page<EventDTO>> 
   */
  getEvents: async (page = 0) => {
    const response = await api.get(`/events?page=${page}&size=9`);
    // Axios response.data = { statusCode, message, data: { content: [], totalPages... } }
    return response.data.data; 
  },

  /**
   * Corrected for: ProposalRequest DTO mapping
   */
  createProposal: async (payload) => {
    // payload must match ProposalRequest DTO exactly
    const response = await api.post('/proposals', payload);
    return response.data;
  }
};

export default eventApi;