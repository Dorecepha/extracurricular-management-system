import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './adminApi';
import { safeParseUser } from '../../lib/safeParse';
import { Loader2 } from 'lucide-react';

function ManageAccounts() {
  const queryClient = useQueryClient();
  const currentUser = safeParseUser() || {};
  
  const { data: users, isLoading } = useQuery({ 
    queryKey: ['admin', 'users'], 
    queryFn: adminApi.getAllUsers 
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateUserStatus(id, status),
    onSuccess: (res) => {
      alert(res.message);
      queryClient.invalidateQueries(['admin', 'users']);
    }
  });

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
      </div>
    </div>
  );
}
export default ManageAccounts;
