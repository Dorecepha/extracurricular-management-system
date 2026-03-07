import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './adminApi';
import { safeParseUser } from '../../lib/safeParse';
import { Loader2, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

function ManageAccounts() {
  const queryClient = useQueryClient();
  const currentUser = safeParseUser() || {};

  // Pagination and filter state
  const [page, setPage] = useState(0);
  const [role, setRole] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data: usersPage, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, role, accountStatus, search],
    queryFn: () => adminApi.getAllUsers(page, 10, role || null, accountStatus || null, search || null)
  });

  const users = usersPage?.content || [];
  const totalPages = usersPage?.totalPages || 0;
  const totalElements = usersPage?.totalElements || 0;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateUserStatus(id, status),
    onSuccess: (res) => {
      alert(res.message);
      queryClient.invalidateQueries(['admin', 'users']);
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0); // Reset to first page on new search
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'role') setRole(value);
    if (filterType === 'accountStatus') setAccountStatus(value);
    setPage(0); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setRole('');
    setAccountStatus('');
    setSearch('');
    setSearchInput('');
    setPage(0);
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  const getStatusBadge = (status) => {
    switch(status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'SUSPENDED': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'INACTIVE': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const getActionsForStatus = (status) => {
    if (status === 'ACTIVE') {
      return [
        { next: 'SUSPENDED', label: 'Suspend', className: 'text-rose-700 border-rose-200 hover:bg-rose-50' },
        { next: 'INACTIVE', label: 'Disable', className: 'text-slate-700 border-slate-200 hover:bg-slate-50' },
      ];
    }
    if (status === 'SUSPENDED' || status === 'INACTIVE') {
      return [{ next: 'ACTIVE', label: 'Activate', className: 'text-emerald-700 border-emerald-200 hover:bg-emerald-50' }];
    }
    return [];
  };

  return (
    <div className="ems-page">
      <header>
        <h1 className="ems-heading">Account Governance</h1>
        <p className="text-slate-500 text-sm font-medium">Manage university user access and lifecycle states.</p>
      </header>

      {/* Filters and Search */}
      <div className="ems-card mb-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </form>

          {/* Filters */}
          <div className="flex gap-3 items-center flex-wrap">
            <Filter className="text-slate-400" size={18} />

            {/* Role Filter */}
            <select
              value={role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="ORGANIZER">Event Organizer</option>
              <option value="ADMIN">Administrator</option>
            </select>

            {/* Status Filter */}
            <select
              value={accountStatus}
              onChange={(e) => handleFilterChange('accountStatus', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Clear Filters Button */}
            {(role || accountStatus || search) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-bold text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 text-xs text-slate-500 font-medium">
          Showing {users.length === 0 ? 0 : page * 10 + 1}-{Math.min((page + 1) * 10, totalElements)} of {totalElements} accounts
        </div>
      </div>

      <div className="ems-card">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">User Identity</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Account Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {users?.map(u => {
              const isSelf = u.userID === currentUser.userID;
              return (
                <tr key={u.userID} className={`hover:bg-slate-50/50 transition-all ${isSelf ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">
                      {u.firstName} {u.lastName} 
                      {isSelf && <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-[8px] rounded uppercase font-black">You</span>}
                    </p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600 uppercase text-[10px] tracking-wide">{u.role}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${getStatusBadge(u.accountStatus)}`}>
                      {u.accountStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isSelf ? (
                      <span className="text-[10px] font-bold text-slate-300 italic">Self-Locked</span>
                    ) : (
                      <div className="flex justify-end gap-1">
                        {getActionsForStatus(u.accountStatus).map(action => (
                          <button
                            key={action.next}
                            onClick={() => statusMutation.mutate({ id: u.userID, status: action.next })}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wide border rounded-md transition-colors ${action.className}`}
                            title={`${action.label} Account`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 font-medium">
                Page {page + 1} of {totalPages}
              </span>
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* No Results Message */}
        {users.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm font-medium">No accounts found matching your criteria.</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 text-sm font-bold text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default ManageAccounts;
