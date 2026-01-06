import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Row, Col, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { Calendar, Clock, Edit, MessageSquare, AlertTriangle } from 'lucide-react';
import { getUpcomingFollowups, rescheduleFollowup, addNote, updateLead, getLeadStatuses } from '../services/leadService';
import { Lead, LeadStatus, UpcomingFollowupsResponse, RescheduleFollowupRequest, AddNoteRequest } from '../types/Lead';
import { formatDate, formatDateForInput, isOverdue as checkIsOverdue, isToday, getTodayForInput } from '../utils/dateUtils';

const UpcomingFollowups: React.FC = () => {
  // State management
  const [followupsData, setFollowupsData] = useState<UpcomingFollowupsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  
  // Date filter states
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showEditNotesModal, setShowEditNotesModal] = useState(false);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ lead: Lead; newStatusId: number } | null>(null);

  // Form states
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleFollowupRequest>({
    newFollowupDate: ''
  });
  const [editNotesForm, setEditNotesForm] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [saveNotesLoading, setSaveNotesLoading] = useState(false);
  const [statusUpdatingIds, setStatusUpdatingIds] = useState<Set<number>>(new Set());

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Close date picker on scroll or wheel
  useEffect(() => {
    const closeDatePicker = () => {
      const activeElement = document.activeElement as HTMLInputElement;
      if (activeElement && activeElement.type === 'date') {
        activeElement.blur();
      }
    };

    // Wheel event fires before scroll, better for closing picker immediately
    const handleWheel = () => {
      closeDatePicker();
    };

    // Add listeners
    window.addEventListener('wheel', handleWheel, { passive: true, capture: true });
    window.addEventListener('scroll', closeDatePicker, true);
    window.addEventListener('touchmove', closeDatePicker, { passive: true, capture: true });

    return () => {
      window.removeEventListener('wheel', handleWheel, true);
      window.removeEventListener('scroll', closeDatePicker, true);
      window.removeEventListener('touchmove', closeDatePicker, true);
    };
  }, []);

  // Handle date input click to show picker
  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    input.showPicker?.();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load followups and lead statuses in parallel
      const [followupsResponse, statusesResponse] = await Promise.all([
        getUpcomingFollowups(),
        getLeadStatuses()
      ]);

      if (followupsResponse.success && followupsResponse.data) {
        setFollowupsData(followupsResponse.data);
      } else {
        setError(followupsResponse.message || 'Failed to load followups');
      }

      if (statusesResponse.success && statusesResponse.data) {
        setLeadStatuses(statusesResponse.data);
      }
    } catch (err) {
      setError('An error occurred while loading data');
      console.error('Error loading followups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = (lead: Lead) => {
    setSelectedLead(lead);
    setRescheduleForm({
      newFollowupDate: formatDateForInput(lead.followupDate)
    });
    setShowRescheduleModal(true);
  };

  const handleEditNotes = (lead: Lead) => {
    setSelectedLead(lead);
    setEditNotesForm(''); // Clear form for new note entry
    setShowEditNotesModal(true);
  };

  const submitReschedule = async () => {
    if (!selectedLead || !rescheduleForm.newFollowupDate) return;

    try {
      setRescheduleLoading(true);
      const response = await rescheduleFollowup(selectedLead.leadId, rescheduleForm);

      if (response.success) {
        setShowRescheduleModal(false);
        setSelectedLead(null);
        // Refresh data
        await loadData();
      } else {
        setError(response.message || 'Failed to reschedule followup');
      }
    } catch (err) {
      setError('An error occurred while rescheduling followup');
      console.error('Error rescheduling followup:', err);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const submitSaveNotes = async () => {
    if (!selectedLead || !editNotesForm.trim()) return;

    try {
      setSaveNotesLoading(true);
      // Use addNote API to append with timestamp
      const response = await addNote(selectedLead.leadId, { note: editNotesForm });

      if (response.success) {
        setShowEditNotesModal(false);
        setSelectedLead(null);
        setEditNotesForm('');
        // Refresh data
        await loadData();
      } else {
        setError(response.message || 'Failed to save notes');
      }
    } catch (err) {
      setError('An error occurred while saving notes');
      console.error('Error saving notes:', err);
    } finally {
      setSaveNotesLoading(false);
    }
  };

  const getRowClass = (lead: Lead) => {
    if (!lead.followupDate) return '';

    if (checkIsOverdue(lead.followupDate)) {
      return 'table-danger'; // Red for overdue
    } else if (isToday(lead.followupDate)) {
      return 'table-info'; // Blue for today
    }
    return ''; // Normal for future
  };

  const getStatusVariant = (statusName: string) => {
    switch (statusName?.toLowerCase()) {
      case 'new lead': return 'primary';
      case 'contacted': return 'info';
      case 'meeting scheduled': return 'warning';
      case 'demo done': return 'secondary';
      case 'proposal sent': return 'dark';
      case 'follow-up': return 'info';
      case 'converted': return 'success';
      case 'lost': return 'danger';
      default: return 'secondary';
    }
  };

  const getDaysUntilClass = (daysUntil: number | null) => {
    if (daysUntil === null) return 'text-muted';
    if (daysUntil < 0) return 'text-danger';
    if (daysUntil === 0) return 'text-warning fw-bold';
    if (daysUntil <= 2) return 'text-info fw-bold';
    return 'text-muted';
  };

  const handleStatusChange = (lead: Lead, statusId: number) => {
    if (lead.leadStatusId === statusId) {
      return;
    }

    // Show confirmation modal
    setPendingStatusChange({ lead, newStatusId: statusId });
    setShowStatusConfirmModal(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    const { lead, newStatusId } = pendingStatusChange;

    setStatusUpdatingIds(prev => {
      const next = new Set(prev);
      next.add(lead.leadId);
      return next;
    });

    setShowStatusConfirmModal(false);

    try {
      const response = await updateLead(lead.leadId, {
        leadDate: lead.leadDate,
        clientName: lead.clientName,
        companyName: lead.companyName,
        mobileNumber: lead.mobileNumber,
        emailAddress: lead.emailAddress,
        leadSourceId: lead.leadSourceId,
        referredBy: lead.referredBy,
        interestedIn: lead.interestedIn,
        expectedBudget: lead.expectedBudget,
        urgencyLevelId: lead.urgencyLevelId,
        leadStatusId: newStatusId,
        assignedToUserId: lead.assignedToUserId,
        followupDate: lead.followupDate,
        notes: lead.notes
      });

      if (response.success) {
        await loadData();
      } else {
        setError(response.message || 'Failed to update status');
      }
    } catch (err) {
      setError('An error occurred while updating status');
      console.error('Error updating status:', err);
    } finally {
      setStatusUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(lead.leadId);
        return next;
      });
      setPendingStatusChange(null);
    }
  };

  const cancelStatusChange = () => {
    setShowStatusConfirmModal(false);
    setPendingStatusChange(null);
    // Reload data to reset the dropdown to original value
    loadData();
  };

  // Filter followups based on date range and status
  const getFilteredFollowups = () => {
    if (!followupsData?.followups) return [];

    let filtered = [...followupsData.followups];

    // Always filter by status (handle variations: "followup", "follow-up", "Follow-up", etc.)
    filtered = filtered.filter(lead => {
      const statusName = lead.leadStatusName?.toLowerCase().replace(/[-\s]/g, '');
      return statusName === 'followup';
    });

    // Filter by from date
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter(lead => {
        if (!lead.followupDate) return false;
        const followup = new Date(lead.followupDate);
        followup.setHours(0, 0, 0, 0);
        return followup >= from;
      });
    }

    // Filter by to date
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(lead => {
        if (!lead.followupDate) return false;
        const followup = new Date(lead.followupDate);
        followup.setHours(0, 0, 0, 0);
        return followup <= to;
      });
    }

    return filtered;
  };

  // Get counts for filtered data
  const getFilteredCounts = () => {
    const filtered = getFilteredFollowups();

    const overdue = filtered.filter(lead => checkIsOverdue(lead.followupDate)).length;

    const today = filtered.filter(lead => {
      if (!lead.followupDate) return false;
      return isToday(lead.followupDate);
    }).length;

    const upcoming = filtered.filter(lead => {
      if (!lead.followupDate) return false;
      return !checkIsOverdue(lead.followupDate) && !isToday(lead.followupDate);
    }).length;

    return { overdue, today, upcoming, total: filtered.length };
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const filteredFollowups = getFilteredFollowups();
  const counts = getFilteredCounts();

  return (
    <div>
      <div className="mb-4">
        {/* Mobile-first header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
          <div className="flex-grow-1">
            <h2 className="mb-0">
              <Calendar className="me-2" size={24} />
              Upcoming Follow-ups
            </h2>
            <p className="text-muted mb-0">Manage your upcoming and overdue follow-ups</p>
          </div>
        </div>

        {/* Date Filter and Badges Row */}
        <Card className="shadow-sm mb-3">
          <Card.Body>
            {/* Status Badges - Show first on mobile for quick overview */}
            <div className="d-flex flex-wrap justify-content-center justify-content-md-end gap-2 mb-3">
              <Badge bg="danger" className="d-flex align-items-center gap-1 p-2" style={{ fontSize: '0.85rem' }}>
                <AlertTriangle size={14} />
                <span>{counts.overdue} Overdue</span>
              </Badge>
              <Badge style={{ backgroundColor: '#8b5cf6', fontSize: '0.85rem' }} className="d-flex align-items-center gap-1 p-2 text-white">
                <Calendar size={14} />
                <span>{counts.today} Today</span>
              </Badge>
              <Badge style={{ backgroundColor: '#22c55e', fontSize: '0.85rem' }} className="d-flex align-items-center gap-1 p-2 text-white">
                <Clock size={14} />
                <span>{counts.upcoming} Upcoming</span>
              </Badge>
              <Badge style={{ backgroundColor: '#8b5cf6', fontSize: '0.85rem' }} className="d-flex align-items-center gap-1 p-2 text-white">
                <span>{counts.total} Total</span>
              </Badge>
            </div>

            {/* Date Filters - Stack on mobile */}
            <Row className="g-3 mb-3">
              <Col xs={12} sm={6} md={4} lg={3}>
                <Form.Group>
                  <Form.Label className="small mb-1">From Date</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    onClick={handleDateClick}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} lg={3}>
                <Form.Group>
                  <Form.Label className="small mb-1">To Date</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    onClick={handleDateClick}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={12} md={4} lg={3} className="d-flex align-items-end">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleClearFilters}
                  disabled={!fromDate && !toDate}
                  className="w-100"
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Replace the existing Card and table-responsive block with this */}
      <div className="followups-container">
        {filteredFollowups.length > 0 ? (
          <>
            {/* MOBILE CARD VIEW - Cleaned up */}
            <div className="d-block d-md-none">
              <div className="row g-3"> {/* g-3 provides nice spacing between cards */}
                {filteredFollowups.map((lead) => (
                  <div key={lead.leadId} className="col-12">
                    <Card className={`border-0 shadow-sm ${getRowClass(lead) === 'table-danger' ? 'border-start border-danger border-4' : ''}`}>
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="fw-bold mb-0">{lead.clientName}</h6>
                            {lead.companyName && (
                              <small className="text-muted">{lead.companyName}</small>
                            )}
                          </div>
                          <Badge
                             bg={getRowClass(lead) === 'table-danger' ? 'danger' : 'info'}
                             className="rounded-pill"
                          >
                            {formatDate(lead.followupDate)}
                          </Badge>
                        </div>

                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <small className="text-muted d-block small-label">STATUS</small>
                            <Badge bg="light" text="dark" className="border">
                              {lead.leadStatusName}
                            </Badge>
                          </div>
                          <div className="col-6 text-end">
                            <small className="text-muted d-block small-label">ASSIGNED</small>
                            <span className="small">{lead.assignedToUserName || 'Unassigned'}</span>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="flex-grow-1"
                            onClick={() => handleReschedule(lead)}
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-grow-1"
                            onClick={() => handleEditNotes(lead)}
                          >
                            Add Note
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* DESKTOP TABLE VIEW - Keep this wrapped in table-responsive */}
            <div className="d-none d-md-block">
              <Card className="shadow-sm border-0">
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Client</th>
                        <th className="d-none d-md-table-cell">Company</th>
                        <th className="d-none d-lg-table-cell">Prev Status</th>
                        <th>Status</th>
                        <th>Follow-up</th>
                        <th className="d-none d-md-table-cell">Assigned</th>
                        <th className="d-none d-lg-table-cell">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFollowups.map((lead) => (
                        <tr
                          key={lead.leadId}
                          className={getRowClass(lead)}
                        >
                          <td>
                            <div className="fw-semibold">{lead.clientName}</div>
                            {/* Show company on mobile since company column is hidden */}
                            <div className="small text-muted d-md-none">{lead.companyName || '-'}</div>
                            {/* Show assigned on mobile since assigned column is hidden */}
                            <div className="small text-muted d-md-none">{lead.assignedToUserName || 'Unassigned'}</div>
                          </td>
                          <td className="d-none d-md-table-cell">{lead.companyName || 'N/A'}</td>
                          <td className="d-none d-lg-table-cell">
                            <Badge bg="secondary" style={{ fontSize: '0.75rem' }}>
                              {lead.previousLeadStatusName || 'N/A'}
                            </Badge>
                          </td>
                          <td>
                            {leadStatuses.length > 0 ? (
                              <Form.Select
                                size="sm"
                                value={lead.leadStatusId}
                                onChange={(e) => handleStatusChange(lead, Number(e.target.value))}
                                disabled={statusUpdatingIds.has(lead.leadId)}
                                style={{ minWidth: '100px', fontSize: '0.8rem' }}
                              >
                                {leadStatuses.map((status) => (
                                  <option key={status.leadStatusId} value={status.leadStatusId}>
                                    {status.name}
                                  </option>
                                ))}
                              </Form.Select>
                            ) : (
                              <Badge bg="secondary">{lead.leadStatusName || 'Unknown'}</Badge>
                            )}
                          </td>
                          <td>
                            <div
                              className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleReschedule(lead)}
                              title="Click to reschedule"
                            >
                              <span className="text-primary text-decoration-underline small">
                                {formatDate(lead.followupDate)}
                              </span>
                              {checkIsOverdue(lead.followupDate) && (
                                <Badge bg="danger" className="ms-0 ms-sm-2 mt-1 mt-sm-0" style={{ fontSize: '0.65rem' }}>Overdue</Badge>
                              )}
                              {isToday(lead.followupDate) && (
                                <Badge style={{ backgroundColor: '#8b5cf6', fontSize: '0.65rem' }} className="ms-0 ms-sm-2 mt-1 mt-sm-0 text-white">Today</Badge>
                              )}
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">{lead.assignedToUserName || 'Unassigned'}</td>
                          <td className="d-none d-lg-table-cell">
                            <div
                              className="text-truncate text-primary small"
                              style={{
                                maxWidth: '150px',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                              title={lead.notes || 'No notes - Click to edit'}
                              onClick={() => handleEditNotes(lead)}
                            >
                              {lead.notes || 'Add notes'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-5 bg-white rounded shadow-sm">
             <Calendar size={48} className="text-muted mb-3" />
             <h5>No upcoming follow-ups</h5>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <Modal
        show={showRescheduleModal}
        onHide={() => setShowRescheduleModal(false)}
        centered
        size="sm"
        className="mobile-modal"
      >
        <Modal.Header closeButton className="pb-2">
          <Modal.Title className="h6">Reschedule Follow-up</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {selectedLead && (
            <div className="mb-3 small">
              <div className="fw-medium text-truncate" title={selectedLead.clientName}>
                {selectedLead.clientName}
              </div>
              <div className="text-muted small">
                Current: {formatDate(selectedLead.followupDate)}
              </div>
            </div>
          )}
          <Form.Group>
            <Form.Label className="small fw-medium">New Follow-up Date</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={rescheduleForm.newFollowupDate}
              onChange={(e) => setRescheduleForm({ newFollowupDate: e.target.value })}
              min={getTodayForInput()}
              className="form-control-sm"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="pt-2 pb-3">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowRescheduleModal(false)}
            className="flex-fill"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={submitReschedule}
            disabled={!rescheduleForm.newFollowupDate || rescheduleLoading}
            className="flex-fill"
          >
            {rescheduleLoading ? <Spinner size="sm" /> : 'Reschedule'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Status Change Confirmation Modal */}
      <Modal show={showStatusConfirmModal} onHide={cancelStatusChange} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Status Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pendingStatusChange && (
            <div>
              <p className="mb-3">Are you sure you want to change the status for:</p>
              <div className="mb-3">
                <strong>Client:</strong> {pendingStatusChange.lead.clientName}
                {pendingStatusChange.lead.companyName && (
                  <>
                    <br />
                    <strong>Company:</strong> {pendingStatusChange.lead.companyName}
                  </>
                )}
              </div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <strong>From:</strong>
                <Badge bg="secondary">{pendingStatusChange.lead.leadStatusName}</Badge>
              </div>
              <div className="d-flex align-items-center gap-2">
                <strong>To:</strong>
                <Badge bg="primary">
                  {leadStatuses.find(s => s.leadStatusId === pendingStatusChange.newStatusId)?.name || 'Unknown'}
                </Badge>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelStatusChange}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmStatusChange}>
            Confirm Change
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Notes Modal */}
      <Modal show={showEditNotesModal} onHide={() => setShowEditNotesModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Notes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLead && (
            <>
              <div className="mb-3">
                <strong>Client:</strong> {selectedLead.clientName}
                {selectedLead.companyName && (
                  <>
                    {' - '}
                    <strong>Company:</strong> {selectedLead.companyName}
                  </>
                )}
              </div>
              
              {/* Existing Notes (Read-only) */}
              {selectedLead.notes && (
                <div className="mb-3">
                  <Form.Label>Existing Notes</Form.Label>
                  <div 
                    className="border rounded p-3" 
                    style={{ 
                      backgroundColor: '#f8f9fa', 
                      whiteSpace: 'pre-wrap', 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      fontSize: '0.9rem'
                    }}
                  >
                    {selectedLead.notes}
                  </div>
                </div>
              )}

              {/* New Note Entry */}
              <Form.Group>
                <Form.Label>Add New Note</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={editNotesForm}
                  onChange={(e) => setEditNotesForm(e.target.value)}
                  placeholder="Enter your new note here..."
                  maxLength={1000}
                />
                <Form.Text className="text-muted">
                  {editNotesForm.length}/1000 characters - Note will be saved with timestamp
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditNotesModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submitSaveNotes}
            disabled={!editNotesForm.trim() || saveNotesLoading}
          >
            {saveNotesLoading ? <Spinner size="sm" /> : 'Save Note'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UpcomingFollowups;