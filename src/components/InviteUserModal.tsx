import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { inviteUser } from '../services/userService';

interface InviteUserModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    userRoleId: 4 // Default to Team Member
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'userRoleId' ? parseInt(value) : value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await inviteUser(formData);
      
      if (response.success) {
        setSuccess('Invitation sent successfully!');
        setFormData({ email: '', userRoleId: 4 }); // Always reset to Team Member

        // Close modal and refresh parent after 2 seconds
        setTimeout(() => {
          setSuccess(null);
          onSuccess();
          onHide();
        }, 2000);
      } else {
        setError(response.message || 'Failed to send invitation');
      }
    } catch (err: any) {
      console.error('Invite user error:', err);
      setError(
        err.response?.data?.message || 
        'An error occurred while sending the invitation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ email: '', userRoleId: 4 }); // Reset to Team Member default
      setError(null);
      setSuccess(null);
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop={loading ? 'static' : true}>
      <Modal.Header closeButton={!loading}>
        <Modal.Title>Invite User</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success">
              {success}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>
              Email Address <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
              disabled={loading}
            />
            <Form.Text className="text-muted">
              An invitation link will be sent to this email address
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Role <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              name="userRoleId"
              value={formData.userRoleId}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value={4}>Team Member</option>
              <option value={5}>Referral Partner</option>
            </Form.Select>
            <Form.Text className="text-muted">
              Choose the role for this user. You can select Team Member or Referral Partner. Roles can be changed later in the manage users section.
            </Form.Text>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Sending...
              </>
            ) : (
              'Send Invitation'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default InviteUserModal;

