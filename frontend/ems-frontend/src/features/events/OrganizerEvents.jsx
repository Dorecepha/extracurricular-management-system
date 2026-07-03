import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { eventApi } from './api';
import { reportApi } from './reportApi';
import { Users, AlertTriangle, X, Loader2, Plus, Search, FileText } from 'lucide-react';

function OrganizerEvents() {
  const navigate = useNavigate();
  const [selectedEventID, setSelectedEventID] = useState(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const { data: events, isLoading } = useQuery({
    queryKey: ['managed-events'],
    queryFn: () => eventApi.getManagedEvents()
  });

  const { data: completedEvents = [], isLoading: completedLoading } = useQuery({
    queryKey: ['managed-events-completed'],
    queryFn: reportApi.getCompletedEvents,
    enabled: activeTab === 'completed',
  });

  const { data: participants, isLoading: loadingParticipants } = useQuery({
    queryKey: ['participants', selectedEventID],
    queryFn: () => eventApi.getParticipants(selectedEventID),
    enabled: !!selectedEventID
  });

  if (isLoading && activeTab === 'active') {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const filteredEvents = (events || []).filter((event) => {
    const query = search.toLowerCase();
    return (
      event.title?.toLowerCase().includes(query) ||
      event.venue?.toLowerCase().includes(query)
    );
  });

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedEvents = filteredEvents.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Managed Events</h1>
        <p className="text-slate-500 text-sm font-medium">Your current approved events.</p>
        </div>
        <button
          onClick={() => navigate('/proposals/submit')}
          className="bg-[#1f5f89] text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-[#1f5f89]/20 hover:scale-105 transition-all"
        >
          <Plus size={18} /> New Proposal
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Events
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={14} /> Post-Event Reports
        </button>
      </div>

      {activeTab === 'active' && (
        <div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-xl mb-6">
            <Search size={18} className="text-slate-400" />
            <input
              className="outline-none text-sm w-full"
              placeholder="Search my events..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>

          <div className="grid gap-4">
            {!filteredEvents.length ? (
              <div className="bg-white border-2 border-dashed rounded-[40px] p-20 text-center text-slate-400 font-bold">
                {search ? 'No events match your search.' : 'No live events found.'}
              </div>
            ) : (
              paginatedEvents.map((event) => (
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
                      className="ems-btn-primary px-4 py-2 text-xs"
                    >
                      Update Details
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

          {filteredEvents.length > pageSize && (
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="grid gap-4">
          {completedLoading ? (
            <div className="p-16 flex justify-center">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : completedEvents.length === 0 ? (
            <div className="bg-white border-2 border-dashed rounded-[40px] p-20 text-center text-slate-400 font-bold">
              No completed events yet.
            </div>
          ) : (
            completedEvents.map((event) => (
              <div
                key={event.eventID}
                className="ems-card p-6 flex flex-col md:flex-row justify-between items-center gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                      Completed
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {event.eventDate} | {event.venue}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {event.currentRegistrations ?? 0} attendees · {event.organizationType?.replace('_', ' ')}
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/events/${event.eventID}/report`)}
                  className="ems-btn-primary px-5 py-2.5 text-xs flex items-center gap-2 shrink-0"
                >
                  <FileText size={14} /> Submit / View Report
                </button>
              </div>
            ))
          )}
        </div>
      )}

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
