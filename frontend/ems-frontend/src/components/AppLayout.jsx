import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Calendar, FilePlus, ClipboardList, ShieldCheck, LogOut, Bookmark, LayoutDashboard } from 'lucide-react';
import { safeParseUser, safeGetItem, clearAuthData } from '../lib/safeParse';

function AppLayout() {
  const navigate = useNavigate();
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
    { to: '/admin/audit', label: 'Audit Trail', icon: ShieldCheck, roles: ['ADMIN'] },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - High Contrast Navy */}
      <aside className="w-64 bg-[#0f172a] text-slate-400 flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-8">
          <h1 className="text-white text-xl font-bold flex items-center gap-2 tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-black">E</div>
            University EMS
          </h1>
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

        <div className="p-6 border-t border-slate-800">
          <button
            onClick={() => {
              clearAuthData();
              navigate('/login');
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
          >
            <LogOut size={18} /> Logout
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
