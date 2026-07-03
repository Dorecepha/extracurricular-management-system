import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from './adminApi';
import { Clock, CheckSquare, RefreshCcw, ChevronRight, Loader2, Inbox } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

function ProposalReviewList() {
  const navigate = useNavigate();

  const { data: queueItems, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'queue'],
    queryFn: adminApi.getReviewQueue
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
        <p className="font-bold">Failed to load review queue.</p>
        <p className="text-sm mt-1">{error?.message || 'Please try again.'}</p>
      </div>
    );
  }

  const combinedQueue = (queueItems || []).sort((a, b) =>
    new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
  );
  const proposalCount = combinedQueue.filter((item) => item.reviewType === 'NEW_PROPOSAL').length;
  const updateCount = combinedQueue.filter((item) => item.reviewType !== 'NEW_PROPOSAL').length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Review Inbox</h1>
          <p className="text-slate-500 text-sm font-medium">{combinedQueue.length} items requiring attention</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">Proposals: {proposalCount}</span>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">Modifications: {updateCount}</span>
        </div>
      </header>

      <div className="grid gap-4">
        {combinedQueue.length === 0 ? (
          <div className="bg-white border-2 border-dashed rounded-[40px] py-32 text-center text-slate-400">
            <Inbox size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-xl font-black uppercase tracking-widest">Inbox Zero</p>
          </div>
        ) : (
          combinedQueue.map((item) => (
            <div 
              key={`${item.reviewType}-${item.id}`}
              onClick={() => navigate(item.reviewType === 'NEW_PROPOSAL' ? `/admin/proposals/${item.id}` : `/admin/updates/${item.id}`)}
              className="ems-card p-6 hover:shadow-lg hover:border-blue-200 cursor-pointer transition-all flex items-center justify-between gap-4 group"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                    item.reviewType === 'NEW_PROPOSAL' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {item.reviewType === 'NEW_PROPOSAL' ? <CheckSquare size={12}/> : <RefreshCcw size={12}/>}
                    {item.reviewType === 'NEW_PROPOSAL' ? 'New Proposal' : 'Modification'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">ID #{item.id}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#1f5f89] transition-colors leading-snug">{item.title}</h3>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <Clock size={14}/> Submitted {formatDate(item.submittedAt)}
                </p>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-[#1f5f89] transition-all group-hover:translate-x-2" size={28} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProposalReviewList;
