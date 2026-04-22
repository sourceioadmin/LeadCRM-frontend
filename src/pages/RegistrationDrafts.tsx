import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Badge,
  Alert, Form, Button, Spinner
} from 'react-bootstrap';
import { ClipboardList, RefreshCw, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRegistrationDrafts } from '../services/authService';
import { formatDateTime } from '../utils/dateUtils';

interface RegistrationDraft {
  draftId: number;
  sessionId: string;
  companyName: string | null;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  status: 'Pending' | 'Converted' | 'Expired';
  createdAt: string;
  updatedAt: string;
}

const STATUS_VARIANTS: Record<string, string> = {
  Pending: 'warning',
  Converted: 'success',
  Expired: 'secondary',
};

const RegistrationDrafts: React.FC = () => {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<RegistrationDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('Pending');

  if (user?.roleName !== 'System Admin') {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <h4>Access Denied</h4>
          <p>Only System Administrators can view registration drafts.</p>
        </Alert>
      </Container>
    );
  }

  useEffect(() => {
    loadDrafts();
  }, [statusFilter]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRegistrationDrafts(statusFilter || undefined);
      if (response.data.success) {
        setDrafts(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load drafts');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (drafts.length === 0) return;

    const headers = ['Company Name', 'Full Name', 'Email', 'Phone', 'Status', 'Captured At', 'Last Updated'];
    const rows = drafts.map(d => [
      d.companyName || '',
      d.fullName || '',
      d.email || '',
      d.phoneNumber || '',
      d.status,
      formatDateTime(d.createdAt),
      formatDateTime(d.updatedAt),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registration-drafts-${statusFilter.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filledFieldCount = (draft: RegistrationDraft) =>
    [draft.companyName, draft.fullName, draft.email, draft.phoneNumber].filter(Boolean).length;

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-2">
            <ClipboardList size={28} className="text-primary" />
            <div>
              <h3 className="mb-0">Registration Drafts</h3>
              <p className="text-muted mb-0 small">
                Visitors who started but did not complete registration
              </p>
            </div>
          </div>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Body>
          {/* Toolbar */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <Form.Label className="mb-0 text-nowrap fw-semibold">Status:</Form.Label>
              <Form.Select
                size="sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: 150 }}
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Converted">Converted</option>
                <option value="Expired">Expired</option>
              </Form.Select>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={loadDrafts}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw size={15} className={loading ? 'spin' : ''} />
              </Button>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">{drafts.length} record(s)</span>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleExportCSV}
                disabled={drafts.length === 0}
              >
                <Download size={15} className="me-1" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && <Alert variant="danger">{error}</Alert>}

          {/* Loading */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-2">Loading drafts...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <ClipboardList size={48} className="mb-3 opacity-50" />
              <p className="mb-0">No {statusFilter.toLowerCase()} drafts found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Company Name</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Fields Filled</th>
                    <th>Status</th>
                    <th>Captured At</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft, index) => (
                    <tr key={draft.draftId}>
                      <td className="text-muted small">{index + 1}</td>
                      <td>{draft.companyName || <span className="text-muted">—</span>}</td>
                      <td>{draft.fullName || <span className="text-muted">—</span>}</td>
                      <td>
                        {draft.email
                          ? <a href={`mailto:${draft.email}`}>{draft.email}</a>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>{draft.phoneNumber || <span className="text-muted">—</span>}</td>
                      <td>
                        <div className="d-flex gap-1">
                          {[
                            { label: 'Co.', value: draft.companyName },
                            { label: 'Name', value: draft.fullName },
                            { label: 'Email', value: draft.email },
                            { label: 'Phone', value: draft.phoneNumber },
                          ].map(f => (
                            <Badge
                              key={f.label}
                              bg={f.value ? 'success' : 'light'}
                              text={f.value ? undefined : 'dark'}
                              title={f.label}
                              style={{ fontSize: '0.7rem' }}
                            >
                              {f.label}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <Badge bg={STATUS_VARIANTS[draft.status] || 'secondary'}>
                          {draft.status}
                        </Badge>
                      </td>
                      <td className="text-nowrap small">{formatDateTime(draft.createdAt)}</td>
                      <td className="text-nowrap small">{formatDateTime(draft.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RegistrationDrafts;
