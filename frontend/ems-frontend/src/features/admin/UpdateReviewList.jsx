import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateApi } from '../events/updateApi';
import { Loader2, RefreshCcw, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function UpdateReviewList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin', 'updates'],
    queryFn: updateApi.getPendingUpdates
  });

  const approveMutation = useMutation({
    mutationFn: (id) => updateApi.approveUpdate(id, false),
    onSuccess: () => {
      alert("Changes applied to event.");
      queryClient.invalidateQueries(['admin', 'updates']);
    }
  });

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Update Requests</h1>
          <p className="text-slate-500 text-sm font-medium">{requests?.length ?? 0} pending modification reviews</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-semibold flex items-center gap-2">
          <RefreshCcw size={12}/> Modification Queue
        </span>
      </header>
      
      <div className="grid gap-6">
        {!requests?.length ? (
          <div className="bg-white rounded-[32px] p-16 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200">
            <Inbox className="mx-auto mb-3 opacity-30" size={40}/>
            No pending modifications.
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.requestID} className="ems-card p-6 space-y-5">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2">
                   <div className="flex items-center gap-2 flex-wrap">
                     <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-bold flex items-center gap-1.5">
                       <RefreshCcw size={12}/> Modification Request
                     </span>
                     <span className="text-[11px] font-semibold text-slate-400">ID #{req.requestID}</span>
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 leading-snug">{req.updatedTitle || req.originalTitle || 'Event Modification Request'}</h3>
                   <div className="px-3 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-sm font-semibold">
                     Reason: {req.updateReason || req.reason || 'N/A'}
                   </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => navigate(`/admin/updates/${req.requestID}`)} className="ems-btn-primary px-4 py-2 text-xs">
                    Review
                  </button>
                  <button onClick={() => approveMutation.mutate(req.requestID)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition">
                    Approve
                  </button>
                </div>
              </div>

              {/* Diff View */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Field</p>
                  <p className="font-semibold text-slate-600">Title</p>
                  <p className="font-semibold text-slate-600">Venue</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proposed Change</p>
                  <p className="font-semibold text-emerald-700">{req.updatedTitle}</p>
                  <p className="font-semibold text-emerald-700">{req.updatedVenue}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UpdateReviewList;
