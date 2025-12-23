import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from './api';
import { safeParseUser } from '../../lib/safeParse';
import { Calendar, MapPin, Users, Loader2, Building2, CheckCircle, AlertCircle } from 'lucide-react';

function EventList() {
  const queryClient = useQueryClient();
  const user = safeParseUser();
  const isStudent = user?.role === 'STUDENT';

  const { data: eventsData, isLoading, isError, error } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventApi.getEvents(0)
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
      alert(res.message || "Confirmed!");
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
    },
    onError: (err) => alert(err.message)
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-[#1f5f89]" size={48} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-lg font-bold text-red-800">System Error</h2>
        <p className="text-red-600">{error?.message || 'Unable to load events right now.'}</p>
      </div>
    );
  }

  const events = Array.isArray(eventsData) ? eventsData : eventsData?.content || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Campus Events</h1>
        <p className="text-slate-500 font-bold italic mt-1">Discover and join upcoming university activities.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => {
          const isFull = event.currentRegistrations >= event.capacity;
          const isRegistered = registeredEventIDs.includes(event.eventID);

          return (
            <div key={event.eventID} className="bg-white border-2 border-slate-100 rounded-[32px] p-8 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group h-full">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="bg-slate-50 text-slate-400 p-3 rounded-2xl group-hover:bg-blue-50 group-hover:text-[#1f5f89] transition-colors">
                    <Building2 size={24} />
                  </div>
                  <span className="bg-primary/10 text-[#1f5f89] text-[10px] font-black px-3 py-1 rounded-full uppercase">
                    {event.organizationType}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-[#1f5f89] transition-colors line-clamp-2 uppercase">
                    {event.title}
                  </h3>
                  <p className="text-slate-500 text-sm mt-3 line-clamp-2 font-medium">
                    {event.description || "Official university event open to all students."}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600 uppercase">
                    <Calendar size={18} className="text-[#1f5f89]" />
                    <span>{event.eventDate} <span className="text-slate-200 mx-1">|</span> {event.startTime}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600 uppercase">
                    <MapPin size={18} className="text-[#1f5f89]" />
                    <span>{event.venue}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</span>
                  <div className="flex items-center gap-1.5 text-slate-900 font-black">
                    <Users size={14} className="text-[#1f5f89]" />
                    {event.currentRegistrations} / {event.capacity}
                  </div>
                </div>

                {isStudent && (
                  <button
                    onClick={() => registerMutation.mutate(event.eventID)}
                    disabled={registerMutation.isPending || isFull || isRegistered}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                      isRegistered
                        ? 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed'
                        : isFull
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-[#1f5f89] text-white hover:bg-[#164565] shadow-[#1f5f89]/20'
                    }`}
                  >
                    {isRegistered
                      ? <span className="flex items-center gap-2"><CheckCircle size={14} /> Registered</span>
                      : registerMutation.isPending
                        ? "Joining..."
                        : isFull
                          ? "Event Full"
                          : "Register Now"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EventList;
