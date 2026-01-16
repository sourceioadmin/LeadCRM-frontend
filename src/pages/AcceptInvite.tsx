import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { getInvitationDetails, registerInvite, InvitationDetails } from '../services/authService';

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string>(''); // Track which field has error
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState<string>('');
  const [passwordMatch, setPasswordMatch] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setLoading(false);
      return;
    }

    fetchInvitationDetails();
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      const response = await getInvitationDetails(token!);
      
      if (response.data.success) {
        setInvitation(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load invitation details');
      }
    } catch (err: any) {
      console.error('Error fetching invitation:', err);
      setError(
        err.response?.data?.message || 
        'This invitation link is invalid or has expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing in the error field
    if (errorField === name) {
      setError(null);
      setErrorField('');
    }

    // Check password strength
    if (name === 'password') {
      checkPasswordStrength(value);
    }

    // Check password match
    if (name === 'confirmPassword' || name === 'password') {
      const pwd = name === 'password' ? value : formData.password;
      const confirmPwd = name === 'confirmPassword' ? value : formData.confirmPassword;
      setPasswordMatch(pwd === confirmPwd);
    }
  };

  const checkPasswordStrength = (password: string) => {
    if (password.length === 0) {
      setPasswordStrength('');
      return;
    }
    
    if (password.length < 8) {
      setPasswordStrength('weak');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (strength <= 2) {
      setPasswordStrength('weak');
    } else if (strength === 3) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'strong':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorField('');

    // Validation
    if (!formData.fullName) {
      setError('Full name is required');
      setErrorField('fullName');
      return;
    }

    if (!formData.username) {
      setError('Username is required');
      setErrorField('username');
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      setErrorField('password');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setErrorField('password');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@, $, !, %, *, ?, &, _)');
      setErrorField('password');
      return;
    }

    if (!formData.confirmPassword) {
      setError('Confirm password is required');
      setErrorField('confirmPassword');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setErrorField('confirmPassword');
      return;
    }

    setSubmitting(true);

    try {
      const response = await registerInvite({
        invitationToken: token!,
        ...formData
      });

      if (response.data.success) {
        // Store user ID for OTP verification
        const userData = response.data.data;
        console.log('🔐 [AcceptInvite] Registration successful, storing verification data:');
        console.log('  - userId:', userData.userId);
        console.log('  - email:', userData.email);
        console.log('  - fullName:', userData.fullName);

        sessionStorage.setItem('pendingVerification', JSON.stringify({
          userId: userData.userId,
          email: userData.email,
          fullName: userData.fullName,
          fromInvitation: true
        }));

        console.log('🔐 [AcceptInvite] Stored in sessionStorage, navigating to OTP verification');

        // Navigate to OTP verification
        navigate(`/verify-otp?email=${encodeURIComponent(userData.email)}`);
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 
        'An error occurred during registration. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading invitation details...</p>
        </div>
      </Container>
    );
  }

  if (error && !invitation) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Card style={{ maxWidth: '500px', width: '100%' }}>
          <Card.Body className="text-center">
            <div className="mb-4">
              <i className="bi bi-x-circle text-danger" style={{ fontSize: '4rem' }}></i>
            </div>
            <h3 className="mb-3">Invalid Invitation</h3>
            <Alert variant="danger">{error}</Alert>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="mb-2">Accept Invitation</h2>
                <p className="text-muted">Complete your registration to join the team</p>
              </div>

              {invitation && (
                <Alert variant="info" className="mb-4">
                  <strong>Company:</strong> {invitation.companyName}<br />
                  <strong>Role:</strong> {invitation.roleName}<br />
                  <strong>Email:</strong> {invitation.email}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Full Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    disabled={submitting}
                    isInvalid={errorField === 'fullName'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errorField === 'fullName' && error}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Username <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    minLength={3}
                    required
                    disabled={submitting}
                    isInvalid={errorField === 'username'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errorField === 'username' && error}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Minimum 3 characters
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Password <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Lock size={18} />
                    </span>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Example: MyPass123!"
                      minLength={8}
                      required
                      disabled={submitting}
                      isInvalid={errorField === 'password'}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={submitting}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                  {errorField === 'password' && (
                    <div className="invalid-feedback d-block">
                      {error}
                    </div>
                  )}
                  {passwordStrength && (
                    <div className="mt-2">
                      <small className={`text-${getPasswordStrengthColor()}`}>
                        Password strength: {passwordStrength.toUpperCase()}
                      </small>
                    </div>
                  )}
                  <Form.Text className="text-info">
                    Min 8 characters with uppercase, lowercase, number & special character (@$!%*?&_)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    Confirm Password <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Lock size={18} />
                    </span>
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                      disabled={submitting}
                      isInvalid={errorField === 'confirmPassword' || (formData.confirmPassword.length > 0 && !passwordMatch)}
                      isValid={formData.confirmPassword.length > 0 && passwordMatch && errorField !== 'confirmPassword'}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={submitting}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                  {errorField === 'confirmPassword' && (
                    <div className="invalid-feedback d-block">
                      {error}
                    </div>
                  )}
                  {!passwordMatch && formData.confirmPassword.length > 0 && errorField !== 'confirmPassword' && (
                    <div className="invalid-feedback d-block">
                      Passwords do not match
                    </div>
                  )}
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100"
                  disabled={submitting || !passwordMatch}
                >
                  {submitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Creating Account...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted mb-0">
                  Already have an account?{' '}
                  <a href="/login" className="text-decoration-none">
                    Login here
                  </a>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AcceptInvite;






