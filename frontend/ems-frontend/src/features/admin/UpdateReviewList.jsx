import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateApi } from '../events/updateApi';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
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
      <h1 className="text-4xl font-black text-slate-900 uppercase italic">Update Requests</h1>
      
      <div className="grid gap-6">
        {!requests?.length ? (
          <div className="bg-white rounded-[40px] p-20 text-center text-slate-400 font-bold border-2 border-dashed">No pending modifications.</div>
        ) : (
          requests.map((req) => (
            <div key={req.requestID} className="bg-white border-2 border-slate-100 rounded-[32px] p-8 space-y-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                   <h3 className="text-2xl font-black text-slate-900">Event Modification Request</h3>
                   <p className="text-[#1f5f89] font-bold">Reason: {req.updateReason || req.reason || 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveMutation.mutate(req.requestID)} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest">Approve</button>
                  <button onClick={() => navigate(`/admin/updates/${req.requestID}`)} className="bg-white border px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600">Review</button>
                </div>
              </div>

              {/* Diff View */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Field</p>
                  <p className="font-bold text-slate-500">Title:</p>
                  <p className="font-bold text-slate-500">Venue:</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Proposed Change</p>
                  <p className="font-bold text-green-600">{req.updatedTitle}</p>
                  <p className="font-bold text-green-600">{req.updatedVenue}</p>
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
