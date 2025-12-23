import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './adminApi';
import {
  ArrowLeft, CheckCircle, XCircle, Loader2, AlertCircle,
  MapPin, Clock, Users, FileText, Paperclip, ExternalLink
} from 'lucide-react';

const parseFiles = (json) => {
  try {
    const parsed = JSON.parse(json || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Attachment parse error', err);
    return [];
  }
};

function ProposalDetails() {
  const { proposalID } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { data: proposal, isLoading, isError } = useQuery({
    queryKey: ['admin', 'proposals', proposalID],
    queryFn: () => adminApi.getProposalById(proposalID),
  });

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveProposal(proposalID),
    onSuccess: (res) => {
      alert(res.message || 'Proposal Approved!');
      queryClient.invalidateQueries(['admin', 'proposals']);
      navigate('/admin/proposals');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectProposal(proposalID, reason),
    onSuccess: (res) => {
      alert(res.message || 'Proposal Rejected.');
      queryClient.invalidateQueries(['admin', 'proposals']);
      navigate('/admin/proposals');
    }
  });

  if (proposal instanceof TypeError) {
    return <div className="p-20 text-center text-red-500">Proposal details unavailable.</div>;
  }

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#1f5f89]" size={48} /></div>;
  if (isError || !proposal) return <div className="p-20 text-center text-red-500">Proposal details unavailable.</div>;

  const files = parseFiles(proposal.attachmentsJson);

  const handleOpenFile = (file) => {
    if (file?.dataUrl) {
      window.open(file.dataUrl, '_blank', 'noopener');
      return;
    }
    if (file?.url) {
      window.open(file.url, '_blank', 'noopener');
      return;
    }
    alert('No file data available to preview.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-[#1f5f89] transition-colors font-medium text-sm">
        <ArrowLeft size={18} /> Back to Review Queue
      </button>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#1f5f89] p-10 text-white">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {proposal.organizationType}
              </span>
              <h1 className="text-4xl font-black leading-tight">{proposal.title}</h1>
              <p className="text-blue-100/80 font-medium italic flex items-center gap-2">
                Submitted by: <span className="text-white not-italic font-bold">{proposal.organizerName || 'Unknown Submitter'}</span>
              </p>
            </div>
            <div className="bg-black/10 p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
              <p className="text-[10px] font-black uppercase text-blue-200 mb-1">Status</p>
              <p className="font-bold tracking-widest">{proposal.status}</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
               <Clock className="text-[#1f5f89] mb-2" size={20} />
               <p className="text-[10px] font-black text-slate-400 uppercase">Proposed Time</p>
               <p className="font-bold text-slate-900">{proposal.proposedDate}</p>
               <p className="text-xs text-slate-500 font-medium">{proposal.startTime} - {proposal.endTime}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
               <MapPin className="text-[#1f5f89] mb-2" size={20} />
               <p className="text-[10px] font-black text-slate-400 uppercase">Venue</p>
               <p className="font-bold text-slate-900">{proposal.venue}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-1">
               <Users className="text-[#1f5f89] mb-2" size={20} />
               <p className="text-[10px] font-black text-slate-400 uppercase">Max Capacity</p>
               <p className="font-bold text-slate-900">{proposal.capacity} seats available</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <FileText size={18} className="text-[#1f5f89]" /> Detailed Plan
            </h3>
            <div className="text-slate-600 leading-relaxed font-medium bg-slate-50/30 p-8 rounded-3xl border border-slate-100">
              {proposal.description || 'No description provided.'}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Paperclip size={18} className="text-[#1f5f89]" /> Support Paperwork ({files.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {files.length === 0 ? (
                <p className="text-slate-400 text-xs font-bold italic">No files attached to this proposal.</p>
              ) : (
                files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#1f5f89] transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-blue-50 group-hover:text-[#1f5f89] transition-colors">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{file.size}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleOpenFile(file)}
                      className="text-[#1f5f89] p-2 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row gap-4">
            <button 
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-semibold tracking-wide flex items-center justify-center gap-3 transition shadow-lg shadow-green-900/10 disabled:opacity-50"
            >
              <CheckCircle size={20}/> Approve Proposal
            </button>
            <button 
              onClick={() => setRejectModalOpen(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-semibold tracking-wide flex items-center justify-center gap-3 transition shadow-lg shadow-red-900/10"
            >
              <XCircle size={20}/> Reject Proposal
            </button>
          </div>
        </div>
      </div>

      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-slate-900 uppercase mb-2 text-center">Rejection Reason</h2>
            <p className="text-slate-500 font-medium mb-6 text-center text-sm px-4">This feedback will be sent directly to the event organizer.</p>
            <textarea 
              className="w-full border-2 border-slate-100 rounded-3xl p-5 focus:border-red-500 outline-none transition h-32 font-medium text-sm"
              placeholder="Provide a specific reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-4 mt-8">
              <button onClick={() => setRejectModalOpen(false)} className="flex-1 font-bold text-slate-400 text-xs uppercase tracking-widest">Cancel</button>
              <button 
                onClick={() => rejectMutation.mutate()}
                disabled={!reason || rejectMutation.isPending}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-semibold uppercase tracking-widest text-xs disabled:opacity-50 shadow-lg shadow-red-900/10"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProposalDetails;
