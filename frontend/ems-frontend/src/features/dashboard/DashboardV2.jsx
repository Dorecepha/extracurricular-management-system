import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { dashboardApiV2 } from './dashboardApiV2';
import { safeParseUser } from '../../lib/safeParse';
import AgendaSidebar from './components/AgendaSidebar';
import StudentDashboard from './roles/StudentDashboard';
import OrganizerDashboard from './roles/OrganizerDashboard';
import AdminDashboard from './roles/AdminDashboard';

function DashboardV2() {
  const user = safeParseUser();
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats-v2', user?.userID],
    queryFn: dashboardApiV2.getStats,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  if (isLoading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-20 text-center">
        <p className="text-red-600 font-semibold mb-2">Failed to load dashboard</p>
        <p className="text-sm text-slate-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Welcome back, {user?.firstName || user?.email}
        </p>
      </header>

      {/* Main Layout: Content + Agenda Sidebar */}
      <div className="flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {user?.role === 'STUDENT' && <StudentDashboard stats={stats} />}
          {(user?.role === 'ORGANIZER' || user?.role === 'EVENT_ORGANIZER') && (
            <OrganizerDashboard stats={stats} />
          )}
          {user?.role === 'ADMIN' && <AdminDashboard stats={stats} />}
        </div>

        {/* Agenda Sidebar (300px fixed, hidden on mobile) */}
        <AgendaSidebar events={stats?.activeEvents} />
      </div>
    </div>
  );
}

export default DashboardV2;
