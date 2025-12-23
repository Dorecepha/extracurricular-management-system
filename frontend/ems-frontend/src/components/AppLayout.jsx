import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Calendar, FilePlus, ClipboardList, ShieldCheck, ShieldAlert, LogOut, Bookmark, UserCircle, LayoutDashboard, Users } from 'lucide-react';
import { safeParseUser, clearAuthData } from '../lib/safeParse';

function AppLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = safeParseUser();
    setUser(userData);
    setIsLoading(false);
  }, []);

  if (isLoading) return null;

  const currentRole = user?.role || 'GUEST';
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['STUDENT', 'ORGANIZER', 'ADMIN'] },
    { to: '/events', label: 'Explore Events', icon: Calendar, roles: ['GUEST', 'STUDENT', 'ORGANIZER', 'ADMIN'] },
    { to: '/proposals/submit', label: 'Apply to Host', icon: FilePlus, roles: ['ORGANIZER'] },
    { to: '/managed-events', label: 'Managed Events', icon: ClipboardList, roles: ['ORGANIZER'] },
    { to: '/proposals/my', label: 'Application History', icon: Bookmark, roles: ['ORGANIZER'] },
    { to: '/my-events', label: 'My Registrations', icon: Bookmark, roles: ['STUDENT'] },
    { to: '/admin/proposals', label: 'Review Inbox', icon: ShieldCheck, roles: ['ADMIN'] },
    { to: '/admin/users', label: 'Account Governance', icon: Users, roles: ['ADMIN'] },
    { to: '/admin/audit', label: 'Audit Trail', icon: ShieldAlert, roles: ['ADMIN'] },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full border-r border-slate-800">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">E</span>
            University EMS
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.filter(item => item.roles.includes(currentRole)).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-2">
                <UserCircle size={24} className="text-slate-500" />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user.email}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => { clearAuthData(); navigate('/login'); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 transition-colors"
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="px-4">
                <p className="text-sm font-bold text-white">Guest</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Browse events publicly</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-3 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserCircle size={18} /> Login / Register
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-64 p-8 bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}
export default AppLayout;
