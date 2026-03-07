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
  getAllUsers: async (page = 0, size = 10, role = null, accountStatus = null, search = null) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (role) params.append('role', role);
    if (accountStatus) params.append('accountStatus', accountStatus);
    if (search) params.append('search', search);
    const res = await api.get(`/admin/users?${params.toString()}`);
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
