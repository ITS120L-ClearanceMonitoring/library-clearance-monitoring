import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';
import './layout.css';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate after logout is complete
      navigate('/login', { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      alert("Error logging out. Please try again.");
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Library CMS</h2>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/clearances">Clearances</Link>
          <Link to="/history">History</Link>
          {user?.role === 'LIBRARY_ADMIN' && <Link to="/users">Users</Link>}
          <Button onClick={handleLogout} variant="ghost" size="sm" style={{ width: '100%', justifyContent: 'flex-start' }}>
            Logout
          </Button>
        </nav>
      </aside>
      <main className="content">
        <header>Welcome, {user?.displayName || 'Librarian'}</header>
        <Outlet /> {/* This renders the specific page (Clearances or Users) */}
      </main>
    </div>
  );
};

export default DashboardLayout;