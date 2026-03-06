import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Checking authorization...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Force first-time setup based on your SQL schema flag
  if (user.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Admin access check (matches 'LIBRARY_ADMIN' from your Enum)
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;