import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { Calendar, Users, TrendingUp, MapPin, ExternalLink, X, ChevronDown, ChevronUp, Clock, CheckCircle } from 'lucide-react';
import StatCard from '../../../components/StatCard';

function StudentDashboard({ stats }) {
  const navigate = useNavigate();
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = stats?.activeEvents?.filter(e => {
    const eventDate = parseISO(e.eventDate);
    return !isPast(eventDate) || isToday(eventDate);
  }) || [];

  const pastEvents = stats?.activeEvents?.filter(e => {
    const eventDate = parseISO(e.eventDate);
    return isPast(eventDate) && !isToday(eventDate);
  }) || [];

  // Hero Card: Next Event
  const NextEventCard = () => {
    const nextEvent = stats?.nextEvent;

    if (!nextEvent) {
      return (
        <div className="ems-card p-8 text-center bg-gradient-to-r from-slate-100 to-slate-50 ems-stagger-1">
          <p className="text-sm text-slate-600 mb-2">No upcoming events</p>
          <button
            onClick={() => navigate('/events')}
            className="ems-btn-primary mt-4"
          >
            Browse Events
          </button>
        </div>
      );
    }

    const eventDateTime = new Date(`${nextEvent.eventDate}T${nextEvent.startTime}`);
    const timeUntil = formatDistanceToNow(eventDateTime, { addSuffix: true });

    return (
      <div className="ems-card p-8 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white ems-stagger-1">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-90">
          Your Next Event
        </p>
        <h2 className="text-2xl font-bold mb-3">{nextEvent.title}</h2>
        <p className="text-lg mb-4 opacity-95">
          {timeUntil} • {format(eventDateTime, 'PPP p')}
        </p>
        <div className="flex items-center gap-3 mb-6 text-sm">
          <MapPin size={16} />
          <span>{nextEvent.venue}</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setSelectedEvent(nextEvent)}
            className="px-4 py-2 bg-white text-[var(--primary)] rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            View Details
          </button>
          <button
            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(nextEvent.venue)}`, '_blank')}
            className="px-4 py-2 bg-white/10 backdrop-blur rounded-lg font-semibold hover:bg-white/20 transition flex items-center gap-2"
          >
            Get Directions <ExternalLink size={14} />
          </button>
        </div>
      </div>
    );
  };

  // Event Row Component
  const EventRow = ({ event }) => {
    const eventDate = parseISO(event.eventDate);

    return (
      <tr className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedEvent(event)}>
        <td className="px-4 py-3 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition">
            {event.title}
          </span>
        </td>
        <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">
          {format(eventDate, 'MMM d, yyyy')}
        </td>
        <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">
          {event.startTime}
        </td>
        <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">
          {event.venue}
        </td>
        <td className="px-4 py-3 border-b border-slate-100">
          <span className="ems-badge ems-badge-success">Confirmed</span>
        </td>
      </tr>
    );
  };

  // Event Detail Modal
  const EventDetailModal = () => {
    if (!selectedEvent) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
          {/* Header */}
          <div className="bg-[#1f5f89] p-8 text-white relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-6 top-6 hover:bg-white/20 p-2 rounded-full transition"
            >
              <X size={20} />
            </button>
            <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-black uppercase mb-2 inline-block">
              Your Registration
            </span>
            <h2 className="text-3xl font-black uppercase leading-tight mb-4">
              {selectedEvent.title}
            </h2>
            <div className="flex gap-4 text-sm font-medium text-blue-100">
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {selectedEvent.venue}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {selectedEvent.startTime}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-10 space-y-8">
            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                About this event
              </h4>
              <p className="text-slate-600 font-medium leading-relaxed italic">
                "{selectedEvent.description}"
              </p>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm font-bold text-slate-700">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-black">
                  Event Date
                </p>
                <p className="text-lg">
                  {format(parseISO(selectedEvent.eventDate), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-black">
                  Time
                </p>
                <p className="text-lg">
                  {selectedEvent.startTime} - {selectedEvent.endTime}
                </p>
              </div>
            </div>

            {/* Confirmed Badge */}
            <div className="flex items-center justify-center gap-2 p-4 bg-emerald-50 rounded-2xl text-emerald-600 font-bold uppercase tracking-widest text-sm">
              <CheckCircle size={20} /> Confirmed Registration
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <button
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedEvent.venue)}`, '_blank')}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                Get Directions <ExternalLink size={14} />
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <NextEventCard />

      {/* Engagement Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ems-stagger-2">
        <StatCard
          value={stats?.myTotalRegistrations || 0}
          label="All-time registrations"
          icon={Users}
          color="blue"
          onClick={() => navigate('/my-events')}
        />
        <StatCard
          value={stats?.thisMonthRegistrations || 0}
          label="This month"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          value={stats?.upcomingEventsCount || 0}
          label="In your schedule"
          icon={Calendar}
          color="cyan"
        />
      </div>

      {/* Upcoming Registrations List */}
      <div className="ems-card overflow-hidden ems-stagger-3">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Upcoming Events
          </h3>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Event</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Venue</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.map(event => (
                  <EventRow key={event.eventID} event={event} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">You haven't registered for any upcoming events yet</p>
            <button
              onClick={() => navigate('/events')}
              className="mt-4 ems-btn-primary"
            >
              Browse Events
            </button>
          </div>
        )}
      </div>

      {/* Past Registrations Accordion */}
      {pastEvents.length > 0 && (
        <div className="ems-card overflow-hidden ems-stagger-4">
          <button
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition"
          >
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Past Events ({pastEvents.length})
            </h3>
            {showPastEvents ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showPastEvents && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Venue</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastEvents.map(event => (
                    <EventRow key={event.eventID} event={event} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Event Detail Modal */}
      <EventDetailModal />
    </div>
  );
}

export default StudentDashboard;
