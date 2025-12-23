import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Calendar, LogOut, ClipboardList, FilePlus, Settings, Bookmark, ShieldCheck } from 'lucide-react';
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

  const navItems = [
    { to: '/events', label: 'Campus Events', icon: Calendar, roles: ['STUDENT', 'ORGANIZER', 'ADMIN'] },
    
    // ORGANIZER
    { to: '/proposals/submit', label: 'Apply to Host', icon: FilePlus, roles: ['ORGANIZER'] },
    { to: '/managed-events', label: 'Managed Events', icon: Settings, roles: ['ORGANIZER'] },
    { to: '/proposals/my', label: 'My Proposals', icon: ClipboardList, roles: ['ORGANIZER'] },
    
    // STUDENT
    { to: '/my-events', label: 'My Registrations', icon: Bookmark, roles: ['STUDENT'] },
    
    // ADMIN (Simplified)
    { to: '/admin/proposals', label: 'Review Inbox', icon: ShieldCheck, roles: ['ADMIN'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles?.includes(userRole));

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 flex-shrink-0 bg-[#1f5f89] text-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center py-8 flex-col gap-2">
             <h2 className="text-3xl font-bold tracking-wider">EMS</h2>
             <div className="text-center text-blue-100 text-xs font-semibold leading-tight">
               <div className="text-xl opacity-80">{displayName}</div>
               <div className="uppercase tracking-wide text-[15px] opacity-70">{userRole || 'USER'}</div>
             </div>
          </div>
          
          <nav className="flex-1 space-y-2 px-4">
            {filteredNavItems.map((item) => (
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
