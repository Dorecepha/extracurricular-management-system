import api from '../../lib/axios';

export const adminApi = {
  /**
   * Fetch all proposals with status PENDING
   */
  getPendingProposals: async () => {
    const response = await api.get('/admin/proposals');
    return response.data.data;
  },

  /**
   * Approves a proposal and triggers event creation
   */
  approveProposal: async (proposalID) => {
    const response = await api.put(`/admin/proposals/${proposalID}/approve`);
    return response.data;
  },

  /**
   * Rejects a proposal with a reason
   */
  rejectProposal: async (proposalID, rejectionReason) => {
    const response = await api.put(`/admin/proposals/${proposalID}/reject`, {
      rejectionReason // Matches the Backend DTO
    });
    return response.data;
  }
};