import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  /** Redirect to this path when unauthenticated. Defaults to /login */
  redirectTo?: string;
}

/**
 * Wraps protected routes. Unauthenticated users are redirected to /login,
 * and the current path is saved in location.state so they can return after
 * signing in.
 */
const ProtectedRoute = ({ redirectTo = '/login' }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
