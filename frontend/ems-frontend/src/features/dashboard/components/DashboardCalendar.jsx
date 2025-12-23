import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, X } from 'lucide-react';

function DashboardCalendar({ events }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="ems-card bg-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="ems-heading text-xl font-bold text-slate-900 uppercase tracking-tight">
          {format(viewDate, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all" aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setViewDate(new Date())} className="px-4 py-1 text-xs font-bold text-blue-600 uppercase tracking-widest">
            Today
          </button>
          <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all" aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
      {/* Calendar Grid with proper contrast borders */}
      <div className="grid grid-cols-7 border-t border-l border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-slate-50 p-4 text-center text-[10px] font-bold text-slate-400 uppercase border-r border-b border-slate-200">{d}</div>
        ))}
        {days.map(day => {
          const dayEvents = events?.filter(e => isSameDay(new Date(e.eventDate), day)) || [];
          const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={day.toString()} className={`min-h-[140px] p-2 border-r border-b border-slate-200 transition-colors ${
              isCurrentMonth ? (isToday ? 'bg-blue-50/30' : 'bg-white') : 'bg-slate-50/50'
            }`}>
              <span className={`text-xs font-bold ${isToday ? 'text-blue-600' : 'text-slate-300'}`}>{format(day, 'd')}</span>
              <div className="mt-2 space-y-1">
                {dayEvents.map(e => (
                  <div 
                    key={e.eventID}
                    onClick={() => setSelectedEvent(e)}
                    className="cursor-pointer text-[10px] p-2 bg-blue-600 text-white rounded-lg shadow-sm font-semibold truncate hover:scale-105 transition-transform"
                  >
                    {e.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-start gap-4 bg-slate-50">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Click for Details</p>
                <h4 className="text-xl font-bold text-slate-900 leading-snug">{selectedEvent.title}</h4>
                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-2"><CalendarIcon size={14} />{selectedEvent.eventDate ? format(new Date(selectedEvent.eventDate), 'eee, MMM d, yyyy') : 'Date TBD'}</span>
                  {selectedEvent.startTime && (
                    <span className="flex items-center gap-2"><Clock size={14} />{selectedEvent.startTime}</span>
                  )}
                  {selectedEvent.venue && (
                    <span className="flex items-center gap-2"><MapPin size={14} />{selectedEvent.venue}</span>
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
    </div>
  );
}
export default DashboardCalendar;
