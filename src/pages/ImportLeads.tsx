import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, ProgressBar, Row, Spinner, Table } from 'react-bootstrap';
import { Download, FileSpreadsheet, Upload, XCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import {
  downloadLeadImportTemplate,
  downloadLeadImportRejectedRows,
  getLeadImportHistory,
  getLeadImportDetails,
  getLeadImportProgress,
  isRunningStatus,
  isTerminalStatus,
  LeadImportDetails,
  LeadImportListItem,
  LeadImportProgress,
  LeadImportRejectedRow,
  startLeadImport,
} from '../services/leadImportService';

type ImportStage = 'idle' | 'uploading' | 'processing' | 'done';

const getDisplayName = (d: LeadImportRejectedRow): string => (d.clientName ?? d.name ?? '').trim() || '—';
const getDisplayPhone = (d: LeadImportRejectedRow): string => (d.mobileNumber ?? d.phone ?? '').trim() || '—';
const getDisplayRow = (d: LeadImportRejectedRow): string =>
  typeof d.rowNumber === 'number' && Number.isFinite(d.rowNumber) ? d.rowNumber.toString() : '—';
const getDisplayReason = (d: LeadImportRejectedRow): string => (d.reason ?? '').trim() || '—';

const getAxiosErrorMessage = (err: any, fallback: string): string => {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const msg = (data as any).message || (data as any).title || (data as any).error;
    if (typeof msg === 'string' && msg.trim()) return msg;
    try {
      return JSON.stringify(data);
    } catch {
      // ignore
    }
  }
  return err?.message || fallback;
};

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
  return getAxiosErrorMessage(err, fallback);
};

