import React, { useState, useEffect } from 'react';
import { Toast as BootstrapToast, ToastContainer } from 'react-bootstrap';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
  delay?: number;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose, delay = 5000 }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => onClose(toast.id), 300); // Wait for animation
    }, delay);

    return () => clearTimeout(timer);
  }, [toast.id, onClose, delay]);

  const getVariant = () => {
    switch (toast.type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  return (
    <BootstrapToast
      show={show}
      onClose={() => {
        setShow(false);
        setTimeout(() => onClose(toast.id), 300);
      }}
      delay={5000}
      autohide
      bg={getVariant()}
      className="border-0 shadow-lg"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1060,
        minWidth: '350px',
        maxWidth: '400px'
      }}
    >
      <BootstrapToast.Header className="bg-transparent border-0">
        <strong className="me-auto text-white">{toast.title}</strong>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={() => {
            setShow(false);
            setTimeout(() => onClose(toast.id), 300);
          }}
          aria-label="Close"
        ></button>
      </BootstrapToast.Header>
      <BootstrapToast.Body className="text-white">
        {toast.message}
      </BootstrapToast.Body>
    </BootstrapToast>
  );
};

export default Toast;

// Toast Manager Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message: string) => {
    console.log('Toast showSuccess called:', title, message);
    addToast('success', title, message);
  };

  const showError = (title: string, message: string) => {
    console.log('Toast showError called:', title, message);
    addToast('error', title, message);
  };

  const showWarning = (title: string, message: string) => {
    console.log('Toast showWarning called:', title, message);
    addToast('warning', title, message);
  };

  const showInfo = (title: string, message: string) => {
    console.log('Toast showInfo called:', title, message);
    addToast('info', title, message);
  };

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
