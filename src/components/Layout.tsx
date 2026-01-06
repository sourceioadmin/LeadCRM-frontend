import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Container, ToastContainer } from 'react-bootstrap';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Toast from './Toast';
import { useToast } from './Toast';

const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed on mobile
  const [isMobile, setIsMobile] = useState(false);
  const { toasts, removeToast } = useToast();

  // Check if we're on mobile and set initial state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, always start collapsed. On desktop, start expanded
      setSidebarCollapsed(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="d-flex flex-column vh-100">
      <Navbar
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
      />
      <div className="d-flex flex-grow-1 position-relative">
        <Sidebar
          collapsed={sidebarCollapsed}
          isMobile={isMobile}
          onClose={() => isMobile && setSidebarCollapsed(true)}
        />
        {/* Mobile overlay when sidebar is open */}
        {isMobile && !sidebarCollapsed && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 998 }}
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
        <div className={`main-content flex-grow-1 ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
          <Container fluid className="py-3 py-md-4">
            <Outlet />
          </Container>
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

export default Layout;
