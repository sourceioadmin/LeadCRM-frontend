import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Form
} from "react-bootstrap";
import { Mail, ArrowLeft } from "lucide-react";
import { useToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import { verifyOtp, resendOtp } from "../services/authService";

const VerifyOtp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { login } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailFromParams = searchParams.get('email');
    const emailFromStorage = localStorage.getItem('verificationEmail');

    if (emailFromParams) {
      setEmail(emailFromParams);
      localStorage.setItem('verificationEmail', emailFromParams);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    } else {
      // No email found, redirect to register
      navigate('/register');
      return;
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp.join('');
    if (codeToVerify.length !== 6) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await verifyOtp({
        email,
        otp: codeToVerify
      });

      if (response.data.success) {
        const token = response.data.data?.token;
        const user = response.data.data?.user;

        if (token && user) {
          // Store token and update auth context
          localStorage.setItem('authToken', token);
          localStorage.setItem('userData', JSON.stringify(user));
          localStorage.removeItem('verificationEmail'); // Clean up
          login(token, user);

          showSuccess('Email Verified!', 'Welcome to Lead Management CRM!');
          // Navigate after a longer delay to ensure success message is visible and prevent any error toasts from interrupting
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2500);
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'OTP verification failed.';
      setError(errorMessage);
      showError('Verification Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || !email) return;

    setIsResending(true);
    setError('');

    try {
      const response = await resendOtp(email);
      if (response.data.success) {
        setCountdown(60); // Start 60 second countdown
        showSuccess('OTP Sent', 'A new verification code has been sent to your email.');
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to resend OTP.';
      setError(errorMessage);
      showError('Resend Failed', errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToRegister = () => {
    localStorage.removeItem('verificationEmail');
    navigate('/register');
  };

  if (!email) {
    return null; // Loading state while redirecting
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={6} xl={5}>
          <Card className="shadow-lg">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <Mail size={48} className="text-primary mb-3" />
                <h2 className="text-primary mb-2">Verify Your Email</h2>
                <p className="text-muted">
                  We've sent a 6-digit verification code to
                </p>
                <p className="fw-bold text-primary">{email}</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              {/* OTP Input */}
              <Form.Group className="mb-4">
                <Form.Label className="text-center d-block mb-3">
                  Enter Verification Code
                </Form.Label>
                <div className="d-flex justify-content-center gap-2 mb-3">
                  {otp.map((digit, index) => (
                    <Form.Control
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="text-center"
                      style={{
                        width: '3rem',
                        height: '3rem',
                        fontSize: '1.25rem',
                        fontWeight: 'bold'
                      }}
                      maxLength={1}
                      disabled={isLoading}
                    />
                  ))}
                </div>
                <Form.Text className="text-muted text-center d-block">
                  Enter the 6-digit code sent to your email
                </Form.Text>
              </Form.Group>

              {/* Verify Button */}
              <div className="text-center mb-3">
                <Button
                  onClick={() => handleVerifyOtp()}
                  className="btn-primary px-5"
                  disabled={isLoading || otp.some(digit => digit === '')}
                  size="lg"
                >
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </Button>
              </div>

              {/* Resend OTP */}
              <div className="text-center">
                <Button
                  variant="link"
                  className="text-muted p-0"
                  onClick={handleResendOtp}
                  disabled={isResending || countdown > 0}
                >
                  {countdown > 0
                    ? `Resend OTP in ${countdown}s`
                    : isResending
                      ? 'Resending...'
                      : "Didn't receive the code? Resend"
                  }
                </Button>
              </div>

              {/* Back to Register */}
              <div className="text-center mt-4 pt-3 border-top">
                <Button
                  variant="link"
                  className="text-muted p-0"
                  onClick={handleBackToRegister}
                >
                  <ArrowLeft size={16} className="me-2" />
                  Back to Registration
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VerifyOtp;
