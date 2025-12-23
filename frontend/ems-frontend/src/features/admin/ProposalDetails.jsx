import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './adminApi';
import { eventApi } from '../events/api';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';

function ProposalDetails() {
  const { proposalID } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { data: proposal, isLoading } = useQuery({
    queryKey: ['proposals', proposalID],
    queryFn: () => eventApi.getProposalById(proposalID)
  });

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveProposal(proposalID),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'proposals']);
      navigate('/admin/proposals');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectProposal(proposalID, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'proposals']);
      navigate('/admin/proposals');
    }
  });

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-primary transition-colors">
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-3xl font-black text-slate-900">{proposal.title}</h1>
          <p className="text-slate-500 mt-2 font-medium">{proposal.description}</p>
        </div>

        <div className="p-8 grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proposed Venue</h4>
            <p className="font-bold text-slate-800">{proposal.venue}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proposed Schedule</h4>
            <p className="font-bold text-slate-800">{proposal.proposedDate} | {proposal.startTime} - {proposal.endTime}</p>
          </div>
        </div>

        <div className="p-8 bg-slate-900 flex justify-between items-center">
          <div className="text-white">
            <p className="text-xs font-bold text-slate-400 uppercase">Organizer</p>
            <p className="text-lg font-bold">{proposal.organizerName}</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle size={20}/> Approve
            </button>
            <button 
              onClick={() => setRejectModalOpen(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition"
            >
              <XCircle size={20}/> Reject
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Reject Proposal</h2>
            <textarea 
              className="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-primary outline-none transition"
              placeholder="Provide a reason for rejection..."
              rows="4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-4 mt-6">
              <button onClick={() => setRejectModalOpen(false)} className="flex-1 font-bold text-slate-500">Cancel</button>
              <button 
                onClick={() => rejectMutation.mutate()}
                disabled={!reason || rejectMutation.isPending}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProposalDetails;