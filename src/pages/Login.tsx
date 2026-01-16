import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Button, Alert, Container, Row, Col, Spinner } from 'react-bootstrap';
import { useGoogleLogin } from '@react-oauth/google';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { loginUser, googleLogin } from '../services/authService';
import { LoginPayload, GoogleLoginPayload } from '../services/authService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState<LoginPayload>({
    emailOrUsername: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.emailOrUsername.trim()) {
      errors.emailOrUsername = 'Email or Username is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      console.log('❌ [Login] Form validation failed');
      return;
    }

    console.log('✅ [Login] Form validation passed, submitting login request');
    setIsLoading(true);

    try {
      console.log('📤 [Login] Sending login request with data:', {
        emailOrUsername: formData.emailOrUsername,
        passwordLength: formData.password?.length,
        rememberMe: formData.rememberMe
      });
      const response = await loginUser(formData);
      console.log('📥 [Login] Received response:', response.data);

      if (response.data.success) {
        const token = response.data.data?.token;
        const user = response.data.data?.user;

        if (token && user) {
          // Store token and update auth context
          login(token, user);

          showSuccess('Welcome Back!', `Hello ${user.fullName}!`);
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } else {
          throw new Error('Invalid response from server');
        }
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('❌ [Login] Login failed:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });

      // Check if email verification is required
      const requiresVerification = err.response?.data?.data?.requiresVerification;
      const email = err.response?.data?.data?.email;

      if (requiresVerification && email) {
        console.log('🔐 [Login] Email verification required, redirecting to OTP verification');
        // Store email for verification page and redirect
        localStorage.setItem('verificationEmail', email);
        showError('Email Verification Required', 'Please verify your email address before logging in.');
        setTimeout(() => {
          navigate('/verify-otp');
        }, 1500);
        return;
      }

      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      showError('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setError('');

      try {
        const payload: GoogleLoginPayload = {
          token: tokenResponse.access_token
        };

        const response = await googleLogin(payload);

        if (response.data.success) {
          const token = response.data.data?.token;
          const user = response.data.data?.user;

          if (token && user) {
            // Store token and update auth context
            login(token, user);

            showSuccess('Welcome!', `Hello ${user.fullName}!`);
            setTimeout(() => {
              navigate('/');
            }, 1500);
          } else {
            throw new Error('Invalid response from server');
          }
        } else {
          throw new Error(response.data.message || 'Google login failed');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Google login failed. Please try again.';
        setError(errorMessage);
        showError('Google Login Failed', errorMessage);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      setError('Google login failed. Please try again.');
      showError('Google Login Failed', 'Failed to authenticate with Google');
      setIsGoogleLoading(false);
    }
  });

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <LogIn size={48} className="text-primary mb-3" />
                <h2 className="text-primary mb-2">Welcome Back</h2>
                <p className="text-muted">Sign in to your Leadbox account</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Email or Username</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Mail size={18} />
                    </span>
                    <Form.Control
                      type="text"
                      name="emailOrUsername"
                      value={formData.emailOrUsername}
                      onChange={handleInputChange}
                      placeholder="Enter your email or username"
                      isInvalid={!!validationErrors.emailOrUsername}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.emailOrUsername}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Password</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Lock size={18} />
                    </span>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      isInvalid={!!validationErrors.password}
                      disabled={isLoading || isGoogleLoading}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || isGoogleLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    name="rememberMe"
                    label="Remember me for 7 days"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    disabled={isLoading || isGoogleLoading}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100 btn-primary mb-3"
                  disabled={isLoading || isGoogleLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Form>

              {/* Links */}
              <div className="text-center mb-4">
                <Button variant="link" className="text-muted p-0 me-3">
                  Forgot password?
                </Button>
                <span className="text-muted">|</span>
                <Link to="/register" className="text-primary ms-3 text-decoration-none">
                  Create Account
                </Link>
              </div>

              {/* Google Login - Hidden */}
              {false && (
              <>
              {/* Divider */}
              <div className="position-relative mb-4">
                <hr className="my-4" />
                <div className="position-absolute top-50 start-50 translate-middle bg-white px-3">
                  <span className="text-muted small">Or continue with</span>
                </div>
              </div>

              {/* Google Login */}
              <Button
                variant="outline-secondary"
                className="w-100 d-flex align-items-center justify-content-center"
                onClick={() => handleGoogleLogin()}
                disabled={isLoading || isGoogleLoading}
                size="lg"
              >
                {isGoogleLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-3" />
                    Signing in with Google...
                  </>
                ) : (
                  <>
                    <img
                      src="/google-icon.svg"
                      alt="Google"
                      style={{ width: '18px', height: '18px', marginRight: '12px' }}
                    />
                    Sign in with Google
                  </>
                )}
              </Button>
              </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
