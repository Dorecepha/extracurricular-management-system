import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from './adminApi';
import { Clock, CheckSquare, RefreshCcw, ChevronRight, Loader2, Inbox } from 'lucide-react';

function ProposalReviewList() {
  const navigate = useNavigate();

  const { data: queueItems, isLoading } = useQuery({
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

  const combinedQueue = (queueItems || []).sort((a, b) =>
    new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-black text-slate-900 uppercase italic">Review Inbox</h1>
        <p className="text-slate-500 font-bold italic">{combinedQueue.length} items requiring attention</p>
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
              onClick={() => navigate(item.reviewType === 'NEW_PROPOSAL' ? `/admin/proposals/${item.id}` : '/admin/updates')}
              className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm hover:shadow-xl cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5 ${
                    item.reviewType === 'NEW_PROPOSAL' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {item.reviewType === 'NEW_PROPOSAL' ? <CheckSquare size={12}/> : <RefreshCcw size={12}/>}
                    {item.reviewType?.toString().replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-black text-slate-300">ID: {item.id}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#1f5f89] transition-colors uppercase">{item.title}</h3>
                <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                  <Clock size={14}/> Submitted: {(item.submittedAt || '').toString().split('T')[0]}
                </p>
              </div>
              <ChevronRight className="text-slate-200 group-hover:text-[#1f5f89] transition-all group-hover:translate-x-2" size={32} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProposalReviewList;
