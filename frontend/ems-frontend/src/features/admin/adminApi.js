import api from '../../lib/axios';

export const adminApi = {
  getPendingProposals: async () => {
    const response = await api.get('/admin/proposals');
    return response.data.data;
  },
  getProposalById: async (id) => {
    const response = await api.get(`/admin/proposals/${id}`);
    return response.data.data;
  },
  approveProposal: async (id) => {
    const response = await api.put(`/admin/proposals/${id}/approve`);
    return response.data;
  },
  rejectProposal: async (id, rejectionReason) => {
    const response = await api.put(`/admin/proposals/${id}/reject`, { rejectionReason });
    return response.data;
  }
};
