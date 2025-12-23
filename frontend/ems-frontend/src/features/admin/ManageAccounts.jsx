import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './adminApi';
import { safeParseUser } from '../../lib/safeParse';
import { Users, UserCheck, UserX, UserMinus, Loader2 } from 'lucide-react';

function ManageAccounts() {
  const queryClient = useQueryClient();
  const currentUser = safeParseUser() || {};
  const { data: users, isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.getAllUsers });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateUserStatus(id, status),
    onSuccess: (res) => {
      alert(res.message);
      queryClient.invalidateQueries(['admin', 'users']);
    }
  });

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'SUSPENDED':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'INACTIVE':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Account Governance</h1>
        <p className="text-slate-500 font-medium">Oversee system access and roles.</p>
      </header>

      <div className="ems-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users?.map(u => {
              const isSelf = u.userID === currentUser.userID;

              return (
                <tr key={u.userID} className={`hover:bg-slate-50/50 transition-all ${isSelf ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          {u.firstName} {u.lastName}
                          {isSelf && <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] rounded uppercase font-black">You</span>}
                        </p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">{u.role}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black border uppercase ${getStatusBadge(u.accountStatus)}`}>
                      {u.accountStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isSelf ? (
                      <span className="text-[10px] font-bold text-slate-400 italic">Current Session</span>
                    ) : (
                      <div className="flex justify-end gap-1">
                        {u.accountStatus !== 'ACTIVE' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: u.userID, status: 'ACTIVE' })}
                            className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"
                            title="Activate Account"
                          >
                            <UserCheck size={18} />
                          </button>
                        )}
                        {u.accountStatus !== 'SUSPENDED' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: u.userID, status: 'SUSPENDED' })}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                            title="Suspend Account"
                          >
                            <UserX size={18} />
                          </button>
                        )}
                        {u.accountStatus !== 'INACTIVE' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: u.userID, status: 'INACTIVE' })}
                            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg transition-all"
                            title="Disable/Deactivate Account"
                          >
                            <UserMinus size={18} />
                          </button>
                        )}
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
