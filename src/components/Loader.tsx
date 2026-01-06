import React from 'react';
import { Spinner } from 'react-bootstrap';

interface LoaderProps {
  size?: 'sm' | 'lg';
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'lg', className = '' }) => {
  return (
    <div className={`d-flex justify-content-center align-items-center ${className}`}>
      <Spinner
        animation="border"
        role="status"
        variant="primary"
        size={size === 'sm' ? undefined : 'sm'}
        className="me-2"
      >
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <span>Loading...</span>
    </div>
  );
};

export default Loader;
