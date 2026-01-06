import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Modal, Form, Spinner, Dropdown } from 'react-bootstrap';
import { UserPlus, Edit, ToggleLeft, ToggleRight, Key, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUsers,
  User,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  UpdateUserData
} from '../services/userService';
import InviteUserModal from '../components/InviteUserModal';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/dateUtils';

const ManageUsers: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updating, setUpdating] = useState(false);

  // Form state for editing user
  const [editForm, setEditForm] = useState<UpdateUserData>({
    userRoleId: 4, // Default to Team Member
    managerId: undefined
  });

  // Check if user has admin access
  if (user?.roleName !== 'Company Admin') {
    return (
      <Container fluid className="py-4">
        <Row>
          <Col>
            <Alert variant="danger">
              <h4>Access Denied</h4>
              <p>You don't have permission to access this page. Only Company Administrators can manage users.</p>
              <p>Please contact your administrator if you need access to this feature.</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUsers();

      if (response.success) {
        setUsers(response.data);
      } else {
        setError(response.message || 'Failed to load users');
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    loadUsers(); // Refresh the users list
    showSuccess('Success', 'User invited successfully!');
  };

  const handleEditUser = (user: User) => {
    if (user.invitationStatus !== 'accepted' || !user.userId) {
      return; // Only allow editing for accepted users with userId
    }
    setSelectedUser(user);
    setEditForm({
      userRoleId: user.roleId,
      managerId: user.managerId || undefined
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !selectedUser.userId) return;

    try {
      setUpdating(true);
      const response = await updateUser(selectedUser.userId, editForm);

      if (response.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        loadUsers(); // Refresh the list
        showSuccess('Success', 'User updated successfully!');
      } else {
        // Check if admin is trying to change their own role
        if (response.message && response.message.includes('cannot change your own role')) {
          showError('Action Not Allowed', 'You cannot change your own role as an administrator. Please contact another administrator to modify your role.');
        } else {
          showError('Error', response.message || 'Failed to update user');
        }
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      console.error('Error response data:', err.response?.data);

      // Check if admin is trying to change their own role (when backend returns 400)
      if (err.response?.data?.message === 'You cannot change your own role') {
        showError('Action Not Allowed', 'You cannot change your own role as an administrator. Please contact another administrator to modify your role.');
      } else {
        showError('Error', err.response?.data?.message || 'Failed to update user');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    if (user.invitationStatus !== 'accepted' || !user.userId) {
      return; // Only allow status toggle for accepted users with userId
    }

    try {
      const response = await toggleUserStatus(user.userId);

      if (response.success) {
        loadUsers(); // Refresh the list
        showSuccess('Success', `User ${response.data.isActive ? 'activated' : 'deactivated'} successfully!`);
      } else {
        // Check if admin is trying to deactivate their own account
        if (response.message === 'You cannot deactivate your own account') {
          showError('Action Not Allowed', 'You cannot deactivate your own account as an administrator.');
        } else {
          showError('Error', response.message || 'Failed to update user status');
        }
      }
    } catch (err: any) {
      console.error('Error toggling user status:', err);

      // Check if admin is trying to deactivate their own account
      if (err.response?.data?.message === 'You cannot deactivate your own account') {
        showError('Action Not Allowed', 'You cannot deactivate your own account as an administrator.');
      } else {
        showError('Error', err.response?.data?.message || 'Failed to update user status');
      }
    }
  };

  const handleResetPassword = async (user: User) => {
    if (user.invitationStatus !== 'accepted' || !user.userId || !user.fullName) {
      return; // Only allow password reset for accepted users with fullName
    }

    if (!window.confirm(`Are you sure you want to reset the password for ${user.fullName}? A temporary password will be sent to their email.`)) {
      return;
    }

    try {
      const response = await resetUserPassword(user.userId);

      if (response.success) {
        showSuccess('Success', 'Password reset successfully! A temporary password has been sent to the user\'s email.');
      } else {
        showError('Error', response.message || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      showError('Error', err.response?.data?.message || 'Failed to reset password');
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'Company Admin':
        return 'danger';
      case 'Company Manager':
        return 'warning';
      case 'Team Member':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const getAvailableRoles = () => [
    { id: 2, name: 'Company Admin' },
    { id: 3, name: 'Company Manager' },
    { id: 4, name: 'Team Member' }
  ];

  const getAvailableManagers = () => {
    return users.filter(u =>
      u.invitationStatus === 'accepted' &&
      (u.roleName === 'Company Admin' || u.roleName === 'Company Manager')
    );
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading users...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          {/* Mobile-first header: stack vertically on mobile, side-by-side on larger */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
            <div className="flex-grow-1">
              <h2 className="mb-1">
                <Users className="me-2" size={24} />
                Manage Users
              </h2>
              <p className="text-muted mb-0 d-none d-sm-block">Manage team members, roles, and permissions</p>
              <p className="text-muted mb-0 d-sm-none small">Manage team members</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowInviteModal(true)}
              className="d-flex align-items-center justify-content-center w-100 flex-md-grow-0"
              style={{ maxWidth: '180px' }}
            >
              <UserPlus className="me-2" size={16} />
              Invite User
            </Button>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Card style={{ overflow: 'visible' }}>
            <Card.Body className="p-0" style={{ overflow: 'visible' }}>
              <div className="table-responsive" style={{ overflow: 'visible' }}>
                {/* Mobile Card View (xs/sm screens) */}
                <div className="d-block d-md-none">
                  <div className="row g-3">
                    {users.map((user) => (
                      <div key={user.userId} className="col-12">
                        <Card className="h-100 shadow-sm">
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="flex-grow-1">
                                <h6 className="mb-1 text-truncate" title={user.invitationStatus === 'accepted' ? user.fullName : user.email}>
                                  {user.invitationStatus === 'accepted' ? user.fullName : 'Pending Invitation'}
                                </h6>
                                <small className="text-muted d-block text-truncate" title={user.email}>
                                  <i className="bi bi-envelope me-1"></i>{user.email}
                                </small>
                                {user.invitationStatus === 'accepted' && user.username && (
                                  <small className="text-muted d-block">
                                    <i className="bi bi-person me-1"></i>@{user.username}
                                  </small>
                                )}
                              </div>
                              {user.invitationStatus === 'accepted' ? (
                                <Badge bg={user.isActive ? 'success' : 'secondary'} className="ms-2 flex-shrink-0">
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              ) : (
                                <Badge bg="warning" className="text-dark ms-2 flex-shrink-0" style={{ fontSize: '0.7rem' }}>
                                  Pending
                                </Badge>
                              )}
                            </div>

                            <div className="row g-2 text-sm">
                              <div className="col-6">
                                <small className="text-muted d-block"><i className="bi bi-shield me-1"></i>Role</small>
                                <Badge bg={getRoleBadgeVariant(user.roleName)} className="text-truncate" style={{ maxWidth: '100px' }} title={user.roleName}>
                                  {user.roleName}
                                </Badge>
                              </div>
                              {user.invitationStatus === 'accepted' && user.managerName && (
                                <div className="col-6">
                                  <small className="text-muted d-block"><i className="bi bi-person-gear me-1"></i>Manager</small>
                                  <span className="text-truncate d-block" title={user.managerName}>
                                    {user.managerName}
                                  </span>
                                </div>
                              )}
                              <div className="col-6">
                                <small className="text-muted d-block"><i className="bi bi-calendar-check me-1"></i>Joined</small>
                                <span>{formatDate(user.createdDate)}</span>
                              </div>
                              {user.invitationStatus === 'accepted' && user.isSSOUser && (
                                <div className="col-6">
                                  <small className="text-muted d-block"><i className="bi bi-cloud me-1"></i>Auth</small>
                                  <Badge bg="info">SSO</Badge>
                                </div>
                              )}
                              {user.invitationStatus === 'pending' && user.expiryDate && (
                                <div className="col-6">
                                  <small className="text-muted d-block"><i className="bi bi-clock me-1"></i>Expires</small>
                                  <span className="text-danger">{formatDate(user.expiryDate)}</span>
                                </div>
                              )}
                            </div>

                            {/* Action buttons for mobile */}
                            <div className="d-flex gap-2 mt-3 pt-2 border-top">
                              {user.invitationStatus === 'accepted' ? (
                                <>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                    className="flex-fill"
                                  >
                                    <Edit size={14} className="me-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => handleToggleUserStatus(user)}
                                    className="flex-fill"
                                  >
                                    {user.isActive ? <ToggleRight size={14} className="me-1" /> : <ToggleLeft size={14} className="me-1" />}
                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                  </Button>
                                  {!user.isSSOUser && (
                                    <Button
                                      variant="outline-info"
                                      size="sm"
                                      onClick={() => handleResetPassword(user)}
                                      className="flex-fill"
                                    >
                                      <Key size={14} className="me-1" />
                                      Reset
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  disabled
                                  className="w-100"
                                >
                                  Invitation Pending
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View (md+ screens) */}
                <div className="d-none d-md-block">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th className="d-none d-md-table-cell">Email</th>
                        <th>Role</th>
                        <th className="d-none d-lg-table-cell">Manager</th>
                        <th>Status</th>
                        <th className="d-none d-md-table-cell">Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.userId}>
                          <td>
                            <div>
                              {user.invitationStatus === 'accepted' ? (
                                <>
                                  <strong>{user.fullName}</strong>
                                  {/* Show email on mobile since email column is hidden */}
                                  <div className="d-md-none small text-muted text-truncate" style={{ maxWidth: '150px' }}>
                                    {user.email}
                                  </div>
                                  <small className="text-muted d-none d-md-block">@{user.username}</small>
                                </>
                              ) : (
                                <>
                                  <strong className="text-muted">Pending</strong>
                                  <div className="d-md-none small text-muted text-truncate" style={{ maxWidth: '150px' }}>
                                    {user.email}
                                  </div>
                                  <small className="text-muted d-none d-md-block">Waiting for acceptance</small>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <div className="text-truncate" style={{ maxWidth: '200px' }} title={user.email}>
                              {user.email}
                            </div>
                            {user.invitationStatus === 'accepted' && user.isSSOUser && (
                              <Badge bg="info" className="mt-1">SSO</Badge>
                            )}
                          </td>
                          <td>
                            <Badge bg={getRoleBadgeVariant(user.roleName)} className="text-truncate" style={{ maxWidth: '90px' }}>
                              {user.roleName}
                            </Badge>
                          </td>
                          <td className="d-none d-lg-table-cell">
                            {user.invitationStatus === 'accepted' ? (
                              user.managerName || <span className="text-muted">-</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {user.invitationStatus === 'accepted' ? (
                              <Badge bg={user.isActive ? 'success' : 'secondary'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            ) : (
                              <Badge bg="warning" className="text-dark" style={{ fontSize: '0.7rem' }}>
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="d-none d-md-table-cell">
                            <div>
                              <div className="small">{formatDate(user.createdDate)}</div>
                              {user.invitationStatus === 'pending' && user.expiryDate && (
                                <small className="text-muted">
                                  Exp: {formatDate(user.expiryDate)}
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            {user.invitationStatus === 'accepted' ? (
                              // Actions for registered users
                              <Dropdown align="end">
                                <Dropdown.Toggle variant="outline-secondary" size="sm">
                                  <span className="d-none d-sm-inline">Actions</span>
                                  <span className="d-sm-none">•••</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" renderOnMount>
                                  <Dropdown.Item onClick={() => handleEditUser(user)}>
                                    <Edit className="me-2" size={16} />
                                    Edit Role & Manager
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => handleToggleUserStatus(user)}>
                                    {user.isActive ? (
                                      <>
                                        <ToggleRight className="me-2" size={16} />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <ToggleLeft className="me-2" size={16} />
                                        Activate
                                      </>
                                    )}
                                  </Dropdown.Item>
                                  {!user.isSSOUser && (
                                    <Dropdown.Item onClick={() => handleResetPassword(user)}>
                                      <Key className="me-2" size={16} />
                                      Reset Password
                                    </Dropdown.Item>
                                  )}
                                </Dropdown.Menu>
                              </Dropdown>
                            ) : (
                              // Actions for pending invitations
                              <Dropdown align="end">
                                <Dropdown.Toggle variant="outline-secondary" size="sm">
                                  <span className="d-none d-sm-inline">Actions</span>
                                  <span className="d-sm-none">•••</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" renderOnMount>
                                  <Dropdown.Item disabled>
                                    <small className="text-muted">Invitation pending acceptance</small>
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              {users.length === 0 && (
                <div className="text-center py-5">
                  <Users size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No users found</h5>
                  <p className="text-muted">Start by inviting your first team member.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Invite User Modal */}
      <InviteUserModal
        show={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
      />

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => !updating && setShowEditModal(false)}>
        <Modal.Header closeButton={!updating}>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div className="mb-3">
              <strong>User:</strong> {selectedUser.fullName} ({selectedUser.email})
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Select
              value={editForm.userRoleId}
              onChange={(e) => setEditForm(prev => ({ ...prev, userRoleId: parseInt(e.target.value) }))}
              disabled={updating}
            >
              {getAvailableRoles().map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Manager (Optional)</Form.Label>
            <Form.Select
              value={editForm.managerId || ''}
              onChange={(e) => setEditForm(prev => ({
                ...prev,
                managerId: e.target.value ? parseInt(e.target.value) : undefined
              }))}
              disabled={updating}
            >
              <option value="">No Manager</option>
              {getAvailableManagers().map(manager => (
                manager.userId ? (
                  <option key={manager.userId} value={manager.userId}>
                    {manager.fullName} ({manager.roleName})
                  </option>
                ) : null
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Assign a manager to this user. Only Company Admins and Managers can be assigned as managers.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateUser}
            disabled={updating}
          >
            {updating ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update User'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageUsers;