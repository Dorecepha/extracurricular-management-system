import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from './dashboardApi';
import { safeParseUser } from '../../lib/safeParse';
import DashboardCalendar from './components/DashboardCalendar';
import DashboardV2 from './DashboardV2';
import { Users, AlertCircle, ArrowRight, Loader2, CheckCircle, X, Bookmark, ShieldCheck } from 'lucide-react';

function Dashboard() {
  // Feature flag check for DashboardV2
  const enableV2 = import.meta.env.VITE_ENABLE_DASHBOARD_V2 === 'true';

  if (enableV2) {
    return <DashboardV2 />;
  }

  const navigate = useNavigate();
  const user = safeParseUser();
  const [showSuccess, setShowSuccess] = useState(true);
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.userID],
    queryFn: dashboardApi.getStats
  });
  const hasResolution = stats?.myProposals?.some((p) => p.status !== 'PENDING');

  if (isLoading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium">Welcome back, {user?.email}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          {user?.role === 'ORGANIZER' && (
            <div className="space-y-3">
              <div className="ems-card p-6 bg-slate-900 text-white border-none">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Management Hub</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/managed-events')}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition text-sm font-medium"
                  >
                    View Hosted Events <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => navigate('/proposals/my')}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition group relative"
                  >
                    <span className="flex items-center gap-3 text-sm font-medium">
                      <Bookmark size={18} className="text-blue-400" /> Application History
                    </span>
                    <div className="flex items-center gap-2">
                      {hasResolution && (
                        <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                      )}
                      <ArrowRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>

              {showSuccess && stats?.myProposals?.some((p) => p.status === 'APPROVED') && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center animate-in slide-in-from-top">
                  <div className="flex gap-3 items-center text-emerald-700 text-xs font-bold">
                    <CheckCircle size={16} /> Application Approved! Check Managed Events.
                  </div>
                  <button onClick={() => setShowSuccess(false)} className="text-emerald-500 hover:text-emerald-700">
                    <X size={14} />
                  </button>
                </div>
              )}

              {stats?.myProposals
                ?.filter((p) => p.status === 'REJECTED')
                .map((p) => (
                  <div key={p.proposalID} className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                    <div className="flex gap-3 items-center text-rose-700 text-xs font-bold">
                      <AlertCircle size={16} /> {p.title} was Rejected.
                    </div>
                    <button
                      onClick={() => navigate('/proposals/my')}
                      className="text-[10px] font-bold text-rose-600 underline"
                    >
                      Update & Resubmit
                    </button>
                  </div>
                ))}
            </div>
          )}

          {user?.role === 'STUDENT' && (
            <div className="ems-card p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Participation Summary</h3>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                    <Users />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats?.myTotalRegistrations ?? 0}</p>
                    <p className="text-xs text-slate-500 font-medium uppercase">Total Bookings</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/my-events')}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition"
                >
                  View Past Registrations
                </button>
              </div>
            </div>
          )}

          {user?.role === 'ADMIN' && (
            <div className="ems-card p-8 bg-indigo-900 text-white border-none shadow-xl">
              <h3 className="font-bold text-xs uppercase tracking-widest text-indigo-300 mb-4 flex items-center gap-2">
                <ShieldCheck size={16}/> Admin Action Center
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/10 rounded-2xl flex justify-between items-center">
                  <span className="text-sm font-medium">New Proposals</span>
                  <span className="bg-white text-indigo-900 px-3 py-1 rounded-lg font-black text-xs">{stats?.pendingProposalsCount ?? 0}</span>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl flex justify-between items-center">
                  <span className="text-sm font-medium">Modification Requests</span>
                  <span className="bg-amber-400 text-black px-3 py-1 rounded-lg font-black text-xs">{stats?.pendingUpdatesCount ?? 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <DashboardCalendar events={stats?.activeEvents} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
