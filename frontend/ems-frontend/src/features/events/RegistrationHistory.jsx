import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from './api';
import { format, parseISO } from 'date-fns';
import { Loader2, Bookmark } from 'lucide-react';

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

  const formatDate = (value) => {
    if (!value) return 'TBD';
    try {
      return format(parseISO(value), 'dd/MM/yyyy');
    } catch {
      return value;
    }
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#1f5f89]" size={48} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Events</h1>
        <p className="text-slate-500 text-sm font-medium">Manage your current event registrations.</p>
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
            <div key={reg.registrationID} className="ems-card p-5 flex items-center justify-between group">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{reg.eventTitle}</h3>
                  {/* DNA: Display Confirmation Number */}
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-mono border border-slate-200">
                    {reg.confirmationNumber}
                  </span>
                </div>
                <div className="flex gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <span>{formatDate(reg.eventDate)}</span>
                  <span>{reg.venue}</span>
                </div>
              </div>
              <button 
                onClick={() => cancelMutation.mutate(reg.registrationID)}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all border border-rose-100"
              >
                Cancel Registration
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RegistrationHistory;
