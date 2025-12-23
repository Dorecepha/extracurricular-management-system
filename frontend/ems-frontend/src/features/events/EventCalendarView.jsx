import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, CheckCircle, X, MapPin, Clock } from 'lucide-react';
import { eventApi } from './api';
import { safeParseUser } from '../../lib/safeParse';

function EventCalendarView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = safeParseUser();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const isEventFull = selectedEvent ? selectedEvent.currentRegistrations >= selectedEvent.capacity : false;

  const { data: eventsPage, isLoading } = useQuery({
    queryKey: ['events-calendar', format(viewDate, 'yyyy-MM')],
    queryFn: () => eventApi.getEvents(0, '', 200) // pull a larger page for month view
  });

  const events = eventsPage?.content || [];

  const registerMutation = useMutation({
    mutationFn: (id) => eventApi.registerForEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-calendar'] });
      setSelectedEvent(null);
      alert('Registration Successful!');
    }
  });

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate)),
    end: endOfWeek(endOfMonth(viewDate))
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 uppercase italic">University Calendar</h1>
          <p className="text-slate-500 font-medium">Public Event Schedule • {format(viewDate, 'MMMM yyyy')}</p>
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-2 shadow-sm">
          <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronLeft size={20} /></button>
          <button onClick={() => setViewDate(new Date())} className="px-4 py-1 text-xs font-bold uppercase tracking-widest text-blue-600">Today</button>
          <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronRight size={20} /></button>
        </div>
      </header>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm p-12 text-center text-slate-500 font-medium">
          Loading calendar...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm grid grid-cols-7 gap-px">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="bg-slate-900 p-4 text-center text-[10px] font-black text-white uppercase tracking-widest border-b border-slate-800"
            >
              {d}
            </div>
          ))}
          {days.map((day) => {
            const dayEvents = events
              .filter((e) => isSameDay(new Date(e.eventDate), day))
              .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[140px] p-3 transition-colors hover:bg-blue-50/30 ${isToday ? 'bg-blue-50/20' : 'bg-slate-50/40'}`}
              >
                <span className={`text-xs font-bold ${isToday ? 'text-blue-700' : 'text-slate-500'}`}>{format(day, 'd')}</span>
                <div className="mt-2 space-y-1">
                  {dayEvents.map((e) => (
                    <button
                      key={e.eventID}
                      onClick={() => setSelectedEvent(e)}
                      className="w-full text-left text-[10px] p-2 rounded-xl border bg-white shadow-sm border-slate-200 hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <p className="font-black text-slate-800 truncate uppercase tracking-wide">{e.title}</p>
                      <p className="text-slate-500 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                        {e.startTime}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-[#1f5f89] p-8 text-white relative">
              <button onClick={() => setSelectedEvent(null)} className="absolute right-6 top-6 hover:bg-white/20 p-2 rounded-full"><X /></button>
              <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-black uppercase mb-2 inline-block">Event Details</span>
              <h2 className="text-3xl font-black uppercase leading-tight">{selectedEvent.title}</h2>
              <div className="flex gap-4 mt-4 text-sm font-medium text-blue-100">
                <span className="flex items-center gap-1"><MapPin size={14} /> {selectedEvent.venue}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {selectedEvent.startTime}</span>
              </div>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">About this event</h4>
                <p className="text-slate-600 font-medium leading-relaxed italic">"{selectedEvent.description}"</p>
              </div>

              <div className="pt-6 border-t border-slate-100">
                {!user && (
                  <div className="text-center p-4 bg-slate-50 rounded-2xl">
                    <p className="text-sm font-bold text-slate-500">Log in to register for this event.</p>
                  </div>
                )}

                {user?.role === 'STUDENT' && (
                  selectedEvent.isRegistered ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-sm">
                      <CheckCircle size={20} /> Already Registered
                    </div>
                  ) : (
                    <button
                      onClick={() => registerMutation.mutate(selectedEvent.eventID)}
                      disabled={registerMutation.isPending || isEventFull}
                      className="w-full ems-btn-primary uppercase tracking-widest py-4"
                    >
                      {isEventFull ? 'Event Full' : registerMutation.isPending ? 'Registering...' : 'Confirm My Registration'}
                    </button>
                  )
                )}

                {user?.role === 'ORGANIZER' && selectedEvent.isOwner && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-2xl flex items-center gap-3 text-[#1f5f89]">
                      <Users size={20} />
                      <span className="text-sm font-bold">{selectedEvent.currentRegistrations} Students have registered.</span>
                    </div>
                    <button
                      onClick={() => navigate('/managed-events')}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-black transition-all"
                    >
                      View Participant List
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventCalendarView;
