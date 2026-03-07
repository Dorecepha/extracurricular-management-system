import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar, Users, AlertCircle, Clock, TrendingUp, ExternalLink, X, CheckCircle, MapPin, FilePlus } from 'lucide-react';
import StatCard from '../../../components/StatCard';
import CapacityBar from '../../../components/CapacityBar';
import ActionAlert from '../../../components/ActionAlert';

function OrganizerDashboard({ stats }) {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);

  const rejectedProposals = stats?.myProposals?.filter(p => p.status === 'REJECTED') || [];
  const eventsNeedingAttention = stats?.eventsNeedingAttention || [];

  return (
    <div className="space-y-6">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ems-stagger-1">
        <StatCard
          value={stats?.myActiveEvents || 0}
          label="Active Events"
          icon={Calendar}
          color="emerald"
          onClick={() => navigate('/managed-events')}
          trend={`${stats?.totalParticipantsAllTime || 0} total participants`}
        />
        <StatCard
          value={stats?.myProposalStats?.PENDING || 0}
          label="Pending Proposals"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/proposals/my')}
          trend={stats?.oldestPendingProposalDays > 0 ? `Oldest: ${stats.oldestPendingProposalDays} days` : null}
        />
        <StatCard
          value={rejectedProposals.length}
          label="Needs Revision"
          icon={AlertCircle}
          color="rose"
          onClick={() => navigate('/proposals/my')}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 ems-stagger-2">
        <button
          onClick={() => navigate('/proposals/submit')}
          className="flex-1 ems-btn-primary flex items-center justify-center gap-2"
        >
          <FilePlus size={18} />
          Apply to Host Event
        </button>
        <button
          onClick={() => navigate('/proposals/my')}
          className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-200 transition"
        >
          View All Proposals
        </button>
      </div>

      {/* Action Required: Rejected Proposals */}
      {rejectedProposals.length > 0 && (
        <div className="space-y-3 ems-stagger-2">
          {rejectedProposals.map(proposal => (
            <ActionAlert
              key={proposal.proposalID}
              type="error"
              title={`Proposal Rejected: ${proposal.title}`}
              description={proposal.rejectionReason || 'No reason provided by admin'}
              actions={[
                {
                  label: 'Revise & Resubmit',
                  onClick: () => navigate(`/proposals/edit/${proposal.proposalID}`),
                  primary: true
                },
                {
                  label: 'View Details',
                  onClick: () => navigate('/proposals/my')
                }
              ]}
            />
          ))}
        </div>
      )}

      {/* Events Needing Attention */}
      {eventsNeedingAttention.length > 0 && (
        <div className="ems-card p-6 ems-stagger-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Events Needing Attention
          </h3>
          <div className="space-y-4">
            {eventsNeedingAttention.map(event => {
              const fillRate = event.capacity ? (event.currentRegistrations / event.capacity) * 100 : 0;
              const isLowAttendance = fillRate < 30;
              const isNearCapacity = fillRate > 90;

              return (
                <div
                  key={event.eventID}
                  className={`p-4 rounded-xl border-2 ${
                    isNearCapacity
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{event.title}</h4>
                      <p className="text-xs text-slate-600">
                        {format(parseISO(event.eventDate), 'MMM d, yyyy')} • {event.venue}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      View <ExternalLink size={12} />
                    </button>
                  </div>
                  <CapacityBar
                    current={event.currentRegistrations || 0}
                    total={event.capacity || 0}
                    showLabel={true}
                  />
                  <p className="text-xs font-semibold mt-2 text-slate-700">
                    {isNearCapacity && '✓ Near capacity - Consider increasing limit'}
                    {isLowAttendance && '⚠ Low attendance - Share event link to boost registrations'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Events Grid */}
      <div className="ems-card ems-stagger-4">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            My Events
          </h3>
          <button
            onClick={() => navigate('/managed-events')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View All →
          </button>
        </div>
        {stats?.activeEvents && stats.activeEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {stats.activeEvents.slice(0, 4).map(event => {
              const fillRate = event.capacity ? (event.currentRegistrations / event.capacity) * 100 : 0;

              return (
                <div
                  key={event.eventID}
                  onClick={() => setSelectedEvent(event)}
                  className="ems-card p-4 cursor-pointer ems-card-hover"
                >
                  <h4 className="font-bold text-slate-900 mb-2 truncate">{event.title}</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    {format(parseISO(event.eventDate), 'MMM d, yyyy')} • {event.startTime}
                  </p>
                  <CapacityBar
                    current={event.currentRegistrations || 0}
                    total={event.capacity || 0}
                    showLabel={false}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-600">
                      {event.currentRegistrations || 0} / {event.capacity || 0} registered
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {Math.round(fillRate)}% full
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500 mb-4">You haven't created any events yet</p>
            <button
              onClick={() => navigate('/proposals/create')}
              className="ems-btn-primary"
            >
              Create Proposal
            </button>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
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
                Your Event
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

              {/* Capacity Status */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Registration Status
                </h4>
                <CapacityBar
                  current={selectedEvent.currentRegistrations || 0}
                  total={selectedEvent.capacity || 0}
                  showLabel={true}
                />
                <p className="text-sm text-slate-600">
                  {selectedEvent.currentRegistrations || 0} of {selectedEvent.capacity || 0} spots filled
                </p>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-slate-100 space-y-3">
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    navigate(`/managed-events`);
                  }}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-blue-700 transition-all"
                >
                  Manage Event
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
      )}
    </div>
  );
}

export default OrganizerDashboard;
