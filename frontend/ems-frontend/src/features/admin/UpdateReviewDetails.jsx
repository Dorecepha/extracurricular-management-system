import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateApi } from '../events/updateApi';
import { ArrowLeft, Loader2, Mail, RefreshCcw } from 'lucide-react';

function UpdateReviewDetails() {
  const { requestID } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [modalMode, setModalMode] = useState(null); // 'APPROVE' or 'REJECT'
  const [notify, setNotify] = useState(true);
  const [reason, setReason] = useState('');

  const { data: req, isLoading } = useQuery({
    queryKey: ['admin', 'updates', requestID],
    queryFn: () => updateApi.getUpdateById(requestID)
  });

  const mutation = useMutation({
    mutationFn: () => modalMode === 'APPROVE' 
      ? updateApi.approveUpdate(requestID, notify)
      : updateApi.rejectUpdate(requestID, reason, notify),
    onSuccess: (res) => {
      alert(res.message);
      queryClient.invalidateQueries(['admin', 'updates']);
      navigate('/admin/proposals');
    }
  });

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#1f5f89]" size={48} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <button onClick={() => navigate('/admin/proposals')} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs tracking-widest"><ArrowLeft size={16}/> Back to Inbox</button>
      
      <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-amber-600 p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase flex items-center gap-2">
               <RefreshCcw /> Modification Review
            </h2>
            <p className="text-amber-100 font-medium italic">Reason: {req.updateReason || req.reason || 'N/A'}</p>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="space-y-4">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Proposed Changes</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Title', 'Venue', 'Date', 'Capacity', 'Description', 'Status'].map(field => {
                  const key = `updated${field}`;
                  return (
                    <div key={field} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{field}</p>
                      <p className="text-green-600 font-bold">{req?.[key] ?? 'No Change'}</p>
                    </div>
                  );
                })}
             </div>
          </div>

          <div className="pt-10 border-t flex gap-4">
            <button onClick={() => setModalMode('APPROVE')} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-green-700 transition-all">Approve Changes</button>
            <button onClick={() => setModalMode('REJECT')} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-all">Reject Changes</button>
          </div>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl space-y-6 animate-in zoom-in duration-200">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase">Confirm Decision</h3>
              <p className="text-slate-500 font-medium">Finalize {modalMode.toLowerCase()} for this request?</p>
            </div>

            {modalMode === 'REJECT' && (
              <textarea 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-medium text-sm focus:border-red-500 outline-none transition"
                placeholder="Reason for rejection..."
                value={reason} onChange={e => setReason(e.target.value)}
              />
            )}

            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="text-[#1f5f89]" size={20} />
                <div className="text-left">
                  <p className="text-xs font-black text-[#1f5f89] uppercase tracking-tighter">Outlook Notification</p>
                  <p className="text-[10px] text-blue-600 font-bold italic">Notify all registered participants?</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={notify} 
                onChange={e => setNotify(e.target.checked)}
                className="w-6 h-6 accent-[#1f5f89] cursor-pointer"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setModalMode(null)} className="flex-1 text-slate-400 font-bold uppercase text-xs">Cancel</button>
              <button 
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || (modalMode === 'REJECT' && !reason)}
                className={`flex-1 py-4 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-lg ${modalMode === 'APPROVE' ? 'bg-green-600 shadow-green-900/20' : 'bg-red-600 shadow-red-900/20'}`}
              >
                {mutation.isPending ? 'Processing...' : `Confirm ${modalMode}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdateReviewDetails;
