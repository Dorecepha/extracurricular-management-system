import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import {
  ShieldAlert,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Clock,
  User,
} from 'lucide-react';

function AuditLogs() {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ field: 'timestamp', dir: 'desc' });
  const pageSize = 15;

  const { data: logData, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', page, sort.field, sort.dir],
    queryFn: async () => {
      const res = await api.get(`/admin/activity/logs?page=${page}&size=${pageSize}&sortBy=${sort.field}&direction=${sort.dir}`);
      return res.data.data;
    },
    keepPreviousData: true,
  });

  const handleExport = async () => {
    const res = await api.get('/admin/activity/export', { responseType: 'blob' });
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ems_audit_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const toggleSort = (field) => {
    setSort((prev) => ({
      field,
      dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc',
    }));
    setPage(0);
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const logs = logData?.content || [];
  const totalPages = logData?.totalPages || 1;

  const headerClass = (field) =>
    `px-6 py-4 cursor-pointer hover:text-blue-600 ${sort.field === field ? 'text-blue-600' : ''}`;

  return (
    <div className="ems-page">
      <header className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-blue-600" size={22} />
          <div>
            <h1 className="ems-heading">System Audit Trail</h1>
            <p className="text-slate-500 text-sm font-medium">Immutable record of system-wide administrative actions.</p>
          </div>
        </div>
        <button onClick={handleExport} className="ems-btn-ghost text-xs font-bold gap-2">
          <Download size={16} /> Export JSON
        </button>
      </header>

      <div className="ems-card">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className={headerClass('timestamp')} onClick={() => toggleSort('timestamp')}>
                <div className="flex items-center gap-1">Time <ArrowUpDown size={12} /></div>
              </th>
              <th className={headerClass('userEmail')} onClick={() => toggleSort('userEmail')}>
                <div className="flex items-center gap-1">User Identity <ArrowUpDown size={12} /></div>
              </th>
              <th className={headerClass('action')} onClick={() => toggleSort('action')}>
                <div className="flex items-center gap-1">Action Type <ArrowUpDown size={12} /></div>
              </th>
              <th className={headerClass('entityType')} onClick={() => toggleSort('entityType')}>
                <div className="flex items-center gap-1">Context <ArrowUpDown size={12} /></div>
              </th>
              <th className={`${headerClass('result')} text-right`} onClick={() => toggleSort('result')}>
                <div className="flex items-center gap-1 justify-end">Status <ArrowUpDown size={12} /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.logID} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock size={12} />
                    {log.timestamp ? log.timestamp.replace('T', ' ') : ''}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">{log.userEmail}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{log.ipAddress}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black uppercase tracking-tighter">{log.action}</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                  {log.entityType} #{log.entityID}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-[10px] font-black ${log.result === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}>{log.result}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="p-2 bg-white border rounded-lg disabled:opacity-30"><ChevronLeft size={16} /></button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="p-2 bg-white border rounded-lg disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
