import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Users, Calendar, AlertCircle, TrendingUp, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import StatCard from '../../../components/StatCard';

function SuperAdminDashboard({ stats }) {
  const navigate = useNavigate();
  const [showProposals, setShowProposals] = useState(true);
  const [showUpdates, setShowUpdates] = useState(true);

  const pendingReviews = (stats?.pendingProposalsCount || 0) + (stats?.pendingUpdatesCount || 0);

  return (
    <div className="space-y-6">
      {/* System Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ems-stagger-1">
        <StatCard
          value={((stats?.totalStudents || 0) + (stats?.totalOrganizers || 0))}
          label="Total Users"
          icon={Users}
          color="indigo"
          trend={`${stats?.totalStudents || 0} Students | ${stats?.totalOrganizers || 0} Organizers`}
          onClick={() => navigate('/admin/accounts')}
        />
        <StatCard
          value={stats?.activeEventsCount || 0}
          label="Active Events"
          icon={Calendar}
          color="blue"
          onClick={() => navigate('/events')}
        />
        <StatCard
          value={pendingReviews}
          label="Pending Reviews"
          icon={AlertCircle}
          color={pendingReviews > 0 ? 'amber' : 'emerald'}
          onClick={() => navigate('/admin/proposals')}
        />
        <StatCard
          value={stats?.weeklyRegistrationCount || 0}
          label="This Week"
          icon={TrendingUp}
          color="cyan"
          trend="Registrations"
        />
      </div>

      {/* Review Queue Panel */}
      <div className="space-y-4 ems-stagger-2">
        {/* Pending Proposals Section */}
        <div className="ems-card overflow-hidden">
          <button
            onClick={() => setShowProposals(!showProposals)}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Pending Proposals
              </h3>
              {stats?.pendingProposalsCount > 0 && (
                <span className="bg-amber-400 text-black px-3 py-1 rounded-lg font-black text-xs">
                  {stats.pendingProposalsCount}
                </span>
              )}
            </div>
            {showProposals ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showProposals && (
            <div className="p-6">
              {stats?.pendingProposalsCount > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 mb-4">
                    Review and approve event proposals from organizers
                  </p>
                  <button
                    onClick={() => navigate('/admin/proposals')}
                    className="ems-btn-primary w-full"
                  >
                    Review Proposals ({stats.pendingProposalsCount})
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No pending proposals
                </p>
              )}
            </div>
          )}
        </div>

        {/* Event Update Requests Section */}
        <div className="ems-card overflow-hidden">
          <button
            onClick={() => setShowUpdates(!showUpdates)}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Event Modification Requests
              </h3>
              {stats?.pendingUpdatesCount > 0 && (
                <span className="bg-amber-400 text-black px-3 py-1 rounded-lg font-black text-xs">
                  {stats.pendingUpdatesCount}
                </span>
              )}
            </div>
            {showUpdates ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showUpdates && (
            <div className="p-6">
              {stats?.pendingUpdatesCount > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 mb-4">
                    Review and approve modification requests for existing events
                  </p>
                  <button
                    onClick={() => navigate('/admin/updates')}
                    className="ems-btn-primary w-full"
                  >
                    Review Requests ({stats.pendingUpdatesCount})
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No pending modification requests
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="ems-card ems-stagger-3">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recent Activity
          </h3>
        </div>
        <div className="p-6">
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 10).map((activity, index) => (
                <div
                  key={index}
                  onClick={() => activity.navigationUrl && navigate(activity.navigationUrl)}
                  className={`flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition ${
                    activity.navigationUrl ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">
                      <span className="font-semibold">{activity.actorName}</span>
                      {' '}
                      <span className="text-slate-600">{activity.action}</span>
                      {activity.targetName && (
                        <>
                          {' '}
                          <span className="font-semibold">{activity.targetName}</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${
                    activity.actorRole === 'STUDENT'
                      ? 'bg-blue-100 text-blue-700'
                      : activity.actorRole === 'ORGANIZER'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {activity.actorRole}
                  </span>
                </div>
              ))}
              {stats.recentActivity.length > 10 && (
                <button
                  onClick={() => navigate('/admin/audit')}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 mt-4 w-full text-center"
                >
                  View All Activity →
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">
              No recent activity
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex gap-3 flex-wrap ems-stagger-4">
        <button
          onClick={() => navigate('/admin/accounts')}
          className="ems-btn-ghost flex-1"
        >
          <Users size={16} />
          Manage Users
        </button>
        <button
          onClick={() => navigate('/events')}
          className="ems-btn-ghost flex-1"
        >
          <Calendar size={16} />
          View All Events
        </button>
        <button
          onClick={() => navigate('/admin/audit')}
          className="ems-btn-ghost flex-1"
        >
          <Clock size={16} />
          Audit Trail
        </button>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
