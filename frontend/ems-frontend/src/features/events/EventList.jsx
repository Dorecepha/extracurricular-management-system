import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from './api';
import { safeParseUser } from '../../lib/safeParse';
import { Search, ChevronLeft, ChevronRight, Loader2, Calendar, MapPin, Users, CheckCircle } from 'lucide-react';

function EventList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const user = safeParseUser();
  const isStudent = user?.role === 'STUDENT';

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', page, search],
    queryFn: () => eventApi.getEvents(page, search)
  });

  const { data: myRegistrations } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => eventApi.getMyRegistrations(),
    enabled: isStudent
  });

  const registeredEventIDs = isStudent
    ? (myRegistrations?.map((reg) => reg?.eventID).filter(Boolean) ?? [])
    : [];

  const registerMutation = useMutation({
    mutationFn: (id) => eventApi.registerForEvent(id),
    onSuccess: (res) => {
      alert(res.message || 'Registration successful');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
    },
    onError: (err) => alert(err.message)
  });

  const eventsPage = eventsData ?? {};
  const events = Array.isArray(eventsPage) ? eventsPage : eventsPage.content || [];
  const totalPages = eventsPage?.page?.totalPages ?? eventsPage?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Campus Events</h2>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-lg">
          <Search size={16} className="text-slate-400" />
          <input
            className="outline-none text-sm bg-transparent"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => {
              const isFull = event.currentRegistrations >= event.capacity;
              const isRegistered = registeredEventIDs.includes(event.eventID);

              return (
                <div key={event.eventID} className="ems-card p-6 flex flex-col justify-between hover:border-blue-300">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded text-slate-600 uppercase tracking-wider">
                        {event.organizationType}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">{event.description}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} /> {event.eventDate}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin size={14} /> {event.venue}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Users size={14} className="text-blue-600" />
                      {event.currentRegistrations}/{event.capacity} registered
                    </span>
                    {isStudent ? (
                      <button
                        onClick={() => registerMutation.mutate(event.eventID)}
                        disabled={registerMutation.isPending || isFull || isRegistered}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition ${
                          isRegistered
                            ? 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed'
                            : isFull
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isRegistered ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={14} /> Registered
                          </span>
                        ) : isFull ? (
                          'Full'
                        ) : registerMutation.isPending ? (
                          'Joining...'
                        ) : (
                          'Register'
                        )}
                      </button>
                    ) : (
                      <button className="ems-btn-primary w-full text-xs uppercase tracking-widest">
                        View Event Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-slate-600">Page {page + 1} of {totalPages || 1}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EventList;
