import { useState, useCallback } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useInactivityTimeout } from '../../hooks/useInactivityTimeout';
import { Button, Modal } from '../ui';
import HomeIcon from '../../assets/Home.png';
import DocumentsIcon from '../../assets/Documents.png';
import HistoryIcon from '../../assets/History.png';
import UsersIcon from '../../assets/Users.png';
import LogoutIcon from '../../assets/Logout.png';
import HamburgerIcon from '../../assets/Hamburger.png';
import './layout.css';

const DashboardLayout = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isAdmin = user?.role === 'LIBRARY_ADMIN';

  // Auto-logout on inactivity: 30 mins timeout, warning at 25 mins
  const handleInactivityLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error("Inactivity logout error:", err);
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  const { showWarning, remainingSeconds, dismissWarning } = useInactivityTimeout(
    handleInactivityLogout,
    30, // 30 minutes timeout
    5   // 5 minutes warning
  );

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      // Navigate after logout is complete
      navigate('/login', { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      alert("Error logging out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <img src={HamburgerIcon} alt="Toggle sidebar" />
          </button>
          <h2>Library CMS</h2>
        </div>
        {!loading && (
          <nav>
            <Link to="/">
              <span className="sidebar-icon">
                <img src={HomeIcon} alt="Home" />
              </span>
              <span className="sidebar-label">Home</span>
            </Link>
            <Link to="/clearances">
              <span className="sidebar-icon">
                <img src={DocumentsIcon} alt="Clearances" />
              </span>
              <span className="sidebar-label">Clearances</span>
            </Link>
            {isAdmin && (
              <Link to="/history">
                <span className="sidebar-icon">
                  <img src={HistoryIcon} alt="History" />
                </span>
                <span className="sidebar-label">History</span>
              </Link>
            )}
            {isAdmin && (
              <Link to="/users">
                <span className="sidebar-icon">
                  <img src={UsersIcon} alt="Users" />
                </span>
                <span className="sidebar-label">Users</span>
              </Link>
            )}
            <Button
              onClick={handleLogoutClick}
              variant="ghost"
              size="sm"
              style={{ width: '100%' }}
            >
              <span className="sidebar-icon">
                <img src={LogoutIcon} alt="Logout" />
              </span>
              <span className="sidebar-label">Logout</span>
            </Button>
          </nav>
        )}
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => !isLoggingOut && setShowLogoutModal(false)}
        title="Confirm Logout"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Are you sure you want to logout? You'll need to log in again to access the system.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button 
              variant="ghost" 
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={performLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inactivity Warning Modal */}
      <Modal
        isOpen={showWarning}
        onClose={dismissWarning}
        title="Session Timeout Warning"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0, color: '#d32f2f', fontSize: '14px', fontWeight: '600' }}>
            Your session will expire in {remainingSeconds} seconds due to inactivity.
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
            Click "Continue" to stay logged in or your session will be automatically closed.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button 
              variant="primary" 
              onClick={dismissWarning}
            >
              Continue Session
            </Button>
          </div>
        </div>
      </Modal>
      <main className="content">
        <header>
          <div className="header-left">
            <span>Welcome, {user?.first_name && user?.last_name ? `${user.first_name}${user.middle_name ? ` ${user.middle_name}` : ''} ${user.last_name}` : user?.email || 'User'}</span>
          </div>
        </header>
        <Outlet /> {/* This renders the specific page (Clearances or Users) */}
      </main>
    </div>
  );
};

export default DashboardLayout;