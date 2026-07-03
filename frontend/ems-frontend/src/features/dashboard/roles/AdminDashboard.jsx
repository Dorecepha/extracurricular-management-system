import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ArrowRight, AlertCircle, FileEdit, FileCheck } from 'lucide-react';
import { adminApi } from '../../admin/adminApi';
import { safeGetItem } from '../../../lib/safeParse';
import StatCard from '../../../components/StatCard';

const STAGE_INFO = {
  YOUTH_UNION: { stage: 'L1', label: 'Youth Union' },
  STUDENT_ASSOCIATION: { stage: 'L1', label: 'Student Association' },
  FACULTY: { stage: 'L2', label: 'Faculty' },
  RECTOR: { stage: 'L3', label: 'Rector' },
};

function AdminDashboard({ stats }) {
  const navigate = useNavigate();
  const dept = safeGetItem('adminDepartment') || 'YOUTH_UNION';
  const stageInfo = STAGE_INFO[dept] || { stage: 'L1', label: dept };

  const { data: queue = [], isLoading: queueLoading } = useQuery({
    queryKey: ['admin-queue'],
    queryFn: adminApi.getReviewQueue,
    staleTime: 1000 * 60,
  });

  const pendingProposals = stats?.pendingProposalsCount ?? 0;
  const pendingUpdates = stats?.pendingUpdatesCount ?? 0;
  const isL1Dept = ['YOUTH_UNION', 'STUDENT_ASSOCIATION'].includes(dept);
  const pendingReports = isL1Dept ? (stats?.pendingReportsCount ?? 0) : 0;
  const totalPending = pendingProposals + pendingUpdates + pendingReports;

  const { data: pendingReportItems = [] } = useQuery({
    queryKey: ['admin-reports-pending'],
    queryFn: () => adminApi.getReports('SUBMITTED'),
    enabled: isL1Dept,
    staleTime: 1000 * 60,
  });

  const visibleQueue = queue.slice(0, 8);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="ems-card p-6 ems-stagger-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ems-label">Review Inbox</p>
            <p className="text-2xl font-bold text-slate-900 leading-snug">
              {totalPending > 0
                ? <>{totalPending} item{totalPending !== 1 ? 's' : ''} <span className="text-amber-500">awaiting review</span></>
                : <span className="text-slate-400">All clear — inbox empty</span>
              }
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <span className="ems-badge bg-amber-100 text-amber-700">
              Stage {stageInfo.stage}
            </span>
            <span className="ems-badge bg-slate-100 text-slate-600">
              {stageInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className={`grid gap-4 ems-stagger-2 ${isL1Dept ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <StatCard
          value={pendingProposals}
          label="Proposals"
          icon={AlertCircle}
          color={pendingProposals > 0 ? 'amber' : 'blue'}
          onClick={() => navigate('/admin/proposals')}
        />
        <StatCard
          value={pendingUpdates}
          label="Modifications"
          icon={FileEdit}
          color={pendingUpdates > 0 ? 'amber' : 'indigo'}
          onClick={() => navigate('/admin/proposals')}
        />
        {isL1Dept && (
          <StatCard
            value={pendingReports}
            label="Reports"
            icon={FileCheck}
            color={pendingReports > 0 ? 'amber' : 'emerald'}
            onClick={() => navigate('/admin/reports')}
          />
        )}
      </div>

      {/* Incoming items queue */}
      <div className="ems-card ems-stagger-3">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Incoming Items
          </h3>
          <button
            onClick={() => navigate('/admin/proposals')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            View All <ArrowRight size={13} />
          </button>
        </div>

        {queueLoading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Loading…
          </div>
        ) : visibleQueue.length === 0 && pendingReportItems.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-500">No pending items</p>
            <p className="text-xs text-slate-400 mt-1">All reviews are up to date</p>
          </div>
        ) : (
          <div>
            {pendingReportItems.slice(0, 4).map((report, index) => (
              <div
                key={`report-${report.reportID}`}
                onClick={() => navigate(`/admin/reports/${report.reportID}`)}
                className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                style={{ animationDelay: `${index * 55}ms` }}
              >
                <span className="ems-badge flex-shrink-0 bg-emerald-100 text-emerald-700">
                  Report
                </span>
                <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                  Event #{report.eventID}{report.affiliatedOrg ? ` · ${report.affiliatedOrg}` : ''}
                </span>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {report.submittedAt ? formatDistanceToNow(parseISO(report.submittedAt), { addSuffix: true }) : '—'}
                </span>
                <ArrowRight size={14} className="text-slate-300 flex-shrink-0" />
              </div>
            ))}
            {visibleQueue.map((item, index) => {
              const isProposal = item.reviewType === 'NEW_PROPOSAL';
              const href = isProposal ? `/admin/proposals/${item.id}` : `/admin/proposals`;
              return (
                <div
                  key={`${item.reviewType}-${item.id}`}
                  onClick={() => navigate(href)}
                  className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <span className={`ems-badge flex-shrink-0 ${isProposal ? 'ems-badge-info' : 'bg-violet-100 text-violet-700'}`}>
                    {isProposal ? 'Proposal' : 'Edit Req'}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                    {item.title}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {item.submittedAt ? formatDistanceToNow(parseISO(item.submittedAt), { addSuffix: true }) : '—'}
                  </span>
                  <ArrowRight size={14} className="text-slate-300 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
