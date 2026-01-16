import React, { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { changePassword } from '../services/authService';

interface ChangePasswordModalProps {
  show: boolean;
  onHide: () => void;
}

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ show, onHide }) => {
  const [formData, setFormData] = useState<ChangePasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (field: keyof ChangePasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters long';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, number, and special character (@, $, !, %, *, ?, &, _)';
    }

    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== FRONTEND CHANGE PASSWORD START ===');
    console.log(`🕒 Frontend request initiated at: ${new Date().toISOString()}`);

    if (!validateForm()) {
      console.log('❌ Frontend form validation failed');
      return;
    }

    console.log('✅ Frontend form validation passed');
    console.log('📤 Sending change password request to backend...');

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Payload being sent:');
      console.log('   - currentPassword length:', formData.currentPassword.length);
      console.log('   - newPassword length:', formData.newPassword.length);
      console.log('   - confirmPassword length:', formData.confirmPassword.length);

      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      console.log('✅ Backend response received successfully');

      // Reset form and close modal on success
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setValidationErrors({});
      onHide();

      console.log('🎉 Password change completed successfully');
      console.log('=== FRONTEND CHANGE PASSWORD SUCCESS ===');

      // Show success message (you can use toast here)
      alert('Password changed successfully!');

    } catch (err: any) {
      console.log('❌ Password change failed');
      console.log('Error details:', err);
      console.log('Error response:', err.response);
      console.log('Error response data:', err.response?.data);
      console.log('Error response status:', err.response?.status);

      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('🔄 Frontend loading state reset');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setValidationErrors({});
      setError('');
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>
          <Lock size={20} className="me-2" />
          Change Password
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Current Password *</Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                isInvalid={!!validationErrors.currentPassword}
                disabled={isLoading}
                placeholder="Enter your current password"
              />
              <Button
                variant="link"
                className="position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted"
                onClick={() => togglePasswordVisibility('current')}
                disabled={isLoading}
                type="button"
              >
                {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            <Form.Control.Feedback type="invalid">
              {validationErrors.currentPassword}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New Password *</Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                isInvalid={!!validationErrors.newPassword}
                disabled={isLoading}
                placeholder="Example: MyPass123!"
              />
              <Button
                variant="link"
                className="position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted"
                onClick={() => togglePasswordVisibility('new')}
                disabled={isLoading}
                type="button"
              >
                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            <Form.Control.Feedback type="invalid">
              {validationErrors.newPassword}
            </Form.Control.Feedback>
            <Form.Text className="text-info">
              Min 8 characters with uppercase, lowercase, number & special character (@$!%*?&_)
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Confirm New Password *</Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                isInvalid={!!validationErrors.confirmPassword}
                disabled={isLoading}
                placeholder="Confirm your new password"
              />
              <Button
                variant="link"
                className="position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={isLoading}
                type="button"
              >
                {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            <Form.Control.Feedback type="invalid">
              {validationErrors.confirmPassword}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Changing Password...
              </>
            ) : (
              <>
                <Lock size={16} className="me-2" />
                Change Password
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;