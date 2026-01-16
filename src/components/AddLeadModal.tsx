import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col, Card, Badge, InputGroup, Dropdown } from 'react-bootstrap';
import { createLead, getLead, updateLead, getLeadSources, getLeadStatuses, getUrgencyLevels, getAssignableUsers } from '../services/leadService';
import { LeadSource, LeadStatus, Urgency, Lead } from '../types/Lead';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatDateForInput, getTodayForInput } from '../utils/dateUtils';
import { getReferralPartners, User } from '../services/userService';

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
  const isReferralPartner = userRole === 'Referral Partner' || user?.userRoleId === 5;
  const canAssignLeads = isAdmin || isManager;

  // Check if lead is readonly (for Referral Partners or other readonly scenarios)
  const isLeadReadonly = lead?.isReadonly === true;

  // If editing a readonly lead, show message and prevent editing
  useEffect(() => {
    if (isEditMode && isLeadReadonly) {
      console.warn('Attempting to edit a readonly lead');
      // The modal will show the lead as readonly below
    }
  }, [isEditMode, isLeadReadonly]);

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

  // Referral Partner combobox state
  const [referralPartners, setReferralPartners] = useState<User[]>([]);
  const [referredByUserId, setReferredByUserId] = useState<number | null>(null);
  const [showReferralPartnerDropdown, setShowReferralPartnerDropdown] = useState(false);
  const [filteredReferralPartners, setFilteredReferralPartners] = useState<User[]>([]);
  const referredByInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        // Reset combobox state
        setReferredByUserId(null);
        setShowReferralPartnerDropdown(false);
        setFilteredReferralPartners(referralPartners);
      }

      loadDropdownOptions();

      // Reset errors and success states when modal opens
      setErrors({});
      setError(null);
      setSuccess(null);
    }
  }, [show, lead, isEditMode]);

  // Auto-populate lead source and referred by for Referral Partners
  useEffect(() => {
    if (show && !isEditMode && isReferralPartner) {
      // Auto-populate Referred By field with RP's name
      if (user?.fullName) {
        setFormData((prev) => ({
          ...prev,
          referredBy: user.fullName,
        }));
      }

      // Auto-populate lead source when sources are loaded
      if (leadSources.length > 0) {
        const referralSource = leadSources.find(
          (source) => source.name.toLowerCase() === 'referral'
        );
        if (referralSource) {
          setFormData((prev) => ({
            ...prev,
            leadSourceId: referralSource.leadSourceId.toString(),
          }));
        }
      }
    }
  }, [show, lead, isEditMode, isReferralPartner, user?.fullName, leadSources]);

  // Match referredBy with Referral Partner when editing (after both lead data and RPs are loaded)
  useEffect(() => {
    if (isEditMode && lead && formData.referredBy && referralPartners.length > 0) {
      const matchingRP = referralPartners.find(
        rp => rp.fullName.toLowerCase() === formData.referredBy.toLowerCase()
      );
      if (matchingRP) {
        setReferredByUserId(matchingRP.userId);
      } else {
        setReferredByUserId(null);
      }
    }
  }, [isEditMode, lead, formData.referredBy, referralPartners]);

  const loadDropdownOptions = async () => {
    setLoadingOptions(true);
    let hasErrors = false;

    try {
      // Load each dropdown option individually to handle failures gracefully
      const sourcesRes = await getLeadSources();
      if (sourcesRes.success && sourcesRes.data) {
        const activeSources = sourcesRes.data.filter(s => s.isActive);
        setLeadSources(activeSources);

        // Auto-select "Referral" source for Referral Partners
        if (!isEditMode && isReferralPartner) {
          const referralSource = activeSources.find(s => s.name.toLowerCase() === 'referral');
          if (referralSource) {
            setFormData(prev => ({
              ...prev,
              leadSourceId: referralSource.leadSourceId.toString(),
              referredBy: user?.fullName || '' // Auto-set referredBy to user's name
            }));
          }
        }
      } else {
        console.warn('Failed to load lead sources');
        hasErrors = true;
      }

      const statusesRes = await getLeadStatuses();
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
      } else {
        console.warn('Failed to load lead statuses');
        hasErrors = true;
      }

      const urgencyRes = await getUrgencyLevels();
      if (urgencyRes.success && urgencyRes.data) {
        setUrgencyLevels(urgencyRes.data.filter(u => u.isActive));
      } else {
        console.warn('Failed to load urgency levels');
        hasErrors = true;
      }

      const usersRes = await getAssignableUsers();
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);

        // For create mode, auto-assign team members to themselves
        if (!isEditMode && isTeamMember && user) {
          setFormData(prev => ({ ...prev, assignedToUserId: user.userId.toString() }));
        }
      } else {
        console.warn('Failed to load assignable users');
        hasErrors = true;
      }

      // Load Referral Partners for combobox (only for non-RP users)
      if (!isReferralPartner) {
        try {
          const referralPartnersRes = await getReferralPartners();
          if (referralPartnersRes.success && referralPartnersRes.data) {
            setReferralPartners(referralPartnersRes.data);
            setFilteredReferralPartners(referralPartnersRes.data);
          } else {
            console.warn('Failed to load referral partners - referral partner selection will be unavailable');
          }
        } catch (referralError) {
          console.warn('Failed to load referral partners (authorization issue expected for non-admin users):', referralError);
          // This is expected for Team Members and Managers - they won't be able to select referral partners
          // but the form will still work for creating leads with other sources
        }
      }

      // If critical options failed to load, show error
      if (hasErrors) {
        setError('Some form options failed to load. You may still be able to create leads, but some dropdowns might be incomplete.');
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

      // Try to match referredBy with a Referral Partner
      // This will be handled after referral partners are loaded
      setReferredByUserId(null);
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
    
    // If lead source changes and it's not "Referral", clear referredBy fields
    if (name === 'leadSourceId') {
      const selectedSource = leadSources.find(s => s.leadSourceId.toString() === value);
      if (selectedSource && selectedSource.name.toLowerCase() !== 'referral') {
        setFormData(prev => ({ ...prev, referredBy: '' }));
        setReferredByUserId(null);
        setShowReferralPartnerDropdown(false);
      }
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Combobox handlers for Referred By field
  const handleReferredByChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, referredBy: value }));
    
    // Filter Referral Partners based on typed text
    if (value.trim()) {
      const filtered = referralPartners.filter(rp =>
        rp.fullName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredReferralPartners(filtered);
      setShowReferralPartnerDropdown(filtered.length > 0);
    } else {
      setFilteredReferralPartners(referralPartners);
      setShowReferralPartnerDropdown(false);
    }
    
    // Clear referredByUserId when user types (free text mode)
    setReferredByUserId(null);
    
    // Clear error for this field
    if (errors.referredBy) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.referredBy;
        return newErrors;
      });
    }
  };

  const handleReferredByFocus = () => {
    if (isReferralSource() && !isReferralPartner && referralPartners.length > 0) {
      const searchText = formData.referredBy.trim();
      if (searchText) {
        const filtered = referralPartners.filter(rp =>
          rp.fullName.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredReferralPartners(filtered);
        setShowReferralPartnerDropdown(filtered.length > 0);
      } else {
        setFilteredReferralPartners(referralPartners);
        setShowReferralPartnerDropdown(true);
      }
    }
  };

  const handleReferredByBlur = () => {
    // Delay hiding dropdown to allow click on dropdown items
    setTimeout(() => {
      setShowReferralPartnerDropdown(false);
    }, 200);
  };

  const handleSelectReferralPartner = (rp: User) => {
    setFormData(prev => ({ ...prev, referredBy: rp.fullName }));
    setReferredByUserId(rp.userId);
    setShowReferralPartnerDropdown(false);
    
    // Clear error for this field
    if (errors.referredBy) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.referredBy;
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

    // Skip Lead Source and Referred By validation in edit mode (fields are hidden)
    if (!isEditMode) {
      if (!formData.leadSourceId) {
        newErrors.leadSourceId = 'Lead source is required';
      }

      // Validate ReferredBy if source is "Referral"
      if (isReferralSource() && !formData.referredBy.trim()) {
        newErrors.referredBy = 'Referred by is required for referral leads';
      }
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
      // Validate leadSourceId before parsing (skip in edit mode as field is hidden)
      if (!isEditMode && (!formData.leadSourceId || isNaN(parseInt(formData.leadSourceId)))) {
        setError('Please select a lead source');
        setLoading(false);
        return;
      }

      const baseRequestData = {
        leadDate: formData.leadDate,
        clientName: formData.clientName.trim(),
        companyName: formData.companyName.trim() || undefined,
        mobileNumber: formData.mobileNumber.trim(),
        emailAddress: formData.emailAddress.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        leadSourceId: parseInt(formData.leadSourceId),
        referredBy: isReferralPartner && user?.fullName 
          ? user.fullName 
          : (isReferralSource() && formData.referredBy.trim() ? formData.referredBy.trim() : undefined),
        referredByUserId: isReferralPartner 
          ? user?.userId 
          : (isReferralSource() && referredByUserId ? referredByUserId : undefined),
        interestedIn: formData.interestedIn.trim() || undefined,
        expectedBudget: formData.expectedBudget ? parseFloat(formData.expectedBudget) : undefined,
        urgencyLevelId: formData.urgencyLevelId && formData.urgencyLevelId !== '' 
          ? parseInt(formData.urgencyLevelId) 
          : undefined,
        // For Team Members, always assign to themselves
        assignedToUserId: isTeamMember && user
          ? user.userId
          : (formData.assignedToUserId && formData.assignedToUserId !== '' 
              ? parseInt(formData.assignedToUserId) 
              : undefined),
        followupDate: formData.followupDate || undefined,
        notes: formData.notes.trim() || undefined
      };

      let response;
      if (isEditMode && lead) {
        // For update, preserve Lead Source and Referred By from original lead (fields are hidden in edit mode)
        // baseRequestData already has conditional logic for referredBy based on isReferralSource()
        // formData.leadSourceId is set from lead.leadSourceId when loading, so isReferralSource() works correctly
        const updateData = {
          ...baseRequestData,
          leadSourceId: lead.leadSourceId, // Explicitly use original lead's leadSourceId
          leadStatusId: formData.leadStatusId ? parseInt(formData.leadStatusId) : lead.leadStatusId
        };
        console.log('📤 [AddLeadModal] Update lead request:', updateData);
        response = await updateLead(lead.leadId, updateData);
      } else {
        // For create, leadStatusId is optional
        const createData = {
          ...baseRequestData,
          leadStatusId: formData.leadStatusId ? parseInt(formData.leadStatusId) : undefined
        };
        console.log('📤 [AddLeadModal] Create lead request:', createData);
        console.log('📤 [AddLeadModal] User role:', userRole, 'isReferralPartner:', isReferralPartner);
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
          // Reset combobox state
          setReferredByUserId(null);
          setShowReferralPartnerDropdown(false);
          setFilteredReferralPartners(referralPartners);
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
      console.error('❌ [AddLeadModal] Create lead error:', err);
      console.error('❌ [AddLeadModal] Error response:', err.response?.data);
      console.error('❌ [AddLeadModal] Error status:', err.response?.status);
      console.error('❌ [AddLeadModal] Form data:', formData);
      console.error('❌ [AddLeadModal] User:', user);
      
      const errorMessage = err.response?.data?.message || 
        err.response?.data?.error ||
        err.message ||
        'An error occurred while creating the lead. Please try again.';
      
      setError(errorMessage);
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
        <Modal.Title className="fw-semibold">
          {isEditMode ? (isLeadReadonly ? 'View Lead (Read Only)' : 'Edit Lead') : 'Add New Lead'}
        </Modal.Title>
        {isLeadReadonly && (
          <Badge bg="secondary" className="ms-2">Read Only</Badge>
        )}
      </Modal.Header>

      <Form onSubmit={isLeadReadonly ? (e) => e.preventDefault() : handleSubmit} key={isEditMode ? `edit-${lead?.leadId}` : 'add'}>
        <Modal.Body className="px-4" ref={modalBodyRef} onScroll={closeDatePickers}>
          {isLeadReadonly && (
            <Alert variant="info" className="mb-3">
              <strong>Read Only:</strong> This lead cannot be edited. It is displayed for reference only.
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
                    {/* Lead Source - Hide in edit mode */}
                    {!isEditMode && (
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
                            disabled={loading || isReferralPartner}
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
                          {isReferralPartner && (
                            <Form.Text className="text-muted small">
                              Automatically set to "Referral" for Referral Partners.
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    )}

                    <Col xs={12} md={isEditMode ? 12 : 6}>
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


                  {/* ReferredBy field - Show for Referral source or when user is RP, but hide in edit mode */}
                  {!isEditMode && (isReferralSource() || isReferralPartner) && (
                    <Row className="g-3">
                      <Col xs={12}>
                        <Form.Group className="mb-3" style={{ position: 'relative' }}>
                          <Form.Label className="fw-medium">
                            Referred By <span className="text-danger">*</span>
                          </Form.Label>
                          {isReferralPartner ? (
                            // Readonly field for Referral Partners
                            <>
                              <Form.Control
                                type="text"
                                size="sm"
                                name="referredBy"
                                value={formData.referredBy}
                                readOnly
                                disabled
                                maxLength={100}
                              />
                              <Form.Text className="text-muted small">
                                Auto-populated with your name as the referrer.
                              </Form.Text>
                            </>
                          ) : (
                            // Combobox for non-Referral Partners
                            <>
                              <InputGroup>
                                <Form.Control
                                  ref={referredByInputRef}
                                  type="text"
                                  size="sm"
                                  name="referredBy"
                                  value={formData.referredBy}
                                  onChange={handleReferredByChange}
                                  onFocus={handleReferredByFocus}
                                  onBlur={handleReferredByBlur}
                                  placeholder={
                                    referralPartners.length > 0
                                      ? "Type to search Referral Partners or enter free text"
                                      : "Enter referrer name (free text only - no partner selection available)"
                                  }
                                  isInvalid={!!errors.referredBy}
                                  disabled={loading}
                                  maxLength={100}
                                  autoComplete="off"
                                />
                                <Form.Control.Feedback type="invalid">
                                  {errors.referredBy}
                                </Form.Control.Feedback>
                              </InputGroup>
                              {referralPartners.length === 0 && (
                                <Form.Text className="text-warning small d-block mt-1">
                                  <i className="bi bi-info-circle me-1"></i>
                                  Referral Partner selection is not available for your user role. You can enter the referrer name manually.
                                </Form.Text>
                              )}
                              {showReferralPartnerDropdown && filteredReferralPartners.length > 0 && (
                                <div
                                  ref={dropdownRef}
                                  className="border rounded shadow-sm bg-white"
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 1050,
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    marginTop: '2px'
                                  }}
                                >
                                  {filteredReferralPartners.map((rp) => (
                                    <div
                                      key={rp.userId}
                                      className="px-3 py-2 hover-bg-light"
                                      style={{
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #e9ecef'
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent blur event
                                        handleSelectReferralPartner(rp);
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'white';
                                      }}
                                    >
                                      <div className="fw-medium">{rp.fullName}</div>
                                      <div className="text-muted small">{rp.email}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {showReferralPartnerDropdown && filteredReferralPartners.length === 0 && formData.referredBy.trim() && (
                                <div
                                  className="border rounded shadow-sm bg-white px-3 py-2 text-muted small"
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 1050,
                                    marginTop: '2px'
                                  }}
                                >
                                  No matching Referral Partners found. You can enter free text.
                                </div>
                              )}
                              {referredByUserId && (
                                <Form.Text className="text-success small d-block mt-1">
                                  Selected Referral Partner
                                </Form.Text>
                              )}
                              {!referredByUserId && formData.referredBy.trim() && (
                                <Form.Text className="text-muted small d-block mt-1">
                                  Free text entry
                                </Form.Text>
                              )}
                            </>
                          )}
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
                      {/* Hide Assign To field completely for Referral Partners */}
                      {!isReferralPartner && (
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
                      )}

                      <Col xs={12} md={isReferralPartner ? 12 : 6}>
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
              disabled={loading || loadingOptions || isLeadReadonly}
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
                <i className={`bi bi-${isLeadReadonly ? 'eye' : (isEditMode ? 'pencil' : 'plus-circle')} me-2`}></i>
                {isLeadReadonly ? 'View Only' : (isEditMode ? 'Update Lead' : 'Create Lead')}
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
