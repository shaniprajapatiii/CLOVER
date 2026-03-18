import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../store';
import { notificationAPI } from '../services/api';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '⊞', exact: true },
  { path: '/dashboard/policy', label: 'My Policy', icon: '🛡️' },
  { path: '/dashboard/claims', label: 'Claims', icon: '📋' },
  { path: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
  { path: '/dashboard/weather', label: 'Weather Alerts', icon: '🌤️' },
  { path: '/dashboard/notifications', label: 'Notifications', icon: '🔔', badge: true },
  { path: '/dashboard/kyc', label: 'KYC / Documents', icon: '📄' },
  { path: '/dashboard/referral', label: 'Refer & Earn', icon: '🎁' },
  { path: '/dashboard/profile', label: 'Profile', icon: '👤' },
];

const ADMIN_ITEMS = [
  { path: '/dashboard/admin', label: 'Admin Panel', icon: '⚙️' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { worker, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, unreadCount, setUnreadCount } = useUIStore();
  const [mobileSidebar, setMobileSidebar] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationAPI.getAll({ unreadOnly: 'true', limit: 1 });
        setUnreadCount(res.data.unreadCount || 0);
      } catch { }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path) && location.pathname !== '/dashboard' || (exact && location.pathname === path);
  const isActiveCheck = (item) => item.exact ? location.pathname === item.path : location.pathname === item.path;

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-dark-600">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-glow">G</div>
          {sidebarOpen && <span className="font-display text-xl font-bold text-white">GigShield</span>}
        </Link>
      </div>

      {/* Worker Card */}
      {sidebarOpen && (
        <div className="m-3 p-3 bg-dark-700 rounded-xl border border-dark-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 font-bold text-sm">
              {worker?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{worker?.name}</p>
              <p className="text-gray-500 text-xs capitalize">{worker?.platform} · {worker?.city}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className={`badge text-xs ${worker?.riskCategory === 'low' ? 'badge-green' : worker?.riskCategory === 'high' ? 'badge-red' : 'badge-yellow'}`}>
              {worker?.riskCategory} risk
            </span>
            <span className="text-xs text-brand-400 font-medium">⭐ {worker?.loyaltyPoints || 0} pts</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <Link key={item.path} to={item.path}
            onClick={() => setMobileSidebar(false)}
            className={isActiveCheck(item) ? 'sidebar-link-active' : 'sidebar-link'}>
            <span className="text-lg">{item.icon}</span>
            {sidebarOpen && (
              <span className="flex-1 text-sm">{item.label}</span>
            )}
            {sidebarOpen && item.badge && unreadCount > 0 && (
              <span className="w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        ))}
        {worker?.role === 'admin' && (
          <>
            <div className={`${sidebarOpen ? 'px-4' : 'px-2'} py-2`}>
              <div className="h-px bg-dark-600" />
              {sidebarOpen && <p className="text-xs text-gray-600 font-medium mt-2 uppercase tracking-wider">Admin</p>}
            </div>
            {ADMIN_ITEMS.map(item => (
              <Link key={item.path} to={item.path}
                onClick={() => setMobileSidebar(false)}
                className={isActiveCheck(item) ? 'sidebar-link-active' : 'sidebar-link'}>
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-dark-600">
        <button onClick={handleLogout}
          className={`sidebar-link w-full ${!sidebarOpen ? 'justify-center' : ''}`}>
          <span className="text-lg">🚪</span>
          {sidebarOpen && <span className="text-sm">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col bg-dark-800 border-r border-dark-700 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {mobileSidebar && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileSidebar(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-dark-800 border-r border-dark-700 z-50 lg:hidden">
            <SidebarContent />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-dark-800/80 backdrop-blur border-b border-dark-700 px-4 sm:px-6 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebar(!mobileSidebar)} className="lg:hidden btn-ghost p-2">☰</button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex btn-ghost p-2 text-lg">
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {worker?.activePolicyId ? (
              <span className="badge-green text-xs hidden sm:flex">🛡️ Protected</span>
            ) : (
              <Link to="/dashboard/policy" className="badge-red text-xs hidden sm:flex cursor-pointer hover:opacity-80">⚠️ Not Covered</Link>
            )}
            <Link to="/dashboard/notifications" className="relative btn-ghost p-2">
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
