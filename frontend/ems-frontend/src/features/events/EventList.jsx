import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventApi } from './api';
import { Search, ChevronLeft, ChevronRight, Loader2, Calendar, MapPin } from 'lucide-react';

function EventList() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', page, search],
    queryFn: () => eventApi.getEvents(page, search)
  });

  const events = eventsData?.content || [];
  const totalPages = eventsData?.totalPages || 0;

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
            {events.map(event => (
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
                  <span className="text-xs text-slate-400 font-medium">{event.currentRegistrations}/{event.capacity} registered</span>
                  <button className="text-blue-600 text-sm font-bold hover:underline">View Details</button>
                </div>
              </div>
            ))}
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
