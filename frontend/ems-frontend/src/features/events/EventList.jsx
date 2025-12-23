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
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic">Campus Events</h1>
          <p className="text-slate-500 font-bold italic">Page {page + 1} of {totalPages || 1}</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:border-[#1f5f89] outline-none transition font-bold shadow-sm"
            placeholder="Search by event title..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </header>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#1f5f89]" size={48} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map(event => (
              <div key={event.eventID} className="bg-white border-2 border-slate-100 rounded-[32px] p-8 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all h-full group">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#1f5f89] transition-colors uppercase line-clamp-2">{event.title}</h3>
                  <div className="space-y-2 text-sm font-bold text-slate-500">
                    <div className="flex items-center gap-2"><Calendar size={16} className="text-[#1f5f89]"/> {event.eventDate}</div>
                    <div className="flex items-center gap-2"><MapPin size={16} className="text-[#1f5f89]"/> {event.venue}</div>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 italic">Cap: {event.capacity}</span>
                  <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1f5f89] transition-all">Details</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 pt-10">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-4 bg-white border border-slate-200 rounded-full disabled:opacity-30 hover:bg-slate-50 transition shadow-sm"
            >
              <ChevronLeft />
            </button>
            <span className="font-black text-slate-900">PAGE {page + 1}</span>
            <button 
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-4 bg-white border border-slate-200 rounded-full disabled:opacity-30 hover:bg-slate-50 transition shadow-sm"
            >
              <ChevronRight />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default EventList;
