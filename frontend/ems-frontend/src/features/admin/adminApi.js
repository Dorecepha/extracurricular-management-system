import api from '../../lib/axios';

export const adminApi = {
  getReviewQueue: async () => {
    const response = await api.get('/admin/queue');
    return response.data.data;
  },
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
  },
  getAllUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data.data;
  },
  updateUserStatus: async (userID, status) => {
    const res = await api.put(`/admin/users/${userID}/status?status=${status}`);
    return res.data;
  },
  updateUserRole: async (userID, role) => {
    const res = await api.put(`/admin/users/${userID}/role?role=${role}`);
    return res.data;
  }
};
