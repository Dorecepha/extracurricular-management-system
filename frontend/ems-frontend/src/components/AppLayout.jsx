import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, LogOut, ClipboardList, Edit3, Inbox } from 'lucide-react';
import { safeParseUser, safeGetItem } from '../lib/safeParse';

function AppLayout() {
  const navigate = useNavigate();
  const user = safeParseUser();
  const userRole = safeGetItem('userRole') || user?.role;
  const displayName =
    user?.organizationName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Signed-in user';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const baseNav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/events', label: 'Events', icon: Calendar },
  ];

  const organizerNav = [
    { to: '/proposals/submit', label: 'Apply to Host', icon: Edit3 },
    { to: '/proposals/my', label: 'My Proposals', icon: ClipboardList },
  ];

  const adminNav = [
    { to: '/admin/proposals', label: 'Review Queue', icon: Inbox },
  ];

  const navItems = [
    ...baseNav,
    ...(userRole === 'ORGANIZER' ? organizerNav : []),
    ...(userRole === 'ADMIN' ? adminNav : []),
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 flex-shrink-0 bg-[#1f5f89] text-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center py-8 flex-col gap-2">
             <h2 className="text-2xl font-bold tracking-wider">EMS</h2>
             <div className="text-center text-blue-100 text-xs font-semibold leading-tight">
               <div className="opacity-80">{displayName}</div>
               <div className="uppercase tracking-wide text-[10px] opacity-70">{userRole || 'USER'}</div>
             </div>
          </div>
          
          <nav className="flex-1 space-y-2 px-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                    isActive ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/5'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-blue-100 transition hover:bg-white/5"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
