import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  ProgressBar,
  Badge
} from "react-bootstrap";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Mail,
  Building,
  User
} from "lucide-react";
import { useToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import { registerUser, verifyOtp, resendOtp } from "../services/authService";

interface RegisterFormData {
  // Company Details
  companyName: string;
  industry: string;
  size: string;
  website: string;
  phone: string;

  // User Details
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const disposableDomains = [
  "example.com",
  "test.com",
  "mailinator.com",
  "tempmail.com",
  "fake.com",
  "invalid.com",
  "testmail.com"
];

const isLikelyRealEmail = (email: string) => {
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !disposableDomains.includes(domain);
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const { showSuccess, showError } = useToast();
  const { login } = useAuth();
  const [isResending, setIsResending] = useState(false);

  const [formData, setFormData] = useState<RegisterFormData>({
    companyName: '',
    industry: '',
    size: '',
    website: '',
    phone: '',
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[a-z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    const label =
      score >= 80 ? "Strong" :
      score >= 60 ? "Good" :
      score >= 40 ? "Fair" : "Weak";
    return { score, label };
  };

  const validateStep1 = () => {
    // Company details validation
    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.industry.trim()) {
      setError('Industry is required');
      return false;
    }
    if (!formData.size) {
      setError('Company size is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    // User details validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!isLikelyRealEmail(formData.email)) {
      setError('Please enter a valid, deliverable email address');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      handleRegister();
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await registerUser({
        companyName: formData.companyName,
        industry: formData.industry,
        size: formData.size,
        website: formData.website,
        phone: formData.phone,
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.data.success) {
        // Store email for OTP verification page
        localStorage.setItem('verificationEmail', formData.email);
        showSuccess('Registration Successful', 'Redirecting to email verification...');
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      showError('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const renderStep1 = () => (
    <div>
      <div className="text-center mb-4">
        <Building size={48} className="text-primary mb-3" />
        <h3>Company Details</h3>
        <p className="text-muted">Tell us about your company</p>
      </div>

      <Row className="justify-content-center">
        <Col md={10}>
          <Form.Group className="mb-3">
            <Form.Label>Company Name *</Form.Label>
            <Form.Control
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Enter company name"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Industry *</Form.Label>
            <Form.Control
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              placeholder="e.g., Technology, Healthcare, Finance"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Company Size *</Form.Label>
            <Form.Select
              name="size"
              value={formData.size}
              onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
              required
            >
              <option value="">Select company size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-1000">201-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Website</Form.Label>
            <Form.Control
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://www.yourcompany.com"
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1 (555) 123-4567"
            />
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button
              onClick={handleNext}
              className="btn-primary"
              disabled={isLoading}
            >
              Next: Personal Details <ArrowRight size={18} className="ms-2" />
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className="text-center mb-4">
        <User size={48} className="text-primary mb-3" />
        <h3>User Details</h3>
        <p className="text-muted">Create your account credentials</p>
      </div>

      <Row className="justify-content-center">
        <Col md={10}>
          <Form.Group className="mb-3">
            <Form.Label>Full Name *</Form.Label>
            <Form.Control
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email Address *</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
            <Form.Text className="text-muted">
              We'll send a verification code to this email
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Username *</Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Choose a username (min 3 characters)"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password *</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              required
            />
            <Form.Text className="text-muted">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </Form.Text>
            {formData.password && (
              <div className="mt-2">
                <ProgressBar
                  now={getPasswordStrength(formData.password).score}
                  variant={
                    getPasswordStrength(formData.password).score >= 80
                      ? "success"
                      : getPasswordStrength(formData.password).score >= 60
                        ? "info"
                        : getPasswordStrength(formData.password).score >= 40
                          ? "warning"
                          : "danger"
                  }
                />
                <small className="text-muted">
                  Strength: {getPasswordStrength(formData.password).label}
                </small>
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Confirm Password *</Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm password"
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-between">
            <Button
              variant="outline-secondary"
              onClick={handleBack}
              disabled={isLoading}
            >
              <ArrowLeft size={18} className="me-2" /> Back
            </Button>

            <Button
              onClick={handleNext}
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );


  const getProgressValue = () => {
    switch (currentStep) {
      case 1: return 50;
      case 2: return 100;
      default: return 0;
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          <Card className="shadow-lg">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="text-primary mb-2">Create Your Account</h2>
                <p className="text-muted">Join Lead Management CRM today</p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Step {currentStep} of 2</span>
                  <Badge bg="primary">{Math.round(getProgressValue())}% Complete</Badge>
                </div>
                <ProgressBar now={getProgressValue()} className="mb-3" />
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              {/* Step Content */}
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}

              {/* Already have an account link */}
              <div className="text-center mt-4 pt-3 border-top">
                <span className="text-muted">Already have an account? </span>
                <Button
                  variant="link"
                  className="p-0 text-primary"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
