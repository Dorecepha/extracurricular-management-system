import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from './api';
import { Calendar, MapPin, XCircle, Loader2, CheckCircle, Bookmark } from 'lucide-react';

function RegistrationHistory() {
  const queryClient = useQueryClient();
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => eventApi.getMyRegistrations()
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => eventApi.cancelRegistration(id),
    onSuccess: () => {
      alert("Registration cancelled.");
      queryClient.invalidateQueries(['my-registrations']);
      queryClient.invalidateQueries(['events']);
    },
    onError: (err) => alert(err.message)
  });

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#1f5f89]" size={48} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-black text-slate-900 uppercase italic">My Events</h1>
        <p className="text-slate-500 font-bold italic">Manage your current event registrations.</p>
      </header>

      <div className="grid gap-4">
        {!registrations?.length ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] py-32 text-center text-slate-400">
            <Bookmark size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl font-black uppercase tracking-widest">No registrations found</p>
            <p className="text-sm font-medium">Find an event in the Campus Events tab to get started.</p>
          </div>
        ) : (
          registrations.map((reg) => (
            <div key={reg.registrationID} className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm flex items-center justify-between group">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Confirmed Attendance</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">{reg.eventTitle}</h3>
                <div className="flex gap-6 text-sm font-bold text-slate-500 uppercase tracking-tight">
                  <span className="flex items-center gap-2"><Calendar size={16} className="text-[#1f5f89]"/> {reg.eventDate}</span>
                  <span className="flex items-center gap-2"><MapPin size={16} className="text-[#1f5f89]"/> {reg.venue}</span>
                </div>
              </div>
              
              <button
                onClick={() => { if(confirm("Cancel this booking?")) cancelMutation.mutate(reg.registrationID) }}
                disabled={cancelMutation.isPending}
                className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Cancel Registration"
              >
                <XCircle size={32} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RegistrationHistory;
