import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from './api';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Edit3,
  X,
  MapPin,
  Paperclip,
  FileText
} from 'lucide-react';

const parseAttachments = (json) => {
  try {
    const parsed = JSON.parse(json || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function MyProposalsList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [editingProposal, setEditingProposal] = useState(null);
  const [fileList, setFileList] = useState([]);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['my-proposals'],
    queryFn: eventApi.getMyProposals
  });

  const resubmitMutation = useMutation({
    mutationFn: ({ id, data }) => eventApi.resubmitProposal(id, data),
    onSuccess: () => {
      alert('Proposal updated and returned to review queue.');
      setEditingProposal(null);
      setFileList([]);
      queryClient.invalidateQueries(['my-proposals']);
    }
  });

  if (isLoading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-[#1f5f89]" size={48} />
      </div>
    );
  }

  const allProposals = Array.isArray(rawData) ? rawData : rawData?.content || [];
  const proposals = allProposals.filter((p) => filter === 'ALL' || p.status === filter);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'REJECTED':
        return <XCircle className="text-red-500" size={16} />;
      default:
        return <Clock className="text-blue-500" size={16} />;
    }
  };

  const startEditing = (proposal) => {
    const attachments = parseAttachments(proposal.attachmentsJson);
    setEditingProposal({ ...proposal, attachmentsJson: proposal.attachmentsJson });
    setFileList(attachments);
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const processed = await Promise.all(
      selectedFiles.map(async (file) => ({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type,
        dataUrl: await readFileAsDataUrl(file)
      }))
    );
    setFileList(processed);
    setEditingProposal((prev) =>
      prev
        ? {
            ...prev,
            attachmentsJson: JSON.stringify(processed)
          }
        : prev
    );
  };

  const handleRemoveFile = (index) => {
    const updated = fileList.filter((_, i) => i !== index);
    setFileList(updated);
    setEditingProposal((prev) =>
      prev
        ? {
            ...prev,
            attachmentsJson: JSON.stringify(updated)
          }
        : prev
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Applications</h1>
          <p className="text-slate-500">Manage and track your event hosting requests.</p>
        </div>
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl gap-1">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                filter === status ? 'bg-white text-[#1f5f89] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4">
        {proposals.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-200">
            <ClipboardList className="mx-auto mb-4 text-slate-200" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest">
              No {filter !== 'ALL' ? filter.toLowerCase() : ''} proposals found
            </p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <div
              key={proposal.proposalID}
              className="bg-white border-2 border-slate-100 p-8 rounded-[32px] shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-slate-900">{proposal.title}</h3>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${
                        proposal.status === 'APPROVED'
                          ? 'bg-green-50 border-green-100 text-green-700'
                          : proposal.status === 'REJECTED'
                            ? 'bg-red-50 border-red-100 text-red-700'
                            : 'bg-blue-50 border-blue-100 text-blue-700'
                      }`}
                    >
                      {getStatusIcon(proposal.status)}
                      {proposal.status}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 uppercase tracking-tight">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-[#1f5f89]" /> {proposal.proposedDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#1f5f89]" /> {proposal.venue}
                    </span>
                  </div>

                  {proposal.rejectionReason && (
                    <div className="bg-red-50 p-5 rounded-2xl border border-red-100 space-y-1">
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                        Administrator Feedback
                      </p>
                      <p className="text-red-700 text-sm font-medium italic">"{proposal.rejectionReason}"</p>
                    </div>
                  )}
                </div>

                {proposal.status === 'REJECTED' && (
                  <div className="flex items-center">
                    <button
                      onClick={() => startEditing(proposal)}
                      className="flex items-center gap-2 bg-[#1f5f89] text-white px-6 py-3 rounded-2xl font-bold text-xs hover:bg-[#164565] transition-all shadow-lg shadow-[#1f5f89]/20"
                    >
                      <Edit3 size={16} /> Edit & Resubmit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {editingProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-[#1f5f89] p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight">Modify Proposal</h2>
              <button
                onClick={() => {
                  setEditingProposal(null);
                  setFileList([]);
                }}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="p-8 space-y-6 max-h-[70vh] overflow-y-auto"
              onSubmit={(e) => {
                e.preventDefault();
                resubmitMutation.mutate({
                  id: editingProposal.proposalID,
                  data: {
                    ...editingProposal,
                    attachmentsJson: JSON.stringify(fileList)
                  }
                });
              }}
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Event Title</label>
                <input
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold"
                  value={editingProposal.title}
                  onChange={(e) => setEditingProposal({ ...editingProposal, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold"
                    value={editingProposal.proposedDate}
                    onChange={(e) => setEditingProposal({ ...editingProposal, proposedDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Venue</label>
                  <input
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold"
                    value={editingProposal.venue}
                    onChange={(e) => setEditingProposal({ ...editingProposal, venue: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Description</label>
                <textarea
                  rows="4"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-medium text-sm"
                  value={editingProposal.description}
                  onChange={(e) => setEditingProposal({ ...editingProposal, description: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                  <Paperclip size={14} /> Support Paperwork
                </label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center hover:border-[#1f5f89] hover:bg-blue-50/30 transition-all cursor-pointer">
                  <input
                    type="file"
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleFileChange}
                  />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Upload new files to overwrite existing attachments
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">PDF, DOCX supported</p>
                </div>

                {fileList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {fileList.map((file, index) => (
                      <div
                        key={index}
                        className="bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold shadow-sm"
                      >
                        <FileText size={12} />
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProposal(null);
                    setFileList([]);
                  }}
                  className="flex-1 font-bold text-slate-400"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={resubmitMutation.isPending}
                  className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-900/10"
                >
                  {resubmitMutation.isPending ? 'Resubmitting...' : 'Send to Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProposalsList;
