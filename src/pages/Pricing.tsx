import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { getPlans } from '../services/billingService';
import type { SubscriptionPlan } from '../types/Billing';
import { useAuth } from '../contexts/AuthContext';

const PLAN_FEATURES: Record<string, string[]> = {
  Free: [
    'Up to 50 leads',
    'Up to 2 users',
    'Lead management',
    'Basic dashboard',
  ],
  Starter: [
    'Up to 500 leads',
    'Up to 5 users',
    'Lead management',
    'Reports & analytics',
    'Bulk lead import',
    'Email notifications',
  ],
  Pro: [
    'Up to 5,000 leads',
    'Up to 15 users',
    'Everything in Starter',
    'WhatsApp notifications',
    'Push notifications',
    'Priority support',
  ],
  Enterprise: [
    'Unlimited leads',
    'Unlimited users',
    'Everything in Pro',
    'Dedicated support',
    'Custom integrations',
    'SLA guarantee',
  ],
};

const formatPrice = (paise: number): string => {
  if (paise === 0) return 'Free';
  return `₹${(paise / 100).toLocaleString('en-IN')}/mo`;
};

const Pricing: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setError('Failed to load pricing plans. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (plan.priceInPaise === 0) {
      navigate(user ? '/' : '/register');
      return;
    }
    if (!user) {
      navigate('/login', { state: { from: '/billing', planId: plan.planId } });
      return;
    }
    navigate('/billing', { state: { planId: plan.planId } });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingTop: '60px', paddingBottom: '60px' }}>
      <Container>
        <div className="text-center mb-5">
          <h1 className="fw-bold">Simple, transparent pricing</h1>
          <p className="text-muted fs-5">Choose the plan that fits your team. Upgrade or cancel anytime.</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="justify-content-center g-4">
          {plans.map((plan) => {
            const isPro = plan.name === 'Pro';
            const features = PLAN_FEATURES[plan.name] ?? [];

            return (
              <Col key={plan.planId} xs={12} sm={6} lg={3}>
                <Card
                  className={`h-100 shadow-sm ${isPro ? 'border-primary' : 'border-0'}`}
                  style={{ borderWidth: isPro ? 2 : 1 }}
                >
                  {isPro && (
                    <div className="text-center pt-2">
                      <Badge bg="primary" className="px-3 py-1">Most Popular</Badge>
                    </div>
                  )}
                  <Card.Body className="d-flex flex-column p-4">
                    <h5 className="fw-bold mb-1">{plan.name}</h5>
                    <div className="mb-3">
                      <span className="fs-2 fw-bold">{formatPrice(plan.priceInPaise)}</span>
                    </div>

                    <ul className="list-unstyled flex-grow-1 mb-4">
                      {features.map((feat) => (
                        <li key={feat} className="d-flex align-items-start gap-2 mb-2">
                          <Check size={16} className="text-success mt-1 flex-shrink-0" />
                          <span className="text-muted small">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={isPro ? 'primary' : 'outline-primary'}
                      className="w-100"
                      onClick={() => handleSubscribe(plan)}
                    >
                      {plan.priceInPaise === 0 ? 'Get Started Free' : 'Subscribe'}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        <div className="text-center mt-5 text-muted small">
          <p>All paid plans include a 7-day free trial. No credit card required for the Free plan.</p>
          <p>Prices are in Indian Rupees (INR) and billed monthly.</p>
        </div>
      </Container>
    </div>
  );
};

export default Pricing;
