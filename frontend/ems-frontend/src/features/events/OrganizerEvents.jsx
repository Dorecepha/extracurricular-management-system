import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { eventApi } from './api';
import { Loader2, Plus } from 'lucide-react';

function OrganizerEvents() {
  const navigate = useNavigate();
  const { data: events, isLoading } = useQuery({
    queryKey: ['managed-events'],
    queryFn: () => eventApi.getManagedEvents()
  });

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase">Managed Events</h1>
          <p className="text-slate-500 font-bold italic">You are hosting {events?.length || 0} active events.</p>
        </div>
        <button onClick={() => navigate('/proposals/submit')} className="bg-[#1f5f89] text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-[#1f5f89]/20 hover:scale-105 transition-all">
          <Plus size={18} /> NEW PROPOSAL
        </button>
      </header>

      <div className="grid gap-4">
        {!events?.length ? (
          <div className="bg-white border-2 border-dashed rounded-[40px] p-20 text-center text-slate-400 font-bold">No live events found.</div>
        ) : (
          events.map(event => (
            <div key={event.eventID} className="bg-white border-2 border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#1f5f89] transition-colors uppercase leading-tight">{event.title}</h3>
                <div className="flex gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{event.eventDate} @ {event.startTime}</span>
                  <span className="text-[#1f5f89]">{event.currentRegistrations ?? 0} / {event.capacity} Registrations</span>
                </div>
              </div>
              
              {/* NFR: Easy to Use - Clear Text Actions */}
              <div className="flex gap-3 shrink-0">
                <button 
                  onClick={() => navigate(`/events/${event.eventID}/update`)}
                  className="px-6 py-3 bg-[#1f5f89] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#164565] transition-all"
                >
                  Manage Details
                </button>
                <button 
                  onClick={() => { if(window.confirm("Abort this event? Students will be notified.")) navigate(`/events/${event.eventID}/update?action=cancel`); }}
                  className="px-6 py-3 bg-white border-2 border-red-100 text-red-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-200 transition-all"
                >
                  Abort Event
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OrganizerEvents;
