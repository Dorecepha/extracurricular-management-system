import api from '../../lib/axios';

export const adminApi = {
  getPendingProposals: async () => {
    const response = await api.get('/admin/proposals');
    return response.data.data;
  },

  /**
   * DNA: Fetch single proposal for detail view
   * Path: /api/admin/proposals/{proposalID}
   */
  getProposalById: async (proposalID) => {
    const response = await api.get(`/admin/proposals/${proposalID}`);
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
