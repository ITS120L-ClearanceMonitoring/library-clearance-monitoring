import { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useInactivityTimeout } from '../../hooks/useInactivityTimeout';
import { Button, Modal } from '../ui';
import HomeIcon from '../../assets/Home.png';
import DocumentsIcon from '../../assets/Documents.png';
import HistoryIcon from '../../assets/History.png';
import UsersIcon from '../../assets/Users.png';
import LogoutIcon from '../../assets/Logout.png';
import HamburgerIcon from '../../assets/Hamburger.png';
import MapuaLogo from '../../assets/mapualogo.png';
import './layout.css';

const NavItem = ({ to, icon, label, onClick }) => {
  if (onClick) {
    return (
      <button type="button" className="nav-item" onClick={onClick}>
        <span className="sidebar-icon">
          <img src={icon} alt={label} />
        </span>
        <span className="sidebar-label">{label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      <span className="sidebar-icon">
        <img src={icon} alt={label} />
      </span>
      <span className="sidebar-label">{label}</span>
    </NavLink>
  );
};

const DashboardLayout = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isAdmin = user?.role === 'LIBRARY_ADMIN';

  const handleInactivityLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Inactivity logout error:', err);
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  const { showWarning, remainingSeconds, dismissWarning } = useInactivityTimeout(
    handleInactivityLogout,
    30, // 30 minutes timeout
    5   // 5 minutes warning
  );

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      alert('Error logging out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name}${user.middle_name ? ` ${user.middle_name}` : ''} ${user.last_name}`
      : user?.email || 'User';

  return (
    <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <img src={HamburgerIcon} alt="Toggle sidebar" />
          </button>
          <h2>Library CMS</h2>
        </div>

        {!loading && (
          <nav>
            <NavItem to="/"           icon={HomeIcon}      label="Home"       />
            <NavItem to="/clearances" icon={DocumentsIcon} label="Clearances" />
            {isAdmin && (
              <NavItem to="/history"  icon={HistoryIcon}   label="History"    />
            )}
            {isAdmin && (
              <NavItem to="/users"    icon={UsersIcon}     label="Users"      />
            )}
            {isAdmin && (
              <NavItem to="/configuration"    icon={UsersIcon}     label="Settings"      />
            )}
            <NavItem
              icon={LogoutIcon}
              label="Logout"
              onClick={() => setShowLogoutModal(true)}
            />
          </nav>
        )}

        <div className="sidebar-logo">
          <img src={MapuaLogo} alt="Mapua Logo" />
        </div>
        
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
            <Button variant="primary" onClick={dismissWarning}>
              Continue Session
            </Button>
          </div>
        </div>
      </Modal>

      <main className="content">
        <header>
          <div className="header-left">
            <span>Welcome, {displayName}</span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;