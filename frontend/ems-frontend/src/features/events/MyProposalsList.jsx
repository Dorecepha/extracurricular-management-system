import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from './api';
import { 
  ClipboardList, Clock, CheckCircle, XCircle, Loader2, 
  Edit3, Send, X, MapPin, Calendar, Users, FileUp, Info 
} from 'lucide-react';

const parseAttachments = (json) => {
  try {
    const parsed = JSON.parse(json || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function MyProposalsList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [editingProposal, setEditingProposal] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [error, setError] = useState('');

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['my-proposals'],
    queryFn: () => eventApi.getMyProposals()
  });

  const resubmitMutation = useMutation({
    mutationFn: (formData) => eventApi.resubmitProposal(editingProposal.proposalID, formData),
    onSuccess: () => {
      alert("Application resubmitted successfully!");
      setEditingProposal(null);
      setFileList([]);
      setExistingFiles([]);
      setError('');
      queryClient.invalidateQueries(['my-proposals']);
    },
    onError: (err) => {
      setError(err.message || 'Unable to resubmit right now.');
    }
  });

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFileList([...fileList, ...selected.map(f => ({ name: f.name, raw: f }))]);
  };

  const handleRemoveExisting = (index) => {
    const updated = existingFiles.filter((_, i) => i !== index);
    setExistingFiles(updated);
    if (editingProposal) {
      setEditingProposal({
        ...editingProposal,
        attachmentsJson: JSON.stringify(updated)
      });
    }
  };

  const handleResubmit = (e) => {
    e.preventDefault();
    setError('');
    const data = new FormData();
    data.append('proposal', new Blob([JSON.stringify(editingProposal)], { type: 'application/json' }));
    fileList.forEach(f => data.append('files', f.raw));
    resubmitMutation.mutate(data);
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#1f5f89]" size={48} /></div>;

  const proposals = (Array.isArray(rawData) ? rawData : rawData?.content || [])
    .filter(p => filter === 'ALL' || p.status === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <h1 className="text-4xl font-black text-slate-900 uppercase italic">Application History</h1>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${filter === s ? 'bg-white text-[#1f5f89] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{s}</button>
          ))}
        </div>
      </header>

      <div className="grid gap-4">
        {proposals.map(p => (
          <div key={p.proposalID} className="bg-white border-2 border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group">
            <div className="space-y-2 flex-1">
               <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-slate-900">{p.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase ${p.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700'}`}>{p.status}</span>
               </div>
               <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase"><span className="flex items-center gap-1"><Clock size={14}/> {p.submittedAt?.split('T')[0]}</span></div>
               {p.rejectionReason && <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-xs font-bold italic flex items-center gap-2"><Info size={14}/> Admin Feedback: "{p.rejectionReason}"</div>}
            </div>
            {p.status === 'REJECTED' && (
              <button onClick={() => { 
                const parsed = parseAttachments(p.attachmentsJson);
                setExistingFiles(parsed);
                setEditingProposal({ ...p, attachmentsJson: JSON.stringify(parsed) });
                setFileList([]);
                setError('');
              }} className="px-6 py-3 bg-[#1f5f89] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#164565] transition-all flex items-center gap-2"><Edit3 size={16}/> Edit & Resubmit</button>
            )}
          </div>
        ))}
      </div>

      {editingProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-[#1f5f89] p-8 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-tight italic">Revise Application</h2>
              <button onClick={() => { setEditingProposal(null); setFileList([]); }} className="hover:bg-white/20 p-2 rounded-full"><X size={24} /></button>
            </div>
            
            <form className="p-10 space-y-6 max-h-[75vh] overflow-y-auto" onSubmit={handleResubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 font-bold text-sm p-4 rounded-2xl">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Event Title</label>
                  <input required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={editingProposal.title || ''} onChange={e => setEditingProposal({...editingProposal, title: e.target.value})} />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar size={12}/> Date</label>
                  <input type="date" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={editingProposal.proposedDate || ''} onChange={e => setEditingProposal({...editingProposal, proposedDate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin size={12}/> Venue</label>
                  <input required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={editingProposal.venue || ''} onChange={e => setEditingProposal({...editingProposal, venue: e.target.value})} />
                </div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Clock size={12}/> Start</label><input type="time" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={editingProposal.startTime || ''} onChange={e => setEditingProposal({...editingProposal, startTime: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Clock size={12}/> End</label><input type="time" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={editingProposal.endTime || ''} onChange={e => setEditingProposal({...editingProposal, endTime: e.target.value})} /></div>
                <div className="md:col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Users size={12}/> Capacity</label><input type="number" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={editingProposal.capacity ?? ''} onChange={e => setEditingProposal({...editingProposal, capacity: e.target.value === '' ? '' : Number(e.target.value)})} /></div>
                <div className="md:col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Description</label><textarea rows="3" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-medium text-sm" value={editingProposal.description || ''} onChange={e => setEditingProposal({...editingProposal, description: e.target.value})} /></div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><FileUp size={12}/> New Paperwork</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 cursor-pointer">
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                  <p className="text-[10px] font-black text-slate-400">UPLOAD REVISED FILES</p>
                </div>
                {!!existingFiles.length && (
                  <div className="flex flex-wrap gap-2">
                    {existingFiles.map((f, i) => (
                      <div key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-[10px] flex items-center gap-2 border border-slate-200">
                        {f.name || f.path}
                        <button type="button" onClick={() => handleRemoveExisting(i)} className="text-slate-500 hover:text-red-500">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {fileList.map((f, i) => (
                    <div key={i} className="bg-slate-800 text-white px-3 py-1 rounded-lg text-[10px] flex items-center gap-2">{f.name} <button type="button" onClick={() => setFileList(fileList.filter((_, idx) => idx !== i))}><X size={12}/></button></div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={resubmitMutation.isPending} className="w-full bg-[#1f5f89] text-white py-5 rounded-3xl font-black hover:bg-[#164565] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 uppercase tracking-widest">
                 {resubmitMutation.isPending ? "Resubmitting..." : "Send Back for Review"} <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProposalsList;
