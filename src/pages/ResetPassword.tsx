import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { resetPassword } from "../services/authService";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Send token exactly as in the URL (router already decodes query string). Backend NormalizeToken() trims and URL-decodes before lookup.
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    setTokenChecked(true);
  }, []);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "newPassword") setNewPassword(value);
    else setConfirmPassword(value);
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; error?: string; errors?: string[] } };
      };
      const data = axiosErr.response?.data;
      const errorMessage =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors) ? data.errors.join(" ") : undefined) ||
        "Failed to reset password. The link may have expired.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenChecked) {
    return null;
  }

  if (!token || !token.trim()) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <Lock size={48} className="text-primary mb-3" />
                  <h2 className="text-primary mb-2">Invalid reset link</h2>
                  <p className="text-muted">
                    This password reset link is invalid or has expired. Please request a new one.
                  </p>
                </div>
                <Alert variant="warning" className="mb-4">
                  No reset token was provided. Use the link from your email or request a new
                  password reset.
                </Alert>
                <div className="d-flex flex-column gap-2">
                  <Link
                    to="/forgot-password"
                    className="btn btn-primary text-decoration-none text-center"
                  >
                    Request new reset link
                  </Link>
                  <Link
                    to="/login"
                    className="text-muted text-decoration-none d-inline-flex align-items-center justify-content-center"
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
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <Lock size={48} className="text-primary mb-3" />
                <h2 className="text-primary mb-2">Reset your password</h2>
                <p className="text-muted">Enter your new password below.</p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">New password</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Lock size={18} />
                    </span>
                    <Form.Control
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                      isInvalid={!!validationErrors.newPassword}
                      disabled={isLoading}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.newPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Confirm password</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Lock size={18} />
                    </span>
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                      isInvalid={!!validationErrors.confirmPassword}
                      disabled={isLoading}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.confirmPassword}
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
                      Resetting...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </Form>

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

export default ResetPassword;
