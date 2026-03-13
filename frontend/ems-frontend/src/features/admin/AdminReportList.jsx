import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from './adminApi';
import { Clock, ChevronRight, Loader2, Inbox, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const STATUS_STYLES = {
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-100',
  LATE_SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
  NOT_SUBMITTED: 'bg-slate-50 text-slate-500 border-slate-100',
};

const STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  LATE_SUBMITTED: 'Late Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NOT_SUBMITTED: 'Not Submitted',
};

const ORG_STYLES = {
  YOUTH_UNION: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  STUDENT_ASSOCIATION: 'bg-purple-50 text-purple-700 border-purple-100',
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true });
  } catch {
    return value;
  }
};

function AdminReportList() {
  const navigate = useNavigate();

  const { data: reports = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminApi.getReports(),
    staleTime: 1000 * 60,
  });

  if (isLoading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-[#1f5f89]" size={48} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-20 text-center text-red-500">
        <p className="font-bold">Failed to load reports.</p>
        <p className="text-sm mt-1">{error?.message || 'Please try again.'}</p>
      </div>
    );
  }

  const pendingReports = reports.filter(r =>
    r.status === 'SUBMITTED' || r.status === 'LATE_SUBMITTED'
  );
  const otherReports = reports.filter(r =>
    r.status !== 'SUBMITTED' && r.status !== 'LATE_SUBMITTED'
  );
  const sorted = [...pendingReports, ...otherReports];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Report Reviews</h1>
          <p className="text-slate-500 text-sm font-medium">
            {pendingReports.length} report{pendingReports.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Submitted: {pendingReports.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-100">
            Total: {reports.length}
          </span>
        </div>
      </header>

      <div className="grid gap-4">
        {sorted.length === 0 ? (
          <div className="bg-white border-2 border-dashed rounded-[40px] py-32 text-center text-slate-400">
            <Inbox size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-xl font-black uppercase tracking-widest">No Reports</p>
            <p className="text-sm mt-2">No reports pending review</p>
          </div>
        ) : (
          sorted.map((report) => {
            const isPending = report.status === 'SUBMITTED' || report.status === 'LATE_SUBMITTED';
            return (
              <div
                key={report.reportID}
                onClick={() => navigate(`/admin/reports/${report.reportID}`)}
                className="ems-card p-6 hover:shadow-lg hover:border-blue-200 cursor-pointer transition-all flex items-center justify-between gap-4 group"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${ORG_STYLES[report.eventType] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {report.eventType === 'YOUTH_UNION' ? 'Youth Union' : 'Student Association'}
                    </span>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${STATUS_STYLES[report.status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {report.status === 'LATE_SUBMITTED' && <AlertTriangle size={11} />}
                      {STATUS_LABELS[report.status] || report.status}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">Report #{report.reportID}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-900 group-hover:text-[#1f5f89] transition-colors">
                      Event ID #{report.eventID}
                      {report.affiliatedOrg && <span className="text-slate-500 font-medium"> · {report.affiliatedOrg}</span>}
                    </p>
                    {report.submitterName && (
                      <p className="text-xs font-medium text-slate-500">
                        Submitted by: <span className="text-slate-700 font-semibold">{report.submitterName}</span>
                        {report.submitterRole && <span className="text-slate-400"> ({report.submitterRole})</span>}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {report.submittedAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Submitted {formatDate(report.submittedAt)}
                      </span>
                    )}
                    {report.deadlineAt && isPending && (
                      <span className="flex items-center gap-1 text-amber-500 font-medium">
                        Deadline: {new Date(report.deadlineAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-[#1f5f89] transition-all group-hover:translate-x-2" size={28} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminReportList;
