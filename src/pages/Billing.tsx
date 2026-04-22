import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Row, Col, Card, Button, Badge, Spinner, Alert,
  Table, Modal, ProgressBar
} from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { CreditCard, RefreshCw, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  getPlans,
  getSubscription,
  createSubscription,
  cancelSubscription,
  getPaymentHistory,
} from '../services/billingService';
import type { SubscriptionPlan, SubscriptionStatus, PaymentHistoryEntry } from '../types/Billing';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

// Razorpay types (loaded via CDN script)
declare global {
  interface Window {
    Razorpay: any;
  }
}

const formatPrice = (paise: number): string => {
  if (paise === 0) return 'Free';
  return `₹${(paise / 100).toLocaleString('en-IN')}/mo`;
};

const formatAmount = (paise: number, currency: string): string => {
  return `${currency} ${(paise / 100).toFixed(2)}`;
};

const statusBadgeVariant = (status: string): string => {
  switch (status) {
    case 'active': return 'success';
    case 'created': return 'info';
    case 'halted': return 'warning';
    case 'cancelled':
    case 'completed': return 'secondary';
    case 'pending': return 'warning';
    default: return 'secondary';
  }
};

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Billing: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const location = useLocation();
  const preselectedPlanId: number | undefined = (location.state as any)?.planId;

  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [history, setHistory] = useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [sub, plansData, hist] = await Promise.all([
        getSubscription(),
        getPlans(),
        getPaymentHistory(),
      ]);
      setSubscription(sub);
      setPlans(plansData);
      setHistory(hist);
    } catch {
      setError('Failed to load billing information. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-trigger subscribe if user came from pricing page
  useEffect(() => {
    if (preselectedPlanId && plans.length > 0 && subscription) {
      const plan = plans.find(p => p.planId === preselectedPlanId);
      if (plan && plan.priceInPaise > 0) {
        handleSubscribe(plan);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedPlanId, plans.length, subscription !== null]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!plan.razorpayPlanId) {
      showWarning('Plan Unavailable', 'This plan is not yet available for payment. Please contact support.');
      return;
    }

    setSubscribing(plan.planId);
    setError('');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showError('Payment Gateway Error', 'Could not load payment gateway. Please check your connection.');
        return;
      }

      const data = await createSubscription(plan.planId);

      const options = {
        key: data.razorpayKeyId,
        subscription_id: data.razorpaySubscriptionId,
        name: 'LeadBox CRM',
        description: `${plan.name} Plan — ${formatPrice(plan.priceInPaise)}`,
        prefill: {
          name: user?.fullName ?? '',
          email: user?.email ?? '',
          contact: user?.phoneNumber ?? '',
        },
        theme: { color: '#0d6efd' },
        handler: () => {
          showSuccess('Payment Successful', 'Your plan will be activated shortly.');
          // Poll for subscription update — webhook may take a few seconds
          setTimeout(() => fetchData(), 3000);
        },
        modal: {
          ondismiss: () => {
            showWarning('Payment Cancelled', 'You closed the payment window.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to initiate payment. Please try again.';
      showError('Payment Error', msg);
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelSubscription();
      showSuccess('Subscription Cancelled', 'Your subscription has been cancelled and your account has reverted to the Free plan.');
      setShowCancelModal(false);
      await fetchData();
    } catch {
      showError('Cancellation Failed', 'Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <Spinner animation="border" />
      </div>
    );
  }

  const currentPlan = plans.find(p => p.planId === subscription?.planId);
  const isActivePaid = subscription && subscription.status === 'active' && subscription.planId !== 1;
  const upgradePlans = plans.filter(p => p.priceInPaise > 0 && p.planId !== subscription?.planId);

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center gap-2 mb-4">
        <CreditCard size={24} />
        <h4 className="mb-0 fw-bold">Billing & Subscription</h4>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Current Plan Card */}
      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <h6 className="text-muted text-uppercase small mb-3">Current Plan</h6>
              <div className="d-flex align-items-center gap-3 mb-3">
                <h3 className="fw-bold mb-0">{subscription?.planName ?? 'Free'}</h3>
                <Badge bg={statusBadgeVariant(subscription?.status ?? 'active')} className="text-capitalize">
                  {subscription?.status ?? 'active'}
                </Badge>
              </div>

              {subscription?.status === 'halted' && (
                <Alert variant="warning" className="d-flex align-items-center gap-2 py-2">
                  <AlertTriangle size={16} />
                  <span className="small">Payment failed. Please update your payment method.</span>
                </Alert>
              )}

              {subscription?.currentPeriodEnd && (
                <p className="text-muted small mb-3">
                  Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              )}

              {isActivePaid && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                >
                  <XCircle size={14} className="me-1" />
                  Cancel Subscription
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <h6 className="text-muted text-uppercase small mb-3">Usage</h6>
              <div className="mb-3">
                <div className="d-flex justify-content-between small mb-1">
                  <span>Leads</span>
                  <span className="text-muted">
                    {subscription?.maxLeads === 2147483647 ? 'Unlimited' : `up to ${subscription?.maxLeads?.toLocaleString()}`}
                  </span>
                </div>
                {subscription?.maxLeads !== 2147483647 && (
                  <ProgressBar now={0} variant="primary" style={{ height: 6 }} />
                )}
              </div>
              <div>
                <div className="d-flex justify-content-between small mb-1">
                  <span>Users</span>
                  <span className="text-muted">
                    {subscription?.maxUsers === 2147483647 ? 'Unlimited' : `up to ${subscription?.maxUsers}`}
                  </span>
                </div>
                {subscription?.maxUsers !== 2147483647 && (
                  <ProgressBar now={0} variant="info" style={{ height: 6 }} />
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Upgrade Plans */}
      {upgradePlans.length > 0 && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <h6 className="fw-semibold mb-3">
              {isActivePaid ? 'Switch Plan' : 'Upgrade Your Plan'}
            </h6>
            <Row className="g-3">
              {upgradePlans.map((plan) => (
                <Col key={plan.planId} xs={12} sm={6} lg={3}>
                  <Card className="border h-100">
                    <Card.Body className="p-3 d-flex flex-column">
                      <div className="fw-semibold mb-1">{plan.name}</div>
                      <div className="fs-5 fw-bold text-primary mb-1">{formatPrice(plan.priceInPaise)}</div>
                      <div className="text-muted small mb-3">
                        {plan.maxLeads === 2147483647 ? 'Unlimited' : plan.maxLeads.toLocaleString()} leads ·{' '}
                        {plan.maxUsers === 2147483647 ? 'Unlimited' : plan.maxUsers} users
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-auto"
                        disabled={subscribing === plan.planId || !plan.razorpayPlanId}
                        onClick={() => handleSubscribe(plan)}
                      >
                        {subscribing === plan.planId ? (
                          <><Spinner size="sm" className="me-1" />Processing...</>
                        ) : plan.razorpayPlanId ? (
                          'Subscribe'
                        ) : (
                          'Coming Soon'
                        )}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Payment History */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-semibold mb-0">Payment History</h6>
            <Button variant="link" size="sm" className="p-0 text-muted" onClick={fetchData}>
              <RefreshCw size={14} />
            </Button>
          </div>

          {history.length === 0 ? (
            <p className="text-muted small mb-0">No payment records yet.</p>
          ) : (
            <Table responsive hover size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.razorpayPaymentId}>
                    <td>
                      <code className="small">{entry.razorpayPaymentId}</code>
                    </td>
                    <td>{formatAmount(entry.amountInPaise, entry.currency)}</td>
                    <td>
                      <Badge bg={entry.status === 'captured' ? 'success' : 'secondary'} className="text-capitalize">
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="text-muted small">
                      {new Date(entry.paidAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Cancel Confirmation Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6">Cancel Subscription</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-start gap-3">
            <XCircle size={24} className="text-danger flex-shrink-0 mt-1" />
            <div>
              <p className="mb-2">Are you sure you want to cancel your <strong>{subscription?.planName}</strong> subscription?</p>
              <p className="text-muted small mb-0">
                Your subscription will be cancelled immediately and your account will revert to the Free plan.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowCancelModal(false)}>
            Keep Subscription
          </Button>
          <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? <><Spinner size="sm" className="me-1" />Cancelling...</> : 'Yes, Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Billing;
