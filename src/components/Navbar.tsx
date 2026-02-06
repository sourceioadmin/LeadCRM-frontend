import React, { useState } from 'react';
import { Navbar as BootstrapNavbar, Nav, Button, Form, FormControl, Dropdown } from 'react-bootstrap';
import { Menu, Bell, User, LogOut, Key, Building2 } from 'lucide-react'; // Using lucide-react for icons
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

// LeadBox Icon Component
const LeadboxIcon: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <img
    src="/leadbox-icon.png"
    alt="Leadbox"
    width={size}
    height={size}
    style={{ objectFit: 'contain' }}
  />
);

// Determine backend base URL for constructing full image URLs
const getBackendBaseURL = (): string => {
  const currentHost = window.location.hostname;
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  return `http://${currentHost}:5000`;
};

const resolveBackendImageUrl = (maybeRelativeUrl?: string): string | null => {
  if (!maybeRelativeUrl) return null;
  const url = maybeRelativeUrl.trim();
  if (!url) return null;

  // Already absolute or data URL
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  const base = getBackendBaseURL();
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
};

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  isMobile: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, sidebarCollapsed, isMobile }) => {
  const { user, logout } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const companyName = user?.companyName || user?.company?.companyName || 'Company';
  const companyLogo = user?.companyLogo || user?.logo || user?.company?.logo;
  const companyLogoSrc = resolveBackendImageUrl(companyLogo);

  const handleLogout = () => {
    console.log('🔓 Logout initiated by user');
    if (window.confirm('Are you sure you want to logout?')) {
      console.log('✅ User confirmed logout, clearing authentication data');
      logout();
    } else {
      console.log('❌ User cancelled logout');
    }
  };

  const handleChangePassword = () => {
    console.log('🔑 Change password modal opened by user');
    setShowChangePasswordModal(true);
  };

  return (
    <>
      <BootstrapNavbar className={`topbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} expand="lg">
        {/* Desktop brand strip aligned with search row */}
        <div className="topbar-brand-strip d-none d-md-flex">
          <div className="d-flex align-items-center gap-2">
            <LeadboxIcon size={30} />
            <span className="topbar-brand-text">Leadbox</span>
          </div>
        </div>

        <div className="topbar-main d-flex align-items-center flex-grow-1">
          {/* Mobile brand (always visible on mobile topbar) */}
          <div className="topbar-mobile-brand d-flex d-md-none align-items-center gap-2 me-2">
            <LeadboxIcon size={26} />
            <span className="topbar-brand-text topbar-mobile-brand-text">Leadbox</span>
          </div>

          <Button
            variant="link"
            className="text-dark p-0 me-2 me-md-3"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </Button>

          <Form className={`flex-grow-1 me-3 ${isMobile ? 'd-none' : ''}`}>
            <FormControl
              type="search"
              placeholder="Search leads, clients..."
              className="topbar-search"
            />
          </Form>

          <div className="topbar-actions ms-auto">
            {/* Company badge - always visible in top area */}
            <div className="topbar-company-badge" title={companyName}>
              {companyLogoSrc ? (
                <img
                  src={companyLogoSrc}
                  alt={companyName}
                  className="topbar-company-logo"
                />
              ) : (
                <Building2 size={18} className="topbar-company-fallback-icon" />
              )}
              <span className="topbar-company-name">{companyName}</span>
            </div>

            <Button variant="link" className="text-dark p-2">
              <Bell size={20} />
            </Button>

            <Dropdown align="end">
              <Dropdown.Toggle
                variant="link"
                className="text-dark p-2 d-flex align-items-center"
                id="user-dropdown"
              >
                <User size={20} />
                <span className="ms-2 d-none d-lg-inline">
                  {user?.fullName || 'User'}
                </span>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <div className="px-3 py-2 border-bottom">
                  <div className="fw-bold">{user?.fullName}</div>
                  <div className="text-muted small">{user?.email}</div>
                  <div className="text-muted small">{user?.roleName}</div>
                </div>

                <Dropdown.Item onClick={handleChangePassword}>
                  <Key size={16} className="me-2" />
                  Change Password
                </Dropdown.Item>

                <Dropdown.Divider />

                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <LogOut size={16} className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </BootstrapNavbar>

      <ChangePasswordModal
        show={showChangePasswordModal}
        onHide={() => setShowChangePasswordModal(false)}
      />
    </>
  );
};

export default Navbar;
