import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};
