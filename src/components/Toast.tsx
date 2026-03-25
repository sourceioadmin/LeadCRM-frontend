import React, { useState, useEffect, createContext, useContext } from 'react';
import { Toast as BootstrapToast } from 'react-bootstrap';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface ToastContextValue {
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastItemProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => onClose(toast.id), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const getVariant = () => {
    switch (toast.type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onClose(toast.id), 300);
  };

  return (
    <BootstrapToast
      show={show}
      onClose={handleClose}
      delay={5000}
      autohide
      bg={getVariant()}
      className="border-0 shadow-lg"
      style={{ minWidth: '300px', maxWidth: '400px' }}
    >
      <BootstrapToast.Header className="bg-transparent border-0">
        <strong className="me-auto text-white">{toast.title}</strong>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={handleClose}
          aria-label="Close"
        />
      </BootstrapToast.Header>
      <BootstrapToast.Body className="text-white">
        {toast.message}
      </BootstrapToast.Body>
    </BootstrapToast>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const value: ToastContextValue = {
    showSuccess: (title, message) => addToast('success', title, message),
    showError: (title, message) => addToast('error', title, message),
    showWarning: (title, message) => addToast('warning', title, message),
    showInfo: (title, message) => addToast('info', title, message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1060,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
