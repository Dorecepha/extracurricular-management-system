import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventApi } from './api';
import EventCard from './EventCard';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

function EventList() {
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: ['events', page],
    queryFn: () => eventApi.getEvents(page),
    placeholderData: (previousData) => previousData, // React Query v5 pattern
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-[#1f5f89] h-12 w-12" />
      <p className="mt-4 text-slate-500 font-medium">Loading upcoming events...</p>
    </div>
  );

  if (isError) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
      <h2 className="text-lg font-bold text-red-800">System Error</h2>
      <p className="text-red-600">{error.message}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Explore Events</h1>
          <p className="text-slate-500">Discover and register for extracurricular activities.</p>
        </div>
      </div>

      {/* Grid mapping through data.content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data?.content?.map((event) => (
          <EventCard key={event.eventID} event={event} />
        ))}
      </div>

      {/* Simple Pagination Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-6">
        <p className="text-sm text-slate-500">
          Showing page {page + 1} of {data?.totalPages || 1}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(old => Math.max(old - 1, 0))}
            disabled={page === 0}
            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => {
              if (!isPlaceholderData && page < (data?.totalPages - 1)) {
                setPage(old => old + 1);
              }
            }}
            disabled={page >= (data?.totalPages - 1)}
            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventList;
