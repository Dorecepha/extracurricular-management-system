import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { ShieldAlert, Loader2, Clock, User } from 'lucide-react';

function AuditLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: async () => {
      const res = await api.get('/admin/activity/logs');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ShieldAlert className="text-blue-600" /> System Audit Trail
        </h1>
        <p className="text-slate-500 font-medium">
          Immutable record of all administrative and security actions.
        </p>
      </header>

      <div className="ems-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Timestamp
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                User
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Action
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Entity
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs?.map((log) => (
              <tr key={log.logID} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock size={12} />
                    {log.timestamp ? log.timestamp.replace('T', ' ') : ''}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <User size={14} /> {log.userEmail}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-black uppercase">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-600">
                  {log.entityType} #{log.entityID}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs font-bold ${
                      log.result === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {log.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogs;
