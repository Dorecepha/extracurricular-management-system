import api from '../../lib/axios';

export const adminApi = {
  /**
   * GET /api/admin/proposals
   * (BaseURL handles /api, so we use /admin/proposals)
   */
  getPendingProposals: async () => {
    const response = await api.get('/admin/proposals');
    // DNA: response.data is the Response<T> wrapper {statusCode, message, data}
    console.log('DEBUG: Admin Proposal Response:', response.data);
    console.log('DEBUG: Unwrapped Proposals:', response.data.data);
    return response.data.data;
  },

  approveProposal: async (proposalID) => {
    const response = await api.put(`/admin/proposals/${proposalID}/approve`);
    return response.data;
  },

  rejectProposal: async (proposalID, rejectionReason) => {
    const response = await api.put(`/admin/proposals/${proposalID}/reject`, { rejectionReason });
    return response.data;
  }
};

export default adminApi;