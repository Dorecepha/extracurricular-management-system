import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, FilePlus, ClipboardList, ShieldCheck, LogOut, Bookmark, LayoutDashboard, Users } from 'lucide-react';
import { safeParseUser, safeGetItem, clearAuthData } from '../lib/safeParse';

function AppLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = safeGetItem('token');
    const userData = safeParseUser();
    if (!token || !userData) {
      clearAuthData();
      navigate('/login');
      return;
    }
    setUser(userData);
    setIsLoading(false);
  }, [navigate]);

  if (isLoading) return null;

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['STUDENT', 'ORGANIZER', 'ADMIN'] },
    { to: '/events', label: 'Events Calendar', icon: Calendar, roles: ['STUDENT', 'ORGANIZER', 'ADMIN', 'GUEST'] },
    { to: '/proposals/submit', label: 'Apply to Host', icon: FilePlus, roles: ['ORGANIZER'] },
    { to: '/managed-events', label: 'Managed Events', icon: ClipboardList, roles: ['ORGANIZER'] },
    { to: '/proposals/my', label: 'My Applications', icon: Bookmark, roles: ['ORGANIZER'] },
    { to: '/my-events', label: 'My Registrations', icon: Bookmark, roles: ['STUDENT'] },
    { to: '/admin/proposals', label: 'Review Inbox', icon: ShieldCheck, roles: ['ADMIN'] },
    { to: '/admin/accounts', label: 'Manage Accounts', icon: Users, roles: ['ADMIN'] },
    { to: '/admin/audit', label: 'Audit Trail', icon: ShieldCheck, roles: ['ADMIN'] },
  ];
  const roleValue = user?.role || 'GUEST';
  const roleLabel = roleValue.replace('EVENT_', '');

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - High Contrast Navy */}
      <aside className="w-64 bg-[#0f172a] text-slate-400 flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <img 
              src="/logoIU.png" 
              alt="University Logo" 
              className="h-10 w-auto object-contain" 
            />
            <div className="flex flex-col">
              <h1 className="text-white text-lg font-bold tracking-tight leading-tight">
                International University
              </h1>
              <p className="text-slate-500 text-[15px] font-black uppercase tracking-widest leading-none">
                EMS Portal
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.filter(item => item.roles.includes(user?.role || 'GUEST')).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 hover:text-slate-200'}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 px-2 py-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-blue-900/20">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </div>
            
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    roleValue === 'ADMIN'
                      ? 'bg-amber-400 text-black'
                      : roleValue === 'ORGANIZER'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              clearAuthData();
              queryClient.clear();
              navigate('/login');
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 ml-64 min-h-screen p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
export default AppLayout;
