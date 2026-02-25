import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Checking authorization...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Debug logging
  console.log("ProtectedRoute Check - user.must_change_password:", user.must_change_password);
  console.log("ProtectedRoute Check - current path:", location.pathname);

  // Force first-time setup based on your SQL schema flag
  if (user.must_change_password && location.pathname !== '/change-password') {
    console.log("Redirecting to /change-password because must_change_password is true");
    return <Navigate to="/change-password" replace />;
  }

  // Admin access check (matches 'LIBRARY_ADMIN' from your Enum)
  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;