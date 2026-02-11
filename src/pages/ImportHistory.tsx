import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Modal, Spinner, Table } from 'react-bootstrap';
import { Download, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '../components/Toast';
import {
  downloadLeadImportRejectedRows,
  getLeadImportDetails,
  getLeadImportHistory,
  LeadImportDetails,
  LeadImportListItem,
  LeadImportRejectedRow,
} from '../services/leadImportService';

const normalizeStatus = (status?: string): string => (status ?? '').toString().trim().toLowerCase();

const getStatusVariant = (status?: string): string => {
  const s = normalizeStatus(status);
  if (s === 'completed') return 'success';
  if (s === 'failed') return 'danger';
  if (s === 'cancelled') return 'secondary';
  if (s === 'processing') return 'warning';
  if (s === 'queued') return 'info';
  return 'secondary';
};

const formatDateTime = (value?: string): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

const getDisplayName = (d: LeadImportRejectedRow): string => (d.clientName ?? d.name ?? '').trim() || '—';
const getDisplayPhone = (d: LeadImportRejectedRow): string => (d.mobileNumber ?? d.phone ?? '').trim() || '—';
const getDisplayRow = (d: LeadImportRejectedRow): string =>
  typeof d.rowNumber === 'number' && Number.isFinite(d.rowNumber) ? d.rowNumber.toString() : '—';
const getDisplayReason = (d: LeadImportRejectedRow): string => (d.reason ?? '').trim() || '—';

const getAxiosErrorMessageAsync = async (err: any, fallback: string): Promise<string> => {
  const data = err?.response?.data;
  // When axios uses responseType: 'blob', error bodies come back as Blob.
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      const text = (await data.text()).trim();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          const msg = parsed?.message || parsed?.title || parsed?.error;
          if (typeof msg === 'string' && msg.trim()) return msg.trim();
          return text;
        } catch {
          return text;
        }
      }
    } catch {
      // ignore and fall back
    }
  }
  const message = err?.message;
  return typeof message === 'string' && message.trim() ? message.trim() : fallback;
};

const getTotals = (item: any): { total: number | null; inserted: number | null; dupes: number | null } => {
  const total =
    typeof item?.totalLeadsInFile === 'number'
      ? item.totalLeadsInFile
      : typeof item?.totalRecords === 'number'
        ? item.totalRecords
        : null;
  const inserted =
    typeof item?.importedCount === 'number'
      ? item.importedCount
      : typeof item?.insertedCount === 'number'
        ? item.insertedCount
        : null;
  const dupes =
    typeof item?.rejectedDuplicatesCount === 'number'
      ? item.rejectedDuplicatesCount
      : typeof item?.duplicateRejectedCount === 'number'
        ? item.duplicateRejectedCount
        : null;
  return { total, inserted, dupes };
};

const getStartedAt = (item: any): string | undefined => item?.createdDate ?? item?.importStartedAtUtc;
const getCompletedAt = (item: any): string | undefined => item?.importCompletedAtUtc;

