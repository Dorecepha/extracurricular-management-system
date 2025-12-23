import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { eventApi } from './api';
import { Users, AlertTriangle, X, Loader2, Plus } from 'lucide-react';

function OrganizerEvents() {
  const navigate = useNavigate();
  const [selectedEventID, setSelectedEventID] = useState(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['managed-events'],
    queryFn: () => eventApi.getManagedEvents()
  });

  const { data: participants, isLoading: loadingParticipants } = useQuery({
    queryKey: ['participants', selectedEventID],
    queryFn: () => eventApi.getParticipants(selectedEventID),
    enabled: !!selectedEventID
  });

  if (isLoading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Managed Events</h1>
        <button
          onClick={() => navigate('/proposals/submit')}
          className="bg-[#1f5f89] text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-[#1f5f89]/20 hover:scale-105 transition-all"
        >
          <Plus size={18} /> New Proposal
        </button>
      </header>

      <div className="grid gap-4">
        {!events?.length ? (
          <div className="bg-white border-2 border-dashed rounded-[40px] p-20 text-center text-slate-400 font-bold">
            No live events found.
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.eventID}
              className="ems-card p-6 flex flex-col md:flex-row justify-between items-center gap-6"
            >
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {event.eventDate} | {event.venue}
                </p>
                <p className="text-[11px] text-blue-600 font-semibold mt-1">
                  {event.currentRegistrations ?? 0} / {event.capacity} registered
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedEventID(event.eventID)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-200 transition"
                >
                  <Users size={14} /> Participants
                </button>
                <button
                  onClick={() => navigate(`/events/${event.eventID}/update`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                >
                  Manage
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Abort this event? Students will be notified.')) {
                      navigate(`/events/${event.eventID}/update?action=cancel`);
                    }
                  }}
                  className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition"
                >
                  Abort
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedEventID && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Registered Participants</h3>
              <button onClick={() => setSelectedEventID(null)} className="p-2 hover:bg-slate-200 rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {loadingParticipants ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin" />
                </div>
              ) : participants?.length ? (
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    {participants.map((p) => (
                      <tr key={p.email}>
                        <td className="py-3 font-semibold text-slate-800">{p.name}</td>
                        <td className="py-3 text-right text-slate-500 font-mono text-xs">{p.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-slate-500 text-sm flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" /> No participants registered yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizerEvents;
