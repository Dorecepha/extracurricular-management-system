import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, LogOut, FileText, CheckSquare } from 'lucide-react';
import { safeParseUser, safeGetItem, clearAuthData } from '../lib/safeParse';

function AppLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Session hydration with SafeParse
  useEffect(() => {
    const token = safeGetItem('token');
    const userData = safeParseUser('user');

    // If no token or corrupted user data, redirect to login immediately
    if (!token || !userData) {
      clearAuthData();
      navigate('/login', { replace: true });
      return;
    }

    // Valid session found
    setUser(userData);
    setIsLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  // Show nothing while checking session (prevents flash of content)
  if (isLoading) {
    return null;
  }

  // Build navigation items based on role
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['STUDENT', 'ORGANIZER', 'ADMIN'] },
    { to: '/events', label: 'Events', icon: Calendar, roles: ['STUDENT', 'ORGANIZER', 'ADMIN'] },
    // ORGANIZER can submit proposals
    { to: '/proposals/submit', label: 'Submit Proposal', icon: FileText, roles: ['ORGANIZER'] },
    // ADMIN can review proposals
    { to: '/admin/proposals', label: 'Review Proposals', icon: CheckSquare, roles: ['ADMIN'] },
  ];

  // Filter nav items based on user role with STRICT equality checks
  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    // Use strict equality for role validation
    return item.roles.some((role) => role === user.role);
  });

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 bg-[#1f5f89] text-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center py-8">
             <h2 className="text-2xl font-bold tracking-wider">EMS</h2>
          </div>

          {/* User Info */}
          <div className="px-4 pb-4">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-sm font-medium text-white">{user.name || user.email}</p>
              <p className="text-xs text-blue-100">{user.role}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4">
            {visibleNavItems.map((item) => (
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