const ImportLeads: React.FC = () => {
  const { showError, showInfo, showSuccess } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stage, setStage] = useState<ImportStage>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [leadImportId, setLeadImportId] = useState<number | null>(null);
  const [progress, setProgress] = useState<LeadImportProgress | null>(null);
  const [details, setDetails] = useState<LeadImportDetails | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const [rejectedDownloadLoading, setRejectedDownloadLoading] = useState<boolean>(false);

  const [history, setHistory] = useState<LeadImportListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const backendStatus = progress?.status ?? details?.status ?? null;
  const isImporting = stage === 'uploading' || stage === 'processing' || isRunningStatus(backendStatus ?? undefined);

  const totalInFile =
    details?.totalRecords ??
    details?.totalLeadsInFile ??
    progress?.totalRecords ??
    progress?.totalLeadsInFile ??
    progress?.total ??
    null;

  const importedCount =
    details?.insertedCount ??
    details?.importedCount ??
    progress?.insertedCount ??
    progress?.importedCount ??
    null;

  const rejectedDuplicatesCount =
    details?.duplicateRejectedCount ??
    details?.rejectedDuplicatesCount ??
    progress?.duplicateRejectedCount ??
    progress?.rejectedDuplicatesCount ??
    null;

  const rejectedRows = useMemo(() => details?.rejectedRows ?? [], [details]);
  const rejectedDownloadId = details?.leadImportId ?? leadImportId ?? null;

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await getLeadImportHistory();
      if (!res.success) {
        throw new Error(res.message || 'Failed to load import history');
      }
      setHistory(res.data ?? []);
    } catch (err: any) {
      const message = getAxiosErrorMessage(err, 'Failed to load import history.');
      setHistoryError(message);
      // eslint-disable-next-line no-console
      console.error('Lead import history error:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setDetails(null);
    setProgress(null);
    setLeadImportId(null);
    setUploadProgress(0);
    setStage('idle');

    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      showInfo('File Selected', `File "${file.name}" is ready to import`);
    }
  };

  const clearSelection = () => {
    if (isImporting) return;
    setSelectedFile(null);
    setDetails(null);
    setProgress(null);
    setLeadImportId(null);
    setError(null);
    setUploadProgress(0);
    setStage('idle');
    setRejectedDownloadLoading(false);
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!leadImportId || stage !== 'processing') return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await getLeadImportProgress(leadImportId);
        if (!res.success) {
          throw new Error(res.message || 'Failed to load import progress');
        }
        setProgress(res.data ?? null);

        const status = res.data?.status;

        if (isTerminalStatus(status)) {
          stopPolling();

          const detailsRes = await getLeadImportDetails(leadImportId);
          if (!detailsRes.success) {
            throw new Error(detailsRes.message || 'Failed to load import details');
          }
          setDetails(detailsRes.data ?? null);
          setStage('done');
          loadHistory();

          const normalized = (status ?? '').toString().toLowerCase();
          if (normalized === 'completed') {
            showSuccess('Import Completed', 'Import finished successfully.');
          } else {
            showError('Import Failed', 'Import finished with a failure status. Please check details.');
          }
          return;
        }

        // schedule next poll
        pollTimerRef.current = window.setTimeout(tick, 1500);
      } catch (err: any) {
        stopPolling();
        const message = err?.message || 'Failed to poll import progress.';
        setError(message);
        setStage('done');
        showError('Import Error', message);
        // eslint-disable-next-line no-console
        console.error('Lead import polling error:', err);
      }
    };

    tick();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadImportId, stage]);

  const onDownloadTemplate = async () => {
    if (isImporting) return;
    setError(null);

    try {
      showInfo('Preparing Template', 'Downloading Excel template...');
      const { blob, fileName } = await downloadLeadImportTemplate();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('Template Downloaded', `Saved "${fileName}"`);
    } catch (err: any) {
      const message = getAxiosErrorMessage(err, 'Failed to download template.');
      setError(message);
      showError('Download Failed', message);
      // eslint-disable-next-line no-console
      console.error('Template download error:', err);
    }
  };

  const onDownloadRejectedRows = async () => {
    if (!rejectedDownloadId || rejectedRows.length === 0 || rejectedDownloadLoading) return;
    setError(null);
    setRejectedDownloadLoading(true);

    try {
      showInfo('Preparing Download', 'Downloading rejected rows...');
      const { blob, fileName } = await downloadLeadImportRejectedRows(rejectedDownloadId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);

      showSuccess('Download Started', `Saved "${fileName}"`);
    } catch (err: any) {
      const message = await getAxiosErrorMessageAsync(err, 'Failed to download rejected rows.');
      setError(message);
      showError('Download Failed', message);
      // eslint-disable-next-line no-console
      console.error('Rejected rows download error:', err);
    } finally {
      setRejectedDownloadLoading(false);
    }
  };

  const onImport = async () => {
    if (!selectedFile) {
      setError('Please choose an Excel file to import.');
      showError('Validation Error', 'Please choose an Excel file to import.');
      return;
    }

    setError(null);
    setDetails(null);
    setProgress(null);
    setLeadImportId(null);
    setUploadProgress(0);
    setStage('uploading');

    try {
      showInfo('Import Started', 'Uploading Excel file...');

      const response = await startLeadImport(selectedFile, {
        onUploadProgress: (p) => setUploadProgress(p),
      });

      if (!response.success) {
        const message = response.message || 'Failed to start import. Please try again.';
        setError(message);
        showError('Import Failed', message);
        setStage('done');
        return;
      }

      const id = response.data?.leadImportId;
      if (!id) {
        const message = 'Import started, but no leadImportId was returned by the backend.';
        setError(message);
        showError('Import Failed', message);
        setStage('done');
        return;
      }

      setLeadImportId(id);
      setStage('processing');
      showInfo('Import Queued', `Import started (ID: ${id}). Processing in background...`);
    } catch (err: any) {
      const message = getAxiosErrorMessage(err, 'Import failed. Please check your backend logs and try again.');
      setError(message);
      setStage('done');
      showError('Import Failed', message);
      // eslint-disable-next-line no-console
      console.error('Lead import error:', err);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div className="flex-grow-1">
          <h2 className="mb-1">Import Leads from Excel</h2>
          <p className="text-muted mb-0">
            Upload an Excel file and let the backend validate, detect duplicates, and import.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xs={12} lg={7}>
              <Form.Group controlId="leadImportFile">
                <Form.Label className="small">Excel File</Form.Label>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Control
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={onFileChange}
                    disabled={isImporting}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={clearSelection}
                    disabled={isImporting || (!selectedFile && !details && !progress && !leadImportId && !error)}
                    title="Clear"
                  >
                    <XCircle size={18} className="me-2" />
                    Clear
                  </Button>
                </div>
                <Form.Text className="text-muted">
                  Supported formats: <strong>.xlsx</strong>, <strong>.xls</strong>
                </Form.Text>
              </Form.Group>
            </Col>

            <Col xs={12} lg={5}>
              <div className="d-flex gap-2 justify-content-start justify-content-lg-end flex-wrap">
                <Button
                  variant="outline-success"
                  onClick={onDownloadTemplate}
                  disabled={isImporting}
                  className="flex-grow-1 flex-lg-grow-0"
                >
                  <Download size={18} className="me-2" />
                  Template
                </Button>
                <Button
                  variant="primary"
                  onClick={onImport}
                  disabled={!selectedFile || isImporting}
                  className="flex-grow-1 flex-lg-grow-0"
                >
                  {isImporting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="me-2" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            </Col>
          </Row>

          {(stage === 'uploading' || stage === 'processing') && (
            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <FileSpreadsheet size={18} />
                  <span className="fw-semibold">
                    {stage === 'uploading' ? 'Uploading file...' : 'Importing in background...'}
                  </span>
                </div>
                <Badge bg={stage === 'uploading' ? 'info' : 'warning'} className="text-uppercase">
                  {stage === 'processing' ? (backendStatus ?? 'processing') : stage}
                </Badge>
              </div>

              <ProgressBar
                now={
                  stage === 'uploading'
                    ? uploadProgress
                    : typeof progress?.percent === 'number'
                      ? Math.max(0, Math.min(100, progress.percent))
                      : 0
                }
                animated
                striped
                label={
                  stage === 'uploading'
                    ? `${uploadProgress}%`
                    : typeof progress?.percent === 'number'
                      ? `${Math.max(0, Math.min(100, Math.round(progress.percent)))}%`
                      : 'Polling...'
                }
              />

              <div className="text-muted small mt-2">
                Actions are disabled while the import is running.
                {leadImportId ? (
                  <span className="ms-2">
                    Import ID: <strong>{leadImportId}</strong>
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {stage === 'done' && details && (
        <Row className="g-4">
          <Col xs={12} xl={4}>
            <Card>
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="fw-semibold">Import Summary</div>
                  <Badge bg={(details.status ?? '').toString().toLowerCase() === 'completed' ? 'success' : 'secondary'}>
                    {details.status ?? 'Done'}
                  </Badge>
                </div>

                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Total leads in file</span>
                    <span className="fw-semibold">{typeof totalInFile === 'number' ? totalInFile : '—'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Successfully imported</span>
                    <span className="fw-semibold">{typeof importedCount === 'number' ? importedCount : '—'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Rejected as duplicates</span>
                    <span className="fw-semibold">
                      {typeof rejectedDuplicatesCount === 'number' ? rejectedDuplicatesCount : rejectedRows.length}
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} xl={8}>
            <Card>
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="fw-semibold">Rejected Rows (Backend Duplicate Detection)</div>
                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                    <Badge bg="secondary">{rejectedRows.length}</Badge>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={onDownloadRejectedRows}
                      disabled={!rejectedDownloadId || rejectedRows.length === 0 || rejectedDownloadLoading}
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
                    No rejected duplicate rows were reported by the backend for this import.
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
          </Col>
        </Row>
      )}

      <Card className="mt-4">
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="fw-semibold">Import History</div>
            <Button variant="outline-secondary" size="sm" onClick={loadHistory} disabled={historyLoading || isImporting}>
              {historyLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>

          {historyError && (
            <Alert variant="warning" className="mb-3">
              {historyError}
            </Alert>
          )}

          {historyLoading && history.length === 0 ? (
            <div className="text-muted small">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-muted small">No imports yet.</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>File</th>
                    <th style={{ width: '25%' }}>Started</th>
                    <th style={{ width: '15%' }}>Status</th>
                    <th style={{ width: '15%' }} className="text-end">
                      Imported
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 20).map((h) => {
                    const started = h.importStartedAtUtc ?? h.createdDate ?? null;
                    const startedLabel = started ? new Date(started).toLocaleString() : '—';
                    const s = (h.status ?? '').toString().toLowerCase();
                    const variant =
                      s === 'completed'
                        ? 'success'
                        : s === 'failed'
                          ? 'danger'
                          : s === 'processing'
                            ? 'warning'
                            : s === 'queued'
                              ? 'info'
                              : 'secondary';

                    const imported = h.insertedCount ?? h.importedCount ?? null;

                    return (
                      <tr key={h.leadImportId}>
                        <td className="text-truncate" title={h.fileName ?? ''}>
                          {h.fileName ?? '—'}
                        </td>
                        <td className="text-muted">{startedLabel}</td>
                        <td>
                          <Badge bg={variant}>{h.status ?? '—'}</Badge>
                        </td>
                        <td className="text-end fw-semibold">
                          {typeof imported === 'number' ? imported : '—'}
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
    </div>
  );
};

export default ImportLeads;

