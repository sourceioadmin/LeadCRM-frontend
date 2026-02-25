import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner
} from "react-bootstrap";
import { Mail, ArrowLeft } from "lucide-react";
import { useToast } from "../components/Toast";
import { forgotPassword } from "../services/authService";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (validationErrors.email) {
      setValidationErrors((prev) => ({ ...prev, email: "" }));
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
      showSuccess(
        "Check your email",
        "If an account exists for this email, you will receive a password reset link."
      );
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosErr.response?.data?.message || "Something went wrong. Please try again.";
      setError(errorMessage);
      showError("Request failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <Mail size={48} className="text-primary mb-3" />
                <h2 className="text-primary mb-2">Forgot password?</h2>
                <p className="text-muted">
                  Enter your email and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              {submitted ? (
                <Alert variant="success" className="mb-4">
                  If an account exists for this email, you will receive a password reset link
                  shortly. Redirecting to login...
                </Alert>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Email</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Mail size={18} />
                      </span>
                      <Form.Control
                        type="email"
                        name="email"
                        value={email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        isInvalid={!!validationErrors.email}
                        disabled={isLoading}
                      />
                    </div>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 btn-primary mb-3"
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Sending...
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>
                </Form>
              )}

              <div className="text-center mt-4 pt-3 border-top">
                <Link
                  to="/login"
                  className="text-muted text-decoration-none d-inline-flex align-items-center"
                >
                  <ArrowLeft size={16} className="me-2" />
                  Back to login
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword;
