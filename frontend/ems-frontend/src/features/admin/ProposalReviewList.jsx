import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from './adminApi'; // DNA: Use adminApi, not eventApi
import { Clock, MapPin, ChevronRight, Loader2, AlertCircle, Inbox } from 'lucide-react';

function ProposalReviewList() {
  const navigate = useNavigate();
  
  const { data: rawData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'proposals'],
    queryFn: adminApi.getPendingProposals
  });

  // DEBUG: Log the raw data received from React Query
  console.log('DEBUG ProposalReviewList - rawData:', rawData);
  console.log('DEBUG ProposalReviewList - isLoading:', isLoading);
  console.log('DEBUG ProposalReviewList - isError:', isError);
  console.log('DEBUG ProposalReviewList - error:', error);

  if (isLoading) return (
    <div className="flex justify-center p-20">
      <Loader2 className="animate-spin text-[#1f5f89]" size={48} />
    </div>
  );

  if (isError) return (
    <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl text-red-600 font-bold flex items-center gap-3">
      <AlertCircle /> Error: {error.message}
    </div>
  );

  // DNA FIX: Handle Spring Page object or raw List
  const proposals = Array.isArray(rawData) ? rawData : rawData?.content || [];

  // DEBUG: Log the extracted proposals array
  console.log('DEBUG ProposalReviewList - proposals array:', proposals);
  console.log('DEBUG ProposalReviewList - proposals.length:', proposals.length);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Review Queue</h1>
        <p className="text-slate-500 font-bold italic">Pending event applications requiring approval.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {proposals.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] py-32 text-center text-slate-400">
            <Inbox size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl font-black uppercase tracking-widest">No pending proposals</p>
            <p className="text-sm font-medium">All applications have been processed.</p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <div 
              key={proposal.proposalID}
              onClick={() => navigate(`/admin/proposals/${proposal.proposalID}`)}
              className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm hover:shadow-xl hover:border-[#1f5f89]/30 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-50 text-[#1f5f89] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                    {proposal.organizationType}
                  </span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    ID: {proposal.proposalID}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#1f5f89] transition-colors leading-tight">
                    {proposal.title}
                  </h3>
                  <p className="text-slate-500 font-bold text-xs mt-1">Submitted by: {proposal.organizerName || "System Organizer"}</p>
                </div>

                <div className="flex gap-6 text-sm font-bold text-slate-500">
                  <span className="flex items-center gap-2"><Clock size={16} className="text-[#1f5f89]"/> {proposal.proposedDate}</span>
                  <span className="flex items-center gap-2"><MapPin size={16} className="text-[#1f5f89]"/> {proposal.venue}</span>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-[#1f5f89] transition-all group-hover:translate-x-2" size={32} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProposalReviewList;