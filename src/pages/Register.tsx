import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ProgressBar,
  Badge
} from "react-bootstrap";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Mail,
  Building,
  User,
  Eye,
  EyeOff
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
  const [errorField, setErrorField] = useState<string>(''); // Track which field has error
  const [passwordFocused, setPasswordFocused] = useState(false); // Track password field focus
  const [showPassword, setShowPassword] = useState(false); // Track password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Track confirm password visibility
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
    // Clear error when user starts typing in the error field
    if (errorField === name) {
      setError('');
      setErrorField('');
    }
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
      setErrorField('companyName');
      return false;
    }
    if (!formData.industry.trim()) {
      setError('Industry is required');
      setErrorField('industry');
      return false;
    }
    if (!formData.size) {
      setError('Company size is required');
      setErrorField('size');
      return false;
    }
    
    // Phone validation (optional field, but must be valid if provided)
    if (formData.phone.trim()) {
      // Remove spaces, hyphens, and parentheses for validation
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
      
      // Check if it matches Indian mobile format: +91 followed by 10 digits OR just 10 digits
      const indianMobileRegex = /^(\+91)?[6-9]\d{9}$/;
      
      if (!indianMobileRegex.test(cleanPhone)) {
        setError('Please enter a valid 10-digit Indian mobile number (starting with 6-9). You can optionally include +91 prefix.');
        setErrorField('phone');
        return false;
      }
    }
    
    return true;
  };

  const validateStep2 = () => {
    // User details validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      setErrorField('fullName');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      setErrorField('email');
      return false;
    }
    if (!isLikelyRealEmail(formData.email)) {
      setError('Please enter a valid, deliverable email address');
      setErrorField('email');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      setErrorField('username');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      setErrorField('username');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      setErrorField('password');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setErrorField('password');
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
      setError('Password must contain uppercase, lowercase, number, and special character (@, $, !, %, *, ?, &, _)');
      setErrorField('password');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setErrorField('confirmPassword');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    setErrorField('');
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      handleRegister();
    }
  };

  const handleBack = () => {
    setError('');
    setErrorField('');
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');

    try {
      const payload: any = {
        companyName: formData.companyName,
        industry: formData.industry,
        size: formData.size,
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      };

      // Only include optional fields if they have values
      if (formData.website.trim()) {
        payload.website = formData.website;
      }
      if (formData.phone.trim()) {
        payload.phone = formData.phone;
      }

      const response = await registerUser(payload);

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
              isInvalid={errorField === 'companyName'}
            />
            <Form.Control.Feedback type="invalid">
              {errorField === 'companyName' && error}
            </Form.Control.Feedback>
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
              isInvalid={errorField === 'industry'}
            />
            <Form.Control.Feedback type="invalid">
              {errorField === 'industry' && error}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Company Size *</Form.Label>
            <Form.Select
              name="size"
              value={formData.size}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, size: e.target.value }));
                if (errorField === 'size') {
                  setError('');
                  setErrorField('');
                }
              }}
              required
              isInvalid={errorField === 'size'}
            >
              <option value="">Select company size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-1000">201-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errorField === 'size' && error}
            </Form.Control.Feedback>
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
              placeholder="10-digit mobile number"
              isInvalid={errorField === 'phone'}
            />
            <Form.Control.Feedback type="invalid">
              {errorField === 'phone' && error}
            </Form.Control.Feedback>
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
              isInvalid={errorField === 'fullName'}
            />
            <Form.Control.Feedback type="invalid">
              {errorField === 'fullName' && error}
            </Form.Control.Feedback>
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
              isInvalid={errorField === 'email'}
            />
            <Form.Control.Feedback type="invalid">
              {errorField === 'email' && error}
            </Form.Control.Feedback>
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
              isInvalid={errorField === 'username'}
            />
            <Form.Control.Feedback type="invalid">
              {errorField === 'username' && error}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password *</Form.Label>
            <div className="input-group">
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Example: MyPass123!"
                required
                isInvalid={errorField === 'password'}
              />
              <Button
                variant="outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
            <Form.Control.Feedback type="invalid" className={errorField === 'password' ? 'd-block' : ''}>
              {errorField === 'password' && error}
            </Form.Control.Feedback>
            {(passwordFocused || formData.password) && (
              <Form.Text className="text-info">
                Min 8 characters with uppercase, lowercase, number & special character (@$!%*?&_)
              </Form.Text>
            )}
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
            <div className="input-group">
              <Form.Control
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm password"
                required
                isInvalid={errorField === 'confirmPassword'}
              />
              <Button
                variant="outline-secondary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
            <Form.Control.Feedback type="invalid" className={errorField === 'confirmPassword' ? 'd-block' : ''}>
              {errorField === 'confirmPassword' && error}
            </Form.Control.Feedback>
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
      case 1: return 0;
      case 2: return 50;
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
                <p className="text-muted">Join Leadbox today</p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Step {currentStep} of 2</span>
                  <Badge bg="primary">{Math.round(getProgressValue())}% Complete</Badge>
                </div>
                <ProgressBar now={getProgressValue()} className="mb-3" />
              </div>

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