const ImportHistory: React.FC = () => {
  const { showError, showInfo, showSuccess } = useToast();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imports, setImports] = useState<LeadImportListItem[]>([]);

  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [details, setDetails] = useState<LeadImportDetails | null>(null);
  const [rejectedDownloadLoading, setRejectedDownloadLoading] = useState<boolean>(false);

  const rejectedRows = useMemo(() => details?.rejectedRows ?? [], [details]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeadImportHistory();
      if (!res.success) throw new Error(res.message || 'Failed to load import history.');
      setImports(res.data ?? []);
    } catch (err: any) {
      const message = err?.message || 'Failed to load import history.';
      setError(message);
      showError('Import History Error', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetails = async (leadImportId: number) => {
    setShowDetails(true);
    setDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);
    setRejectedDownloadLoading(false);

    try {
      showInfo('Loading Import Details', `Fetching details for import #${leadImportId}...`);
      const res = await getLeadImportDetails(leadImportId);
      if (!res.success) throw new Error(res.message || 'Failed to load import details.');
      setDetails(res.data ?? null);
    } catch (err: any) {
      const message = err?.message || 'Failed to load import details.';
      setDetailsError(message);
      showError('Import Details Error', message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const onDownloadRejectedRows = async () => {
    const leadImportId = details?.leadImportId;
    if (!leadImportId || rejectedRows.length === 0 || rejectedDownloadLoading) return;

    setRejectedDownloadLoading(true);
    try {
      showInfo('Preparing Download', 'Downloading rejected rows...');
      const { blob, fileName } = await downloadLeadImportRejectedRows(leadImportId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);

      showSuccess('Download Started', `Rejected rows file "${fileName}" is downloading.`);
    } catch (err: any) {
      const message = await getAxiosErrorMessageAsync(err, 'Failed to download rejected rows.');
      showError('Download Error', message);
    } finally {
      setRejectedDownloadLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div className="flex-grow-1">
          <h2 className="mb-1">Import History</h2>
          <p className="text-muted mb-0">View previous Excel imports and inspect rejected rows (backend duplicate detection).</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={loadHistory} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw size={18} className="me-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      <Card>
        <Card.Body>
          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" />
              Loading import history...
            </div>
          ) : imports.length === 0 ? (
            <Alert variant="info" className="mb-0">
              No imports found yet.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th style={{ width: '8%' }}>ID</th>
                    <th style={{ width: '28%' }}>File</th>
                    <th style={{ width: '18%' }}>Started</th>
                    <th style={{ width: '18%' }}>Completed</th>
                    <th style={{ width: '10%' }}>Status</th>
                    <th style={{ width: '8%' }} className="text-end">
                      Inserted
                    </th>
                    <th style={{ width: '8%' }} className="text-end">
                      Duplicates
                    </th>
                    <th style={{ width: '8%' }} className="text-end">
                      Total
                    </th>
                    <th style={{ width: '10%' }} className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {imports.map((item: any) => {
                    const { total, inserted, dupes } = getTotals(item);
                    return (
                      <tr key={item.leadImportId}>
                        <td className="text-muted">{item.leadImportId}</td>
                        <td>
                          <div className="fw-semibold">{(item.fileName ?? '').toString().trim() || '—'}</div>
                        </td>
                        <td className="text-muted">{formatDateTime(getStartedAt(item))}</td>
                        <td className="text-muted">{formatDateTime(getCompletedAt(item))}</td>
                        <td>
                          <Badge bg={getStatusVariant(item.status)}>{item.status ?? '—'}</Badge>
                        </td>
                        <td className="text-end fw-semibold">{typeof inserted === 'number' ? inserted : '—'}</td>
                        <td className="text-end fw-semibold">{typeof dupes === 'number' ? dupes : '—'}</td>
                        <td className="text-end fw-semibold">{typeof total === 'number' ? total : '—'}</td>
                        <td className="text-end">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openDetails(item.leadImportId)}
                            title="View details"
                          >
                            <Eye size={16} className="me-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        size="xl"
        centered
        backdrop="static"
        contentClassName="rounded-4"
      >
        <Modal.Header closeButton>
          <Modal.Title>Import Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsError ? (
            <Alert variant="danger" className="mb-0">
              <strong>Error:</strong> {detailsError}
            </Alert>
          ) : detailsLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" />
              Loading details...
            </div>
          ) : !details ? (
            <Alert variant="info" className="mb-0">
              No details available.
            </Alert>
          ) : (
            <>
              <Card className="mb-3">
                <Card.Body>
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                    <div>
                      <div className="fw-semibold">{details.fileName ?? '—'}</div>
                      <div className="text-muted small">
                        Started: <strong>{formatDateTime((details as any).createdDate ?? (details as any).importStartedAtUtc)}</strong>
                        {(details as any).importCompletedAtUtc ? (
                          <>
                            <span className="mx-2">•</span>
                            Completed: <strong>{formatDateTime((details as any).importCompletedAtUtc)}</strong>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <Badge bg={getStatusVariant(details.status)} className="text-uppercase">
                      {details.status ?? '—'}
                    </Badge>
                  </div>

                  <div className="mt-3 d-flex flex-column flex-lg-row gap-3">
                    {(() => {
                      const { total, inserted, dupes } = getTotals(details as any);
                      return (
                        <>
                          <div className="flex-grow-1 d-flex justify-content-between">
                            <span className="text-muted">Total in file</span>
                            <span className="fw-semibold">{typeof total === 'number' ? total : '—'}</span>
                          </div>
                          <div className="flex-grow-1 d-flex justify-content-between">
                            <span className="text-muted">Inserted</span>
                            <span className="fw-semibold">{typeof inserted === 'number' ? inserted : '—'}</span>
                          </div>
                          <div className="flex-grow-1 d-flex justify-content-between">
                            <span className="text-muted">Duplicates rejected</span>
                            <span className="fw-semibold">
                              {typeof dupes === 'number' ? dupes : rejectedRows.length}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {(details as any).errorMessage ? (
                    <Alert variant="warning" className="mt-3 mb-0">
                      <strong>Backend Error:</strong> {(details as any).errorMessage}
                    </Alert>
                  ) : null}
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="fw-semibold">Rejected Rows</div>
                    <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                      <Badge bg="secondary">{rejectedRows.length}</Badge>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={onDownloadRejectedRows}
                        disabled={!details?.leadImportId || rejectedRows.length === 0 || rejectedDownloadLoading}
                        title={rejectedRows.length === 0 ? 'No rejected rows to download' : 'Download rejected rows'}
                      >
                        {rejectedDownloadLoading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download size={16} className="me-1" />
                            Download rejected rows
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {rejectedRows.length === 0 ? (
                    <Alert variant="success" className="mb-0">
                      No rejected rows were reported by the backend for this import.
                    </Alert>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="mb-0 align-middle">
                        <thead>
                          <tr>
                            <th style={{ width: '10%' }}>Row</th>
                            <th style={{ width: '35%' }}>Name</th>
                            <th style={{ width: '25%' }}>Phone</th>
                            <th style={{ width: '30%' }}>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rejectedRows.map((d, idx) => (
                            <tr key={`${getDisplayRow(d)}-${getDisplayName(d)}-${getDisplayPhone(d)}-${idx}`}>
                              <td className="text-muted">{getDisplayRow(d)}</td>
                              <td>{getDisplayName(d)}</td>
                              <td className="text-muted">{getDisplayPhone(d)}</td>
                              <td className="text-muted">{getDisplayReason(d)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ImportHistory;

