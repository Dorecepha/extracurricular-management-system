import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventApi } from './api';
import { ClipboardList, Clock, CheckCircle, XCircle, Loader2, Info } from 'lucide-react';

function MyProposalsList() {
  const [filter, setFilter] = useState('ALL');

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['my-proposals'],
    queryFn: () => eventApi.getMyProposals()
  });

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#1f5f89]" size={48} /></div>;

  const allProposals = Array.isArray(rawData) ? rawData : rawData?.content || [];
  const proposals = allProposals.filter(p => filter === 'ALL' || p.status === filter);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'APPROVED': return 'bg-green-50 text-green-700 border-green-100';
      case 'REJECTED': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic leading-none">Application History</h1>
          <p className="text-slate-500 font-bold italic mt-2">Tracking your event submissions.</p>
        </div>
        
        {/* Filter UI */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${filter === s ? 'bg-white text-[#1f5f89] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {s}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4">
        {proposals.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-200">
            <ClipboardList className="mx-auto mb-4 text-slate-200" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest">No {filter !== 'ALL' ? filter.toLowerCase() : ''} applications found</p>
          </div>
        ) : (
          proposals.map((p) => (
            <div key={p.proposalID} className="bg-white border-2 border-slate-100 p-8 rounded-[32px] shadow-sm flex items-center justify-between group">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-slate-900">{p.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase ${getStatusStyle(p.status)}`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                  <span className="flex items-center gap-1"><Clock size={14}/> {p.submittedAt?.split('T')[0]}</span>
                  <span className="text-slate-200">|</span>
                  <span className="text-slate-900">{p.organizationType}</span>
                </div>
                {p.rejectionReason && (
                   <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-xs font-bold italic flex items-start gap-2">
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <span>Admin Reason: "{p.rejectionReason}"</span>
                   </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyProposalsList;
