import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col, Card } from 'react-bootstrap';
import { createLead, getLead, updateLead, getLeadSources, getLeadStatuses, getUrgencyLevels, getAssignableUsers } from '../services/leadService';
import { LeadSource, LeadStatus, Urgency, Lead } from '../types/Lead';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatDateForInput, getTodayForInput } from '../utils/dateUtils';

interface AddLeadModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  lead?: Lead; // Optional lead for edit mode
}

interface FormData {
  leadDate: string;
  clientName: string;
  companyName: string;
  mobileNumber: string;
  emailAddress: string;
  address: string;
  city: string;
  leadSourceId: string;
  referredBy: string;
  interestedIn: string;
  expectedBudget: string;
  urgencyLevelId: string;
  leadStatusId: string;
  assignedToUserId: string;
  followupDate: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ show, onHide, onSuccess, lead }) => {
  const { user } = useAuth();

  // Determine if we're in edit mode
  const isEditMode = !!lead;
  
  // Determine user's role
  const userRole = user?.roleName || '';
  const isAdmin = userRole === 'Company Admin' || userRole === 'System Admin';
  const isManager = userRole === 'Company Manager';
  const isTeamMember = userRole === 'Team Member';
  const canAssignLeads = isAdmin || isManager;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    leadDate: getTodayForInput(), // Today's date
    clientName: '',
    companyName: '',
    mobileNumber: '',
    emailAddress: '',
    address: '',
    city: '',
    leadSourceId: '',
    referredBy: '',
    interestedIn: '',
    expectedBudget: '',
    urgencyLevelId: '',
    leadStatusId: '',
    assignedToUserId: '',
    followupDate: '',
    notes: ''
  });

  // Loading state for edit mode
  const [loadingLead, setLoadingLead] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dropdown options state
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [urgencyLevels, setUrgencyLevels] = useState<Urgency[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Prevent modal from closing immediately after opening (fixes mobile touch issues)
  const [modalOpenedAt, setModalOpenedAt] = useState<number | null>(null);

  // Ref for modal body to handle scroll events
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Close date pickers when modal is scrolled (fixes calendar sticking issue on desktop)
  const closeDatePickers = useCallback(() => {
    // Blur any focused date inputs to close their calendar popups
    const activeElement = document.activeElement as HTMLInputElement;
    if (activeElement && activeElement.type === 'date') {
      activeElement.blur();
    }
  }, []);

  // Collapsible section state
  const [isMoreDetailsExpanded, setIsMoreDetailsExpanded] = useState(false);

  // Handle date input interaction to ensure picker opens
  const openDatePicker = useCallback((input: HTMLInputElement | null) => {
    if (!input) return;
    const inputWithPicker = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof inputWithPicker.showPicker === 'function') {
      try {
        inputWithPicker.showPicker();
      } catch (err) {
        // showPicker() may throw if already showing or not supported
        input.focus();
      }
    } else {
      input.focus();
    }
  }, []);

  const handleDateInputClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    openDatePicker(e.currentTarget);
  }, [openDatePicker]);

  const handleDateInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Small delay to avoid conflicts with native picker
    setTimeout(() => openDatePicker(e.target), 50);
  }, [openDatePicker]);

  // Attach scroll and wheel listeners to close date pickers when scrolling
  useEffect(() => {
    if (!show) return;

    const modalBody = modalBodyRef.current;
    
    // Handle scroll events
    const handleScroll = () => closeDatePickers();
    
    // Handle wheel events (mouse wheel) - catches scroll before it happens
    const handleWheel = () => closeDatePickers();
    
    // Handle touch move (mobile scrolling)
    const handleTouchMove = () => closeDatePickers();

    // Attach to modal body
    if (modalBody) {
      modalBody.addEventListener('scroll', handleScroll, { passive: true });
      modalBody.addEventListener('wheel', handleWheel, { passive: true });
      modalBody.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    // Also attach to the modal dialog element to catch any scroll
    const modalDialog = modalBody?.closest('.modal');
    if (modalDialog) {
      modalDialog.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      modalDialog.addEventListener('wheel', handleWheel, { passive: true });
    }

    return () => {
      if (modalBody) {
        modalBody.removeEventListener('scroll', handleScroll);
        modalBody.removeEventListener('wheel', handleWheel);
        modalBody.removeEventListener('touchmove', handleTouchMove);
      }
      if (modalDialog) {
        modalDialog.removeEventListener('scroll', handleScroll);
        modalDialog.removeEventListener('wheel', handleWheel);
      }
    };
  }, [show, closeDatePickers]);

  // Check if selected lead source is "Referral"
  const isReferralSource = () => {
    const selectedSource = leadSources.find(
      (source) => source.leadSourceId.toString() === formData.leadSourceId
    );
    return selectedSource?.name.toLowerCase() === 'referral';
  };

  // Load dropdown options and lead data when modal opens
  useEffect(() => {
    if (show) {
      // Set timestamp to prevent immediate closing (fixes mobile touch issues)
      setModalOpenedAt(Date.now());

      // Reset form data for add mode or load data for edit mode
      if (isEditMode && lead) {
        loadLeadData(lead);
      } else {
        // Reset to add mode defaults
        setFormData({
          leadDate: getTodayForInput(),
          clientName: '',
          companyName: '',
          mobileNumber: '',
          emailAddress: '',
          address: '',
          city: '',
          leadSourceId: '',
          referredBy: '',
          interestedIn: '',
          expectedBudget: '',
          urgencyLevelId: '',
          leadStatusId: '',
          assignedToUserId: '',
          followupDate: '',
          notes: ''
        });
      }

      loadDropdownOptions();

      // Reset errors and success states when modal opens
      setErrors({});
      setError(null);
      setSuccess(null);
    }
  }, [show, lead, isEditMode]);

  const loadDropdownOptions = async () => {
    setLoadingOptions(true);
    try {
      const [sourcesRes, statusesRes, urgencyRes, usersRes] = await Promise.all([
        getLeadSources(),
        getLeadStatuses(),
        getUrgencyLevels(),
        getAssignableUsers()
      ]);

      if (sourcesRes.success && sourcesRes.data) {
        setLeadSources(sourcesRes.data.filter(s => s.isActive));
      }

      if (statusesRes.success && statusesRes.data) {
        const activeStatuses = statusesRes.data.filter(s => s.isActive);
        setLeadStatuses(activeStatuses);

        // For create mode, update default lead status if not already set
        if (!isEditMode) {
          const newLeadStatus = activeStatuses.find(s => s.name === 'New Lead');
          if (newLeadStatus) {
            setFormData(prev => ({ ...prev, leadStatusId: newLeadStatus.leadStatusId.toString() }));
          }
        }
      }

      if (urgencyRes.success && urgencyRes.data) {
        setUrgencyLevels(urgencyRes.data.filter(u => u.isActive));
      }

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);

        // For create mode, auto-assign team members to themselves
        if (!isEditMode && isTeamMember && user) {
          setFormData(prev => ({ ...prev, assignedToUserId: user.userId.toString() }));
        }
      }
    } catch (err) {
      console.error('Failed to load dropdown options:', err);
      setError('Failed to load form options. Please try again.');
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadLeadData = async (leadData: Lead) => {
    setLoadingLead(true);
    try {
      // Pre-populate form with lead data
      setFormData({
        leadDate: formatDateForInput(leadData.leadDate),
        clientName: leadData.clientName,
        companyName: leadData.companyName || '',
        mobileNumber: leadData.mobileNumber,
        emailAddress: leadData.emailAddress || '',
        address: leadData.address || '',
        city: leadData.city || '',
        leadSourceId: leadData.leadSourceId.toString(),
        referredBy: leadData.referredBy || '',
        interestedIn: leadData.interestedIn || '',
        expectedBudget: leadData.expectedBudget?.toString() || '',
        urgencyLevelId: leadData.urgencyLevelId?.toString() || '',
        leadStatusId: leadData.leadStatusId.toString(),
        assignedToUserId: leadData.assignedToUserId?.toString() || '',
        followupDate: formatDateForInput(leadData.followupDate),
        notes: leadData.notes || ''
      });
    } catch (err) {
      console.error('Failed to load lead data:', err);
      setError('Failed to load lead data. Please try again.');
    } finally {
      setLoadingLead(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\+?[\d\s\-()]{10,20}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid mobile number';
    }

    if (formData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address';
    }

    if (!formData.leadSourceId) {
      newErrors.leadSourceId = 'Lead source is required';
    }

    // Validate ReferredBy if source is "Referral"
    if (isReferralSource() && !formData.referredBy.trim()) {
      newErrors.referredBy = 'Referred by is required for referral leads';
    }

    if (formData.expectedBudget && isNaN(parseFloat(formData.expectedBudget))) {
      newErrors.expectedBudget = 'Please enter a valid budget amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const baseRequestData = {
        leadDate: formData.leadDate,
        clientName: formData.clientName.trim(),
        companyName: formData.companyName.trim() || undefined,
        mobileNumber: formData.mobileNumber.trim(),
        emailAddress: formData.emailAddress.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        leadSourceId: parseInt(formData.leadSourceId),
        referredBy: isReferralSource() ? formData.referredBy.trim() : undefined,
        interestedIn: formData.interestedIn.trim() || undefined,
        expectedBudget: formData.expectedBudget ? parseFloat(formData.expectedBudget) : undefined,
        urgencyLevelId: formData.urgencyLevelId ? parseInt(formData.urgencyLevelId) : undefined,
        // For Team Members, always assign to themselves
        assignedToUserId: isTeamMember && user
          ? user.userId
          : (formData.assignedToUserId ? parseInt(formData.assignedToUserId) : undefined),
        followupDate: formData.followupDate || undefined,
        notes: formData.notes.trim() || undefined
      };

      let response;
      if (isEditMode && lead) {
        // For update, leadStatusId is required - use form value or fallback to existing lead's status
        const updateData = {
          ...baseRequestData,
          leadStatusId: formData.leadStatusId ? parseInt(formData.leadStatusId) : lead.leadStatusId
        };
        response = await updateLead(lead.leadId, updateData);
      } else {
        // For create, leadStatusId is optional
        const createData = {
          ...baseRequestData,
          leadStatusId: formData.leadStatusId ? parseInt(formData.leadStatusId) : undefined
        };
        response = await createLead(createData);
      }

      if (response.success) {
        setSuccess(isEditMode ? 'Lead updated successfully!' : 'Lead created successfully!');

        if (!isEditMode) {
          // Reset form only for create mode
          setFormData({
            leadDate: getTodayForInput(),
            clientName: '',
            companyName: '',
            mobileNumber: '',
            emailAddress: '',
            address: '',
            city: '',
            leadSourceId: '',
            referredBy: '',
            interestedIn: '',
            expectedBudget: '',
            urgencyLevelId: '',
            leadStatusId: leadStatuses.find(s => s.name === 'New Lead')?.leadStatusId.toString() || '',
            assignedToUserId: '',
            followupDate: '',
            notes: ''
          });
        }

        // Close modal and refresh parent after showing success message
        setTimeout(() => {
          setSuccess(null);
          onSuccess();
          onHide();
        }, 1500);
      } else {
        setError(response.message || (isEditMode ? 'Failed to update lead' : 'Failed to create lead'));
      }
    } catch (err: any) {
      console.error('Create lead error:', err);
      setError(
        err.response?.data?.message || 
        'An error occurred while creating the lead. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Prevent modal from closing immediately after opening (fixes mobile touch issues)
      const now = Date.now();
      if (modalOpenedAt && (now - modalOpenedAt) < 300) {
        return; // Ignore close attempts within 300ms of opening
      }

      // Reset form only for create mode
      if (!isEditMode) {
        setFormData({
          leadDate: getTodayForInput(),
          clientName: '',
          companyName: '',
          mobileNumber: '',
          emailAddress: '',
          address: '',
          city: '',
          leadSourceId: '',
          referredBy: '',
          interestedIn: '',
          expectedBudget: '',
          urgencyLevelId: '',
          leadStatusId: leadStatuses.find(s => s.name === 'New Lead')?.leadStatusId.toString() || '',
          assignedToUserId: '',
          followupDate: '',
          notes: ''
        });
      }
      setErrors({});
      setError(null);
      setSuccess(null);
      setModalOpenedAt(null); // Reset timestamp
      onHide();
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      backdrop={loading ? 'static' : true}
      className="add-lead-modal"
    >
      <Modal.Header closeButton={!loading} className="border-0 pb-0">
        <Modal.Title className="fw-semibold">{isEditMode ? 'Edit Lead' : 'Add New Lead'}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit} key={isEditMode ? `edit-${lead?.leadId}` : 'add'}>
        <Modal.Body className="px-4" ref={modalBodyRef} onScroll={closeDatePickers}>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
              {error}
            </Alert>
          )}

          {success && (
            <div className="success-overlay text-center py-5">
              <div className="success-checkmark mb-3">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
              </div>
              <h4 className="text-success fw-semibold mb-2">{success}</h4>
              <p className="text-muted">Redirecting...</p>
            </div>
          )}

          {(loadingOptions || (isEditMode && loadingLead)) ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading form options...</p>
            </div>
          ) : !success ? (
            <>
              {/* Section 1: General Details */}
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                  <h5 className="card-title fw-semibold mb-3 text-primary">
                    <i className="bi bi-person-lines-fill me-2"></i>
                    General Details
                  </h5>

                  {/* Mobile-first responsive: single column on mobile, 2 columns on medium+ screens */}
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">
                          Client Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          size="sm"
                          name="clientName"
                          value={formData.clientName}
                          onChange={handleChange}
                          placeholder="Enter client name"
                          isInvalid={!!errors.clientName}
                          disabled={loading}
                          maxLength={100}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.clientName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Company Name</Form.Label>
                        <Form.Control
                          type="text"
                          size="sm"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          placeholder="Enter company name"
                          disabled={loading}
                          maxLength={100}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">
                          Mobile Number <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          size="sm"
                          name="mobileNumber"
                          value={formData.mobileNumber}
                          onChange={handleChange}
                          placeholder="Enter mobile number"
                          isInvalid={!!errors.mobileNumber}
                          disabled={loading}
                          maxLength={20}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.mobileNumber}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          size="sm"
                          name="emailAddress"
                          value={formData.emailAddress}
                          onChange={handleChange}
                          placeholder="Enter email address"
                          isInvalid={!!errors.emailAddress}
                          disabled={loading}
                          maxLength={100}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.emailAddress}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Address</Form.Label>
                        <Form.Control
                          type="text"
                          size="sm"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Enter address"
                          disabled={loading}
                          maxLength={200}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">City</Form.Label>
                        <Form.Control
                          type="text"
                          size="sm"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Enter city"
                          disabled={loading}
                          maxLength={100}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">
                          Lead Source <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          size="sm"
                          name="leadSourceId"
                          value={formData.leadSourceId}
                          onChange={handleChange}
                          isInvalid={!!errors.leadSourceId}
                          disabled={loading}
                        >
                          <option value="">Select lead source</option>
                          {leadSources.map((source) => (
                            <option key={source.leadSourceId} value={source.leadSourceId}>
                              {source.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.leadSourceId}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-medium">Lead Status</Form.Label>
                        <Form.Select
                          size="sm"
                          name="leadStatusId"
                          value={formData.leadStatusId}
                          onChange={handleChange}
                          disabled={loading}
                        >
                          <option value="">Select lead status</option>
                          {leadStatuses.map((status) => (
                            <option key={status.leadStatusId} value={status.leadStatusId}>
                              {status.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted small">
                          Default: New Lead
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>


                  {/* Conditional ReferredBy field */}
                  {isReferralSource() && (
                    <Row className="g-3">
                      <Col xs={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">
                            Referred By <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            name="referredBy"
                            value={formData.referredBy}
                            onChange={handleChange}
                            placeholder="Enter referrer name"
                            isInvalid={!!errors.referredBy}
                            disabled={loading}
                            maxLength={100}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.referredBy}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {/* Read-only fields for edit mode */}
                  {isEditMode && lead && (
                    <Row className="g-3">
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Created Date</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            value={formatDate(lead.createdDate)}
                            disabled
                            className="bg-light"
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Created By</Form.Label>
                          <Form.Control
                            type="text"
                            size="sm"
                            value={lead.createdByUserName || 'Unknown'}
                            disabled
                            className="bg-light"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>

              {/* Section 2: More Details (Collapsible) */}
              <Card className="mb-3 border-0 shadow-sm">
                <Card.Header
                  className="border-0 bg-transparent cursor-pointer"
                  onClick={() => setIsMoreDetailsExpanded(!isMoreDetailsExpanded)}
                  style={{ cursor: 'pointer' }}
                >
                  <h5 className="card-title fw-semibold mb-0 text-primary d-flex align-items-center">
                    <i className="bi bi-chevron-right me-2 transition-transform"
                       style={{
                         transform: isMoreDetailsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                         transition: 'transform 0.2s ease'
                       }}></i>
                    More Details
                    <small className="text-muted ms-auto">
                      {isMoreDetailsExpanded ? 'Click to collapse' : 'Click to expand'}
                    </small>
                  </h5>
                </Card.Header>

                {isMoreDetailsExpanded && (
                  <Card.Body className="pt-0">
                    <Row className="g-3">
                      <Col xs={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Interested In</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            size="sm"
                            name="interestedIn"
                            value={formData.interestedIn}
                            onChange={handleChange}
                            placeholder="Enter what the client is interested in"
                            disabled={loading}
                            maxLength={500}
                          />
                          <Form.Text className="text-muted small">
                            {formData.interestedIn.length}/500 characters
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3">
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Expected Budget</Form.Label>
                          <Form.Control
                            type="number"
                            size="sm"
                            name="expectedBudget"
                            value={formData.expectedBudget}
                            onChange={handleChange}
                            placeholder="Enter expected budget"
                            isInvalid={!!errors.expectedBudget}
                            disabled={loading}
                            min="0"
                            step="0.01"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.expectedBudget}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Urgency Level</Form.Label>
                          <Form.Select
                            size="sm"
                            name="urgencyLevelId"
                            value={formData.urgencyLevelId}
                            onChange={handleChange}
                            disabled={loading}
                          >
                            <option value="">Select urgency level</option>
                            {urgencyLevels.map((urgency) => (
                              <option key={urgency.urgencyLevelId} value={urgency.urgencyLevelId}>
                                {urgency.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3">
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Assign To</Form.Label>
                          {canAssignLeads ? (
                            // Admin and Manager can select from dropdown
                            <Form.Select
                              size="sm"
                              name="assignedToUserId"
                              value={formData.assignedToUserId}
                              onChange={handleChange}
                              disabled={loading}
                            >
                              <option value="">Unassigned</option>
                              {users.map((assignableUser: any) => (
                                <option key={assignableUser.userId} value={assignableUser.userId}>
                                  {assignableUser.fullName} ({assignableUser.email})
                                </option>
                              ))}
                            </Form.Select>
                          ) : (
                            // Team Member - disabled field with their name
                            <Form.Control
                              type="text"
                              size="sm"
                              value={user?.fullName || 'Auto-assigned to you'}
                              disabled
                              className="bg-light"
                            />
                          )}
                          {isTeamMember && (
                            <Form.Text className="text-muted small">
                              Leads are automatically assigned to you
                            </Form.Text>
                          )}
                          {isManager && users.length === 0 && (
                            <Form.Text className="text-warning small">
                              No team members found. Add team members to assign leads.
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>

                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Follow-up Date</Form.Label>
                          <Form.Control
                            type="date"
                            size="sm"
                            name="followupDate"
                            value={formData.followupDate}
                            onChange={handleChange}
                            onClick={handleDateInputClick}
                            onFocus={handleDateInputFocus}
                            disabled={loading}
                            min={isEditMode ? undefined : getTodayForInput()}
                          />
                          {!isEditMode && (
                            <Form.Text className="text-muted small">
                              Select a date for the next follow-up
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3">
                      <Col xs={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-medium">Notes</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            size="sm"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Enter any additional notes"
                            disabled={loading}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                )}
              </Card>
            </>
          ) : null}
        </Modal.Body>

        {!success && (
          <Modal.Footer className="border-0 pt-0 px-4 d-flex flex-column-reverse flex-sm-row gap-2">
            <Button
              variant="outline-secondary"
              onClick={handleClose}
              disabled={loading}
              className="flex-grow-1 flex-sm-grow-0 px-4"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || loadingOptions}
              className="flex-grow-1 flex-sm-grow-0 px-4"
            >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <i className={`bi bi-${isEditMode ? 'pencil' : 'plus-circle'} me-2`}></i>
                {isEditMode ? 'Update Lead' : 'Create Lead'}
              </>
            )}
            </Button>
          </Modal.Footer>
        )}
      </Form>
    </Modal>
  );
};

export default AddLeadModal;
