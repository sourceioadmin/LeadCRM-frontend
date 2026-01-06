import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { BarChart3, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Reports: React.FC = () => {
  return (
    <Container fluid>
      <Row>
        <Col>
          <h2 className="mb-4">Reports & Analytics</h2>

          <Row className="g-4">
            {/* Conversion Report Card */}
            <Col md={6} lg={4}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <Target size={32} className="text-primary me-3" />
                    <div>
                      <h5 className="mb-1">Conversion Report</h5>
                      <small className="text-muted">Lead conversion funnel and analytics</small>
                    </div>
                  </div>
                  <p className="text-muted flex-grow-1">
                    Analyze lead conversion rates through each stage of your sales funnel.
                    Track performance metrics and identify bottlenecks in your conversion process.
                  </p>
                  <Link to="/reports/conversion" className="btn btn-primary">
                    <Target className="me-2" size={16} />
                    View Conversion Report
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            {/* Win vs Loss Report Card */}
            <Col md={6} lg={4}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <BarChart3 size={32} className="text-success me-3" />
                    <div>
                      <h5 className="mb-1">Win vs Loss Report</h5>
                      <small className="text-muted">Analyze successful and lost deals</small>
                    </div>
                  </div>
                  <p className="text-muted flex-grow-1">
                    Compare won and lost opportunities across different lead sources and urgency levels.
                    Identify patterns and improve your conversion strategies.
                  </p>
                  <Link to="/reports/win-loss" className="btn btn-success">
                    <BarChart3 className="me-2" size={16} />
                    View Win/Loss Report
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            {/* Additional Analytics Card */}
            <Col md={6} lg={4}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <TrendingUp size={32} className="text-info me-3" />
                    <div>
                      <h5 className="mb-1">Additional Analytics</h5>
                      <small className="text-muted">Lead distribution & team performance</small>
                    </div>
                  </div>
                  <p className="text-muted flex-grow-1">
                    Comprehensive lead distribution analytics by source, status, and urgency levels.
                    Track team member performance, conversion rates, and assignment metrics.
                  </p>
                  <Link to="/reports/additional" className="btn btn-info">
                    <TrendingUp className="me-2" size={16} />
                    View Analytics
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Reports;