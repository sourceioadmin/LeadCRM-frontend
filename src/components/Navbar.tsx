import React, { useState } from 'react';
import { Navbar as BootstrapNavbar, Nav, Button, Form, FormControl, Dropdown } from 'react-bootstrap';
import { Menu, Bell, User, LogOut, Key } from 'lucide-react'; // Using lucide-react for icons
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  isMobile: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, sidebarCollapsed, isMobile }) => {
  const { user, logout } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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
      <BootstrapNavbar className={`topbar ${sidebarCollapsed ? 'collapsed' : ''}`} bg="light" expand="lg">
        <div className="d-flex align-items-center w-100">
          <Button
            variant="link"
            className="text-dark p-0 me-3"
            onClick={onToggleSidebar}
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

          <div className="topbar-actions">
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
