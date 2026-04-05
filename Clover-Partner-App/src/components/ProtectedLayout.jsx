import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, Wallet, User as UserIcon } from 'lucide-react';

export const ProtectedLayout = () => {
  const location = useLocation();

  return (
    <div className="h-[100dvh] w-full relative bg-[#121212]">
      {/* Outlet fills above the nav bar */}
      <div className="w-full h-full pb-16 overflow-hidden">
        <Outlet />
      </div>

      <nav 
        className="fixed bottom-0 left-0 w-full bg-[#1E1E1E] flex items-center justify-around border-t border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex-shrink-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(4rem + env(safe-area-inset-bottom))', zIndex: 9999, pointerEvents: 'auto' }}
      >
        <Link 
          to="/dashboard"
          className="flex flex-col items-center gap-1 w-16 h-full justify-center pointer-events-auto cursor-pointer"
        >
          <Home className={`${location.pathname === '/dashboard' ? 'text-[#FC8019]' : 'text-gray-500'} transition-colors`} size={22} />
          <span className={`text-[10px] font-bold ${location.pathname === '/dashboard' ? 'text-[#FC8019]' : 'text-gray-500'} transition-colors`}>Home</span>
        </Link>
        <Link 
          to="/earnings"
          className="flex flex-col items-center gap-1 w-16 h-full justify-center pointer-events-auto cursor-pointer"
        >
          <Wallet className={`${location.pathname.startsWith('/earnings') ? 'text-[#FC8019]' : 'text-gray-500'} transition-colors`} size={22} />
          <span className={`text-[10px] font-bold ${location.pathname.startsWith('/earnings') ? 'text-[#FC8019]' : 'text-gray-500'} transition-colors`}>Earnings</span>
        </Link>
        <Link 
          to="/profile"
          className="flex flex-col items-center gap-1 w-16 h-full justify-center pointer-events-auto cursor-pointer"
        >
          <UserIcon className={`${location.pathname === '/profile' ? 'text-[#FC8019]' : 'text-gray-500'} transition-colors`} size={22} />
          <span className={`text-[10px] font-bold ${location.pathname === '/profile' ? 'text-[#FC8019]' : 'text-gray-500'} transition-colors`}>Profile</span>
        </Link>
      </nav>
    </div>
  );
};
