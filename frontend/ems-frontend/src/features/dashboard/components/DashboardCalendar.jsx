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
import { ChevronLeft, ChevronRight } from 'lucide-react';

function DashboardCalendar({ events }) {
  const [viewDate, setViewDate] = useState(new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="ems-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
          {format(viewDate, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setViewDate(new Date())}
            className="px-3 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            Today
          </button>
          <button
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-slate-50 p-2 text-center text-[10px] font-bold text-slate-400 uppercase">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents =
            events?.filter((e) => {
              if (!e?.eventDate) return false;
              const eventDate = new Date(e.eventDate);
              return (
                eventDate.getUTCFullYear() === day.getUTCFullYear() &&
                eventDate.getUTCMonth() === day.getUTCMonth() &&
                eventDate.getUTCDate() === day.getUTCDate()
              );
            }) || [];
          const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);

          return (
            <div
              key={day.toString()}
              className={`min-h-[90px] p-2 space-y-1 ${isCurrentMonth ? 'bg-white' : 'bg-slate-50 opacity-50'}`}
            >
              <span className="text-xs font-medium text-slate-400">{format(day, 'd')}</span>
              {dayEvents.map((e) => (
                <div
                  key={e.eventID}
                  className="text-[9px] p-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100 truncate font-semibold"
                >
                  {e.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default DashboardCalendar;
