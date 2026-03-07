import React, { useState } from 'react';
import { format, isSameDay, isToday, isTomorrow, isWithinInterval, addDays, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, X } from 'lucide-react';

function AgendaSidebar({ events }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (!events || events.length === 0) {
    return (
      <div className="hidden lg:block w-[300px] flex-shrink-0">
        <div className="ems-card p-6 sticky top-6">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Your Schedule</h3>
          <p className="text-xs text-slate-400">{format(new Date(), 'EEEE, MMMM d')}</p>
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">No events scheduled</p>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const tomorrow = addDays(now, 1);
  const weekEnd = addDays(now, 7);

  // Parse and sort events by date
  const sortedEvents = [...events]
    .map(e => ({
      ...e,
      parsedDate: parseISO(e.eventDate)
    }))
    .sort((a, b) => a.parsedDate - b.parsedDate);

  // Group events
  const todayEvents = sortedEvents.filter(e => isToday(e.parsedDate));
  const tomorrowEvents = sortedEvents.filter(e => isTomorrow(e.parsedDate));
  const thisWeekEvents = sortedEvents.filter(e =>
    !isToday(e.parsedDate) &&
    !isTomorrow(e.parsedDate) &&
    isWithinInterval(e.parsedDate, { start: addDays(now, 2), end: weekEnd })
  );

  const EventItem = ({ event }) => (
    <div
      onClick={() => setSelectedEvent(event)}
      className="py-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded transition group"
    >
      <div className="flex items-start gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-slate-600 mb-0.5">
            {event.startTime}
          </p>
          <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition">
            {event.title}
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {event.venue}
          </p>
        </div>
      </div>
    </div>
  );

  const EventGroup = ({ title, events }) => {
    if (events.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          {title}
        </h4>
        <div className="space-y-0">
          {events.map(event => (
            <EventItem key={event.eventID} event={event} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="hidden lg:block w-[300px] flex-shrink-0">
        <div className="ems-card p-6 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Your Schedule</h3>
          <p className="text-xs text-slate-400 mb-6">{format(now, 'EEEE, MMMM d')}</p>

          <div className="space-y-4">
            <EventGroup title="TODAY" events={todayEvents} />
            <EventGroup title="TOMORROW" events={tomorrowEvents} />
            <EventGroup title="THIS WEEK" events={thisWeekEvents} />

            {todayEvents.length === 0 && tomorrowEvents.length === 0 && thisWeekEvents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No events this week</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Detail Modal (reused from DashboardCalendar) */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-start gap-4 bg-slate-50">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Event Details</p>
                <h4 className="text-xl font-bold text-slate-900 leading-snug">{selectedEvent.title}</h4>
                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-2">
                    <CalendarIcon size={14} />
                    {selectedEvent.eventDate ? format(parseISO(selectedEvent.eventDate), 'eee, MMM d, yyyy') : 'Date TBD'}
                  </span>
                  {selectedEvent.startTime && (
                    <span className="flex items-center gap-2">
                      <Clock size={14} />{selectedEvent.startTime}
                    </span>
                  )}
                  {selectedEvent.venue && (
                    <span className="flex items-center gap-2">
                      <MapPin size={14} />{selectedEvent.venue}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-white rounded-full">
                <X size={18} />
              </button>
            </div>
            {selectedEvent.description && (
              <div className="p-6">
                <p className="text-sm text-slate-600 leading-relaxed">{selectedEvent.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AgendaSidebar;
