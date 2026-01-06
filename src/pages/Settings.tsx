import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Alert, Form, Button, Spinner, Image, Table, Badge, Modal } from 'react-bootstrap';
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import StrictModeDroppable from '../components/StrictModeDroppable';
import { Settings as SettingsIcon, Building, Database, BarChart3, Mail, Upload, X, Save, Plus, Edit2, Trash2, Check, X as XIcon, ToggleLeft, ToggleRight, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getCompanySettings,
  updateCompanySettings,
  CompanySettings,
  getLeadSources,
  createLeadSource,
  updateLeadSource,
  deleteLeadSource,
  seedCompanyData,
  LeadSource,
  CreateLeadSourceData,
  UpdateLeadSourceData,
  getLeadStatuses,
  createLeadStatus,
  updateLeadStatus,
  deleteLeadStatus,
  reorderLeadStatuses,
  LeadStatus,
  CreateLeadStatusData,
  UpdateLeadStatusData,
  LeadStatusReorderData,
  getEmailSettings,
  updateEmailSettings,
  testEmailSettings,
  EmailSettings,
  UpdateEmailSettingsData,
} from '../services/settingsService';
import { useToast } from '../components/Toast';

// Determine backend URL based on current hostname
const getBackendURL = (): string => {
  const currentHost = window.location.hostname;

  // If accessing via localhost, use localhost backend
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return "http://localhost:5000";
  }

  // If accessing via network IP, use the same IP for backend
  return `http://${currentHost}:5000`;
};

// Backend base URL for constructing full image URLs
const BACKEND_BASE_URL = getBackendURL();

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [activeTab, setActiveTab] = useState('company');

  // Company Settings state
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    size: '',
    website: '',
    phone: ''
  });

  // Lead Sources state
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadSourcesLoading, setLeadSourcesLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSource, setEditingSource] = useState<LeadSource | null>(null);
  const [deletingSource, setDeletingSource] = useState<LeadSource | null>(null);
  const [newSourceName, setNewSourceName] = useState('');
  const [editSourceName, setEditSourceName] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Lead Statuses state
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [leadStatusesLoading, setLeadStatusesLoading] = useState(false);
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState<LeadStatus | null>(null);
  const [deletingStatus, setDeletingStatus] = useState<LeadStatus | null>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusOrder, setNewStatusOrder] = useState(0);
  const [editStatusName, setEditStatusName] = useState('');
  const [editStatusOrder, setEditStatusOrder] = useState(0);

  // Email Settings state
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [emailSettingsLoading, setEmailSettingsLoading] = useState(false);
  const [emailSettingsSaving, setEmailSettingsSaving] = useState(false);
  const [emailSettingsTesting, setEmailSettingsTesting] = useState(false);

  // Email form state
  const [emailFormData, setEmailFormData] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    confirmPassword: '',
    fromEmail: '',
    fromName: '',
    enableSsl: true,
    isActive: true
  });

  // Load company settings on component mount
  useEffect(() => {
    loadCompanySettings();
  }, []);

  // Load lead sources when tab changes to lead-sources
  useEffect(() => {
    if (activeTab === 'lead-sources') {
      loadLeadSources();
    }
  }, [activeTab]);

  // Load lead statuses when tab changes to lead-statuses
  useEffect(() => {
    if (activeTab === 'lead-statuses') {
      loadLeadStatuses();
    }
  }, [activeTab]);

  // Load email settings when tab changes to email
  useEffect(() => {
    if (activeTab === 'email') {
      loadEmailSettings();
    }
  }, [activeTab]);

  const loadCompanySettings = async () => {
    try {
      setLoading(true);
      console.log('Loading company settings...');
      const response = await getCompanySettings();
      console.log('API Response:', response);
      if (response.success && response.data) {
        setCompanySettings(response.data);
        setFormData({
          companyName: response.data.companyName,
          industry: response.data.industry || '',
          size: response.data.size || '',
          website: response.data.website || '',
          phone: response.data.phone || ''
        });
        // Construct full logo URL if logo exists (relative path needs backend base URL)
        const fullLogoUrl = response.data.logo ? `${BACKEND_BASE_URL}${response.data.logo}` : null;
        setLogoPreview(fullLogoUrl);
        console.log('Logo URL:', response.data.logo, '-> Full URL:', fullLogoUrl);
      } else {
        showError('Error', response.message || 'Failed to load company settings');
      }
    } catch (error) {
      showError('Error', 'Failed to load company settings');
      console.error('Error loading company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        showError('File Validation', 'Please select a valid image file (JPG, PNG, GIF, or SVG)');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showError('File Size', 'File size must be less than 2MB');
        return;
      }

      setLogoFile(file);
      showSuccess('Logo Selected', `File "${file.name}" ready to upload`);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    // Restore original logo with full URL if it exists
    const originalLogoUrl = companySettings?.logo ? `${BACKEND_BASE_URL}${companySettings.logo}` : null;
    setLogoPreview(originalLogoUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showInfo('Logo Cleared', 'New logo selection removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate company name
    if (!formData.companyName.trim()) {
      showError('Validation Error', 'Company name is required');
      return;
    }

    try {
      setSaving(true);
      
      // Show saving notification
      showInfo('Saving', 'Saving company settings...');

      const updateData = {
        companyName: formData.companyName,
        industry: formData.industry || undefined,
        size: formData.size || undefined,
        website: formData.website || undefined,
        phone: formData.phone || undefined,
        logoFile: logoFile || undefined
      };

      const response = await updateCompanySettings(updateData);

      if (response.success) {
        // Build list of what was updated
        const updatedFields = [];
        if (response.data.companyName !== companySettings?.companyName) updatedFields.push('Company Name');
        if (response.data.industry !== companySettings?.industry) updatedFields.push('Industry');
        if (response.data.size !== companySettings?.size) updatedFields.push('Company Size');
        if (response.data.website !== companySettings?.website) updatedFields.push('Website');
        if (response.data.phone !== companySettings?.phone) updatedFields.push('Phone');
        if (logoFile || response.data.logo !== companySettings?.logo) updatedFields.push('Logo');

        setCompanySettings(response.data);
        setLogoFile(null); // Clear the selected file after successful upload

        // Update logo preview with full URL if logo was updated
        if (response.data.logo) {
          const fullLogoUrl = `${BACKEND_BASE_URL}${response.data.logo}`;
          setLogoPreview(fullLogoUrl);
          console.log('Updated logo URL:', fullLogoUrl);
        }

        // Show success notification with details
        if (updatedFields.length > 0) {
          showSuccess('Settings Saved', `Successfully updated: ${updatedFields.join(', ')}`);
        } else {
          showSuccess('Settings Saved', 'Company settings saved successfully');
        }
      } else {
        showError('Save Failed', response.message || 'Failed to save company settings');
      }
    } catch (error) {
      showError('Error', 'Failed to save company settings. Please try again.');
      console.error('Error updating company settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Lead Sources functions
  const loadLeadSources = async () => {
    try {
      setLeadSourcesLoading(true);
      const response = await getLeadSources();
      if (response.success && response.data) {
        setLeadSources(response.data);
      } else {
        showError('Error', response.message || 'Failed to load lead sources');
      }
    } catch (error) {
      showError('Error', 'Failed to load lead sources');
      console.error('Error loading lead sources:', error);
    } finally {
      setLeadSourcesLoading(false);
    }
  };

  const loadLeadStatuses = async () => {
    try {
      console.log('Loading lead statuses...');
      setLeadStatusesLoading(true);
      const response = await getLeadStatuses();
      console.log('Lead statuses response:', response);
      if (response.success && response.data) {
        setLeadStatuses(response.data);
        console.log('Lead statuses loaded:', response.data.length);
      } else {
        showError('Error', response.message || 'Failed to load lead statuses');
      }
    } catch (error) {
      showError('Error', 'Failed to load lead statuses');
      console.error('Error loading lead statuses:', error);
    } finally {
      setLeadStatusesLoading(false);
    }
  };

  const loadEmailSettings = async () => {
    try {
      setEmailSettingsLoading(true);
      console.log('Loading email settings...');
      const response = await getEmailSettings();
      console.log('Email settings response:', response);
      if (response.success && response.data) {
        setEmailSettings(response.data);
        setEmailFormData({
          smtpHost: response.data.smtpHost,
          smtpPort: response.data.smtpPort,
          smtpUsername: response.data.smtpUsername,
          smtpPassword: '',
          confirmPassword: '',
          fromEmail: response.data.fromEmail,
          fromName: response.data.fromName,
          enableSsl: response.data.enableSsl,
          isActive: response.data.isActive
        });
        console.log('Email settings loaded successfully');
      } else {
        // If no email settings exist, keep default form values
        console.log('No email settings found, using default form values');
      }
    } catch (error: any) {
      // If 404, settings don't exist yet - that's okay, use default form values
      if (error.response?.status === 404) {
        console.log('Email settings not found, using default form values');
      } else {
        showError('Error', 'Failed to load email settings');
        console.error('Error loading email settings:', error);
      }
    } finally {
      setEmailSettingsLoading(false);
    }
  };

  const handleCreateLeadSource = async () => {
    if (!newSourceName.trim()) {
      showError('Validation Error', 'Lead source name is required');
      return;
    }

    try {
      const data: CreateLeadSourceData = { name: newSourceName.trim() };
      const response = await createLeadSource(data);

      if (response.success) {
        showSuccess('Success', 'Lead source created successfully');
        setShowAddModal(false);
        setNewSourceName('');
        await loadLeadSources();
      } else {
        showError('Error', response.message || 'Failed to create lead source');
      }
    } catch (error) {
      showError('Error', 'Failed to create lead source');
      console.error('Error creating lead source:', error);
    }
  };

  const handleUpdateLeadSource = async (source: LeadSource, newName: string, isActive: boolean) => {
    if (!newName.trim()) {
      showError('Validation Error', 'Lead source name is required');
      return;
    }

    try {
      const data: UpdateLeadSourceData = { name: newName.trim(), isActive };
      const response = await updateLeadSource(source.leadSourceId, data);

      if (response.success) {
        showSuccess('Success', 'Lead source updated successfully');
        setEditingSource(null);
        setEditSourceName('');
        await loadLeadSources();
      } else {
        showError('Error', response.message || 'Failed to update lead source');
      }
    } catch (error) {
      showError('Error', 'Failed to update lead source');
      console.error('Error updating lead source:', error);
    }
  };

  const handleDeleteLeadSource = async (source: LeadSource) => {
    try {
      const response = await deleteLeadSource(source.leadSourceId);

      if (response.success) {
        showSuccess('Success', 'Lead source deleted successfully');
        setDeletingSource(null);
        await loadLeadSources();
      } else {
        showError('Error', response.message || 'Failed to delete lead source');
      }
    } catch (error) {
      showError('Error', 'Failed to delete lead source');
      console.error('Error deleting lead source:', error);
    }
  };

  const startEditing = (source: LeadSource) => {
    setEditingSource(source);
    setEditSourceName(source.name);
  };

  const cancelEditing = () => {
    setEditingSource(null);
    setEditSourceName('');
  };

  const handleToggleActive = async (source: LeadSource) => {
    await handleUpdateLeadSource(source, source.name, !source.isActive);
  };

  const handleSeedDefaultData = async () => {
    try {
      setSeeding(true);
      showInfo('Seeding', 'Creating default lead sources, statuses, and urgency levels...');

      const response = await seedCompanyData();

      if (response.success) {
        showSuccess('Success', `Default data created: ${response.data.leadSources} lead sources, ${response.data.leadStatuses} lead statuses, ${response.data.urgencyLevels} urgency levels`);
        await loadLeadSources();
        await loadLeadStatuses();
      } else {
        showError('Error', response.message || 'Failed to seed default data');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to seed default data';
      showError('Error', errorMessage);
      console.error('Error seeding default data:', error);
    } finally {
      setSeeding(false);
    }
  };

  // Lead Status handlers
  const handleCreateLeadStatus = async () => {
    if (!newStatusName.trim()) {
      showError('Validation Error', 'Lead status name is required');
      return;
    }

    try {
      const data: CreateLeadStatusData = {
        name: newStatusName.trim(),
        displayOrder: newStatusOrder
      };
      const response = await createLeadStatus(data);

      if (response.success) {
        showSuccess('Success', 'Lead status created successfully');
        setShowAddStatusModal(false);
        setNewStatusName('');
        setNewStatusOrder(0);
        await loadLeadStatuses();
      } else {
        showError('Error', response.message || 'Failed to create lead status');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create lead status';
      showError('Error', errorMessage);
      console.error('Error creating lead status:', error);
    }
  };

  const handleUpdateLeadStatus = async (status: LeadStatus, newName: string, newOrder: number, isActive: boolean) => {
    if (!newName.trim()) {
      showError('Validation Error', 'Lead status name is required');
      return;
    }

    try {
      const data: UpdateLeadStatusData = {
        name: newName.trim(),
        displayOrder: newOrder,
        isActive: isActive
      };
      const response = await updateLeadStatus(status.leadStatusId, data);

      if (response.success) {
        showSuccess('Success', 'Lead status updated successfully');
        cancelEditingStatus();
        await loadLeadStatuses();
      } else {
        showError('Error', response.message || 'Failed to update lead status');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update lead status';
      showError('Error', errorMessage);
      console.error('Error updating lead status:', error);
    }
  };

  const handleDeleteLeadStatus = async (status: LeadStatus) => {
    try {
      const response = await deleteLeadStatus(status.leadStatusId);

      if (response.success) {
        showSuccess('Success', 'Lead status deleted successfully');
        setDeletingStatus(null);
        await loadLeadStatuses();
      } else {
        showError('Error', response.message || 'Failed to delete lead status');
      }
    } catch (error) {
      showError('Error', 'Failed to delete lead status');
      console.error('Error deleting lead status:', error);
    }
  };

  const handleDragEnd = async (result: any) => {
    console.log('🔄 DRAG END EVENT:', result);
    console.log('Source:', result.source);
    console.log('Destination:', result.destination);

    if (!result.destination) {
      console.log('❌ No destination, returning');
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    const draggableId = result.draggableId;

    console.log(`📍 Moving item ${draggableId} from ${sourceIndex} to ${destinationIndex}`);

    const items = Array.from(leadStatuses);
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destinationIndex, 0, reorderedItem);

    // Update display orders
    const updatedStatuses = items.map((item, index) => ({
      ...item,
      displayOrder: index
    }));

    console.log('Updated statuses:', updatedStatuses);
    setLeadStatuses(updatedStatuses);

    try {
      const reorderData: LeadStatusReorderData = {
        statuses: updatedStatuses.map(status => ({
          leadStatusId: status.leadStatusId,
          displayOrder: status.displayOrder
        }))
      };

      console.log('Sending reorder data:', reorderData);
      const response = await reorderLeadStatuses(reorderData);

      if (response.success) {
        console.log('Reorder successful');
        showSuccess('Success', 'Lead statuses reordered successfully');
        await loadLeadStatuses();
      } else {
        console.log('Reorder failed:', response.message);
        showError('Error', response.message || 'Failed to reorder lead statuses');
        // Revert the local state on error
        await loadLeadStatuses();
      }
    } catch (error: any) {
      console.log('Reorder error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reorder lead statuses';
      showError('Error', errorMessage);
      console.error('Error reordering lead statuses:', error);
      // Revert the local state on error
      await loadLeadStatuses();
    }
  };

  const startEditingStatus = (status: LeadStatus) => {
    setEditingStatus(status);
    setEditStatusName(status.name);
    setEditStatusOrder(status.displayOrder);
  };

  const cancelEditingStatus = () => {
    setEditingStatus(null);
    setEditStatusName('');
    setEditStatusOrder(0);
  };

  const handleToggleStatusActive = async (status: LeadStatus) => {
    await handleUpdateLeadStatus(status, status.name, status.displayOrder, !status.isActive);
  };

  // Email Settings handlers
  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setEmailFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmailNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!emailFormData.smtpHost.trim()) {
      showError('Validation Error', 'SMTP Host is required');
      return;
    }
    if (!emailFormData.smtpUsername.trim()) {
      showError('Validation Error', 'SMTP Username is required');
      return;
    }
    if (!emailFormData.fromEmail.trim()) {
      showError('Validation Error', 'From Email is required');
      return;
    }
    if (!emailFormData.fromName.trim()) {
      showError('Validation Error', 'From Name is required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailFormData.fromEmail)) {
      showError('Validation Error', 'Please enter a valid email address');
      return;
    }

    // Validate password confirmation if password is provided
    if (emailFormData.smtpPassword && emailFormData.smtpPassword !== emailFormData.confirmPassword) {
      showError('Validation Error', 'Passwords do not match');
      return;
    }

    try {
      setEmailSettingsSaving(true);
      showInfo('Saving', 'Saving email settings...');

      const updateData: UpdateEmailSettingsData = {
        smtpHost: emailFormData.smtpHost.trim(),
        smtpPort: emailFormData.smtpPort,
        smtpUsername: emailFormData.smtpUsername.trim(),
        fromEmail: emailFormData.fromEmail.trim(),
        fromName: emailFormData.fromName.trim(),
        enableSsl: emailFormData.enableSsl,
        isActive: emailFormData.isActive
      };

      // Only include password if it was provided
      if (emailFormData.smtpPassword) {
        updateData.smtpPassword = emailFormData.smtpPassword;
      }

      const response = await updateEmailSettings(updateData);

      if (response.success) {
        setEmailSettings(response.data);
        // Clear password fields after successful save
        setEmailFormData(prev => ({
          ...prev,
          smtpPassword: '',
          confirmPassword: ''
        }));
        showSuccess('Success', 'Email settings saved successfully');
      } else {
        showError('Save Failed', response.message || 'Failed to save email settings');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save email settings';
      showError('Error', errorMessage);
      console.error('Error saving email settings:', error);
    } finally {
      setEmailSettingsSaving(false);
    }
  };

  const handleTestEmailSettings = async () => {
    try {
      setEmailSettingsTesting(true);
      showInfo('Testing', 'Sending test email...');

      const response = await testEmailSettings();

      if (response.success) {
        showSuccess('Test Email Sent', 'Test email sent successfully. Please check your inbox.');
      } else {
        showError('Test Failed', response.message || 'Failed to send test email');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send test email';
      showError('Error', errorMessage);
      console.error('Error testing email settings:', error);
    } finally {
      setEmailSettingsTesting(false);
    }
  };

  // Check if user has admin access
  if (user?.roleName !== 'Company Admin' && user?.roleName !== 'System Admin') {
    return (
      <Container fluid className="py-4">
        <Row>
          <Col>
            <Alert variant="danger">
              <h4>Access Denied</h4>
              <p>You don't have permission to access this page. Only Administrators can manage settings.</p>
              <p>Please contact your administrator if you need access to this feature.</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <div className="d-flex align-items-center mb-4">
            <SettingsIcon size={24} className="me-2 text-primary" />
            <h2 className="mb-0">Settings</h2>
          </div>

          <Card className="shadow-sm">
            <Card.Header className="bg-white border-bottom-0">
              <Nav variant="tabs" activeKey={activeTab} onSelect={(key) => setActiveTab(key || 'company')}>
                <Nav.Item>
                  <Nav.Link eventKey="company" className="d-flex align-items-center">
                    <Building size={16} className="me-2" />
                    Company Settings
                  </Nav.Link>
                </Nav.Item>
                {user?.roleName === 'System Admin' && (
                  <>
                    <Nav.Item>
                      <Nav.Link eventKey="lead-sources" className="d-flex align-items-center">
                        <Database size={16} className="me-2" />
                        Lead Sources
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="lead-statuses" className="d-flex align-items-center">
                        <BarChart3 size={16} className="me-2" />
                        Lead Statuses
                      </Nav.Link>
                    </Nav.Item>
                  </>
                )}
                <Nav.Item>
                  <Nav.Link eventKey="email" className="d-flex align-items-center">
                    <Mail size={16} className="me-2" />
                    Email Settings
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>

            <Card.Body className="p-0">
              <Tab.Content>
                <Tab.Pane eventKey="company" active={activeTab === 'company'}>
                  {/* Company Settings Tab Content */}
                  <div className="p-4">
                    <h4 className="mb-3">Company Information</h4>
                    <p className="text-muted">Configure your company details and logo.</p>

                    {loading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" />
                        <p className="mt-2">Loading company settings...</p>
                      </div>
                    ) : (
                      <Form onSubmit={handleSubmit}>
                        <Row>
                          <Col md={8}>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Company Name *</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter company name"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Industry</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Technology, Healthcare"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>

                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Company Size</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="size"
                                    value={formData.size}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 1-10, 11-50, 51-200"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Phone</Form.Label>
                                  <Form.Control
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="e.g., +1 (555) 123-4567"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>

                            <Form.Group className="mb-3">
                              <Form.Label>Website</Form.Label>
                              <Form.Control
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleInputChange}
                                placeholder="https://www.example.com"
                              />
                            </Form.Group>
                          </Col>

                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Company Logo</Form.Label>
                              <div className="text-center">
                                {logoPreview ? (
                                  <div className="mb-3">
                                    <Image
                                      src={logoPreview}
                                      alt="Company Logo"
                                      rounded
                                      style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }}
                                      className="border"
                                    />
                                    <div className="mt-2">
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={handleRemoveLogo}
                                      >
                                        <X size={14} className="me-1" />
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className="border border-2 border-dashed rounded p-4 mb-3"
                                    style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <div className="text-muted">
                                      <Upload size={32} className="mb-2 d-block mx-auto" />
                                      <small>No logo uploaded</small>
                                    </div>
                                  </div>
                                )}

                                <Form.Control
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoSelect}
                                  className="d-none"
                                />
                                <Button
                                  variant="outline-primary"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={saving}
                                >
                                  <Upload size={14} className="me-1" />
                                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                </Button>
                                <Form.Text className="text-muted d-block mt-1">
                                  Max 2MB. JPG, PNG, GIF, or SVG only.
                                </Form.Text>
                              </div>
                            </Form.Group>
                          </Col>
                        </Row>

                        <div className="d-flex justify-content-end">
                          <Button
                            type="submit"
                            variant="primary"
                            disabled={saving || !formData.companyName.trim()}
                          >
                            {saving ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  className="me-2"
                                />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save size={14} className="me-1" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </Form>
                    )}
                  </div>
                </Tab.Pane>

                <Tab.Pane eventKey="lead-sources" active={activeTab === 'lead-sources'}>
                  <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h4 className="mb-1">Lead Sources</h4>
                        <p className="text-muted mb-0">Manage the lead sources available in your system.</p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => setShowAddModal(true)}
                        className="d-flex align-items-center"
                      >
                        <Plus size={16} className="me-2" />
                        Add New Source
                      </Button>
                    </div>

                    {leadSourcesLoading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" />
                        <p className="mt-2">Loading lead sources...</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        {/* Mobile Card View (xs/sm screens) */}
                        <div className="d-block d-md-none">
                          {leadSources.length === 0 ? (
                            <div className="text-center py-5 p-3">
                              <div className="text-muted mb-3">
                                <Database size={48} className="mb-3 opacity-50" />
                                <h5>No Lead Sources Found</h5>
                                <p className="mb-3">Get started by seeding default lead sources or creating your own.</p>
                              </div>
                              <div className="d-flex flex-column gap-2">
                                <Button
                                  variant="primary"
                                  onClick={handleSeedDefaultData}
                                  disabled={seeding}
                                  className="w-100"
                                >
                                  {seeding ? (
                                    <>
                                      <Spinner animation="border" size="sm" className="me-2" />
                                      Seeding...
                                    </>
                                  ) : (
                                    <>
                                      <Database size={16} className="me-2" />
                                      Seed Default Data
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline-secondary"
                                  onClick={() => setShowAddModal(true)}
                                  className="w-100"
                                >
                                  <Plus size={16} className="me-2" />
                                  Add Manually
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="row g-3">
                              {leadSources.map((source) => (
                                <div key={source.leadSourceId} className="col-12">
                                  <Card className="h-100 shadow-sm">
                                    <Card.Body className="p-3">
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div className="flex-grow-1">
                                          {editingSource?.leadSourceId === source.leadSourceId ? (
                                            <Form.Control
                                              type="text"
                                              value={editSourceName}
                                              onChange={(e) => setEditSourceName(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  handleUpdateLeadSource(source, editSourceName, source.isActive);
                                                } else if (e.key === 'Escape') {
                                                  cancelEditing();
                                                }
                                              }}
                                              autoFocus
                                              maxLength={50}
                                              className="mb-2"
                                            />
                                          ) : (
                                            <h6 className="mb-1 text-truncate" title={source.name}>
                                              {source.name}
                                            </h6>
                                          )}
                                        </div>
                                        <Badge bg={source.isActive ? 'success' : 'secondary'} className="ms-2 flex-shrink-0">
                                          {source.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </div>

                                      <div className="row g-2 text-sm">
                                        <div className="col-6">
                                          <small className="text-muted d-block"><i className="bi bi-calendar-check me-1"></i>Created</small>
                                          <span>{source.createdDate ? new Date(source.createdDate).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="col-6">
                                          <small className="text-muted d-block"><i className="bi bi-hash me-1"></i>ID</small>
                                          <span>{source.leadSourceId}</span>
                                        </div>
                                      </div>

                                      {/* Action buttons for mobile */}
                                      <div className="d-flex gap-2 mt-3 pt-2 border-top">
                                        {editingSource?.leadSourceId === source.leadSourceId ? (
                                          <>
                                            <Button
                                              variant="outline-success"
                                              size="sm"
                                              onClick={() => handleUpdateLeadSource(source, editSourceName, source.isActive)}
                                              className="flex-fill"
                                            >
                                              <Check size={14} className="me-1" />
                                              Save
                                            </Button>
                                            <Button
                                              variant="outline-secondary"
                                              size="sm"
                                              onClick={cancelEditing}
                                              className="flex-fill"
                                            >
                                              <XIcon size={14} className="me-1" />
                                              Cancel
                                            </Button>
                                          </>
                                        ) : (
                                          <>
                                            <Button
                                              variant="outline-primary"
                                              size="sm"
                                              onClick={() => startEditing(source)}
                                              className="flex-fill"
                                            >
                                              <Edit2 size={14} className="me-1" />
                                              Edit
                                            </Button>
                                            <Button
                                              variant="outline-warning"
                                              size="sm"
                                              onClick={() => handleToggleActive(source)}
                                              className="flex-fill"
                                            >
                                              {source.isActive ? <ToggleRight size={14} className="me-1" /> : <ToggleLeft size={14} className="me-1" />}
                                              {source.isActive ? 'Deactivate' : 'Activate'}
                                            </Button>
                                            <Button
                                              variant="outline-danger"
                                              size="sm"
                                              onClick={() => handleDeleteLeadSource(source)}
                                              className="flex-fill"
                                            >
                                              <Trash2 size={14} className="me-1" />
                                              Delete
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Desktop Table View (md+ screens) */}
                        <div className="d-none d-md-block">
                          <Table hover className="mb-0">
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: '40%' }}>Name</th>
                                <th style={{ width: '20%' }}>Status</th>
                                <th style={{ width: '25%' }}>Created</th>
                                <th style={{ width: '15%' }} className="text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leadSources.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center py-5">
                                  <div className="text-muted mb-3">
                                    <Database size={48} className="mb-3 opacity-50" />
                                    <h5>No Lead Sources Found</h5>
                                    <p className="mb-3">Get started by seeding default lead sources or creating your own.</p>
                                  </div>
                                  <div className="d-flex justify-content-center gap-2">
                                    <Button
                                      variant="primary"
                                      onClick={handleSeedDefaultData}
                                      disabled={seeding}
                                    >
                                      {seeding ? (
                                        <>
                                          <Spinner animation="border" size="sm" className="me-2" />
                                          Seeding...
                                        </>
                                      ) : (
                                        <>
                                          <Database size={16} className="me-2" />
                                          Seed Default Data
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline-secondary"
                                      onClick={() => setShowAddModal(true)}
                                    >
                                      <Plus size={16} className="me-2" />
                                      Add Manually
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              leadSources.map((source) => (
                                <tr key={source.leadSourceId}>
                                  <td>
                                    {editingSource?.leadSourceId === source.leadSourceId ? (
                                      <Form.Control
                                        type="text"
                                        value={editSourceName}
                                        onChange={(e) => setEditSourceName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleUpdateLeadSource(source, editSourceName, source.isActive);
                                          } else if (e.key === 'Escape') {
                                            cancelEditing();
                                          }
                                        }}
                                        autoFocus
                                        maxLength={50}
                                      />
                                    ) : (
                                      <span>{source.name}</span>
                                    )}
                                  </td>
                                  <td>
                                    <Badge bg={source.isActive ? 'success' : 'secondary'}>
                                      {source.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </td>
                                  <td>
                                    {source.createdDate ? new Date(source.createdDate).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="text-center">
                                    <div className="d-flex justify-content-center gap-2">
                                      {editingSource?.leadSourceId === source.leadSourceId ? (
                                        <>
                                          <Button
                                            variant="outline-success"
                                            size="sm"
                                            onClick={() => handleUpdateLeadSource(source, editSourceName, source.isActive)}
                                          >
                                            <Check size={14} />
                                          </Button>
                                          <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={cancelEditing}
                                          >
                                            <XIcon size={14} />
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => startEditing(source)}
                                            title="Edit name"
                                          >
                                            <Edit2 size={14} />
                                          </Button>
                                          <Button
                                            variant="outline-warning"
                                            size="sm"
                                            onClick={() => handleToggleActive(source)}
                                            title={source.isActive ? 'Deactivate' : 'Activate'}
                                          >
                                            {source.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                          </Button>
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => setDeletingSource(source)}
                                            title="Delete"
                                          >
                                            <Trash2 size={14} />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Add New Source Modal */}
                    <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                      <Modal.Header closeButton>
                        <Modal.Title>Add New Lead Source</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Form.Group>
                          <Form.Label>Source Name *</Form.Label>
                          <Form.Control
                            type="text"
                            value={newSourceName}
                            onChange={(e) => setNewSourceName(e.target.value)}
                            placeholder="Enter lead source name"
                            maxLength={50}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateLeadSource();
                              }
                            }}
                          />
                          <Form.Text className="text-muted">
                            Maximum 50 characters
                          </Form.Text>
                        </Form.Group>
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleCreateLeadSource}
                          disabled={!newSourceName.trim()}
                        >
                          Create Source
                        </Button>
                      </Modal.Footer>
                    </Modal>

                    {/* Delete Confirmation Modal */}
                    <Modal show={!!deletingSource} onHide={() => setDeletingSource(null)}>
                      <Modal.Header closeButton>
                        <Modal.Title>Delete Lead Source</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <p>Are you sure you want to delete the lead source <strong>"{deletingSource?.name}"</strong>?</p>
                        <Alert variant="warning">
                          <strong>Note:</strong> This action cannot be undone. If this lead source is being used by existing leads, it will be deactivated instead of deleted.
                        </Alert>
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" onClick={() => setDeletingSource(null)}>
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => deletingSource && handleDeleteLeadSource(deletingSource)}
                        >
                          Delete
                        </Button>
                      </Modal.Footer>
                    </Modal>
                  </div>
                </Tab.Pane>

                <Tab.Pane eventKey="lead-statuses" active={activeTab === 'lead-statuses'}>
                  <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h4 className="mb-1">Lead Statuses</h4>
                        <p className="text-muted mb-0">Configure lead statuses and their display order.</p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => setShowAddStatusModal(true)}
                        className="d-flex align-items-center"
                      >
                        <Plus size={16} className="me-2" />
                        Add New Status
                      </Button>
                    </div>

                    {leadStatusesLoading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" />
                        <p className="mt-2">Loading lead statuses...</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        {/* Mobile Card View (xs/sm screens) */}
                        <div className="d-block d-md-none">
                          {leadStatuses.length === 0 ? (
                            <div className="text-center py-5 p-3">
                              <div className="text-muted mb-3">
                                <Database size={48} className="mb-3 opacity-50" />
                                <h5>No Lead Statuses Found</h5>
                                <p className="mb-3">Get started by seeding default lead statuses or creating your own.</p>
                              </div>
                              <div className="d-flex flex-column gap-2">
                                <Button
                                  variant="primary"
                                  onClick={handleSeedDefaultData}
                                  disabled={seeding}
                                  className="w-100"
                                >
                                  {seeding ? (
                                    <>
                                      <Spinner animation="border" size="sm" className="me-2" />
                                      Seeding...
                                    </>
                                  ) : (
                                    <>
                                      <Database size={16} className="me-2" />
                                      Seed Default Data
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline-secondary"
                                  onClick={() => setShowAddStatusModal(true)}
                                  className="w-100"
                                >
                                  <Plus size={16} className="me-2" />
                                  Add Manually
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="row g-3">
                              {leadStatuses.map((status, index) => (
                                <div key={status.leadStatusId} className="col-12">
                                  <Card className="h-100 shadow-sm">
                                    <Card.Body className="p-3">
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div className="flex-grow-1">
                                          {editingStatus?.leadStatusId === status.leadStatusId ? (
                                            <Form.Control
                                              type="text"
                                              value={editStatusName}
                                              onChange={(e) => setEditStatusName(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  handleUpdateLeadStatus(status, editStatusName, editStatusOrder, status.isActive);
                                                } else if (e.key === 'Escape') {
                                                  cancelEditingStatus();
                                                }
                                              }}
                                              autoFocus
                                              maxLength={50}
                                              className="mb-2"
                                            />
                                          ) : (
                                            <h6 className="mb-1 text-truncate" title={status.name}>
                                              {status.name}
                                            </h6>
                                          )}
                                        </div>
                                        <div className="d-flex gap-1">
                                          <Badge bg={status.isActive ? 'success' : 'secondary'} className="ms-2 flex-shrink-0">
                                            {status.isActive ? 'Active' : 'Inactive'}
                                          </Badge>
                                          <small className="text-muted align-self-center ms-2">#{status.displayOrder}</small>
                                        </div>
                                      </div>

                                      <div className="row g-2 text-sm">
                                        <div className="col-6">
                                          <small className="text-muted d-block"><i className="bi bi-hash me-1"></i>ID</small>
                                          <span>{status.leadStatusId}</span>
                                        </div>
                                        <div className="col-6">
                                          <small className="text-muted d-block"><i className="bi bi-arrow-up-down me-1"></i>Order</small>
                                          {editingStatus?.leadStatusId === status.leadStatusId ? (
                                            <Form.Control
                                              type="number"
                                              value={editStatusOrder}
                                              onChange={(e) => setEditStatusOrder(parseInt(e.target.value) || 0)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  handleUpdateLeadStatus(status, editStatusName, editStatusOrder, status.isActive);
                                                } else if (e.key === 'Escape') {
                                                  cancelEditingStatus();
                                                }
                                              }}
                                              size="sm"
                                              min={0}
                                            />
                                          ) : (
                                            <span>{status.displayOrder}</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Mobile action buttons */}
                                      <div className="d-flex gap-2 mt-3 pt-2 border-top">
                                        {editingStatus?.leadStatusId === status.leadStatusId ? (
                                          <>
                                            <Button
                                              variant="outline-success"
                                              size="sm"
                                              onClick={() => handleUpdateLeadStatus(status, editStatusName, editStatusOrder, status.isActive)}
                                              className="flex-fill"
                                            >
                                              <Check size={14} className="me-1" />
                                              Save
                                            </Button>
                                            <Button
                                              variant="outline-secondary"
                                              size="sm"
                                              onClick={cancelEditingStatus}
                                              className="flex-fill"
                                            >
                                              <XIcon size={14} className="me-1" />
                                              Cancel
                                            </Button>
                                          </>
                                        ) : (
                                          <>
                                            <Button
                                              variant="outline-primary"
                                              size="sm"
                                              onClick={() => startEditingStatus(status)}
                                              className="flex-fill"
                                            >
                                              <Edit2 size={14} className="me-1" />
                                              Edit
                                            </Button>
                                            <Button
                                              variant="outline-info"
                                              size="sm"
                                              onClick={() => {
                                                // Move up logic
                                                const currentIndex = leadStatuses.findIndex(s => s.leadStatusId === status.leadStatusId);
                                                if (currentIndex > 0) {
                                                  const newOrder = leadStatuses[currentIndex - 1].displayOrder;
                                                  handleUpdateLeadStatus(status, status.name, newOrder, status.isActive);
                                                }
                                              }}
                                              disabled={index === 0}
                                              className="flex-fill"
                                            >
                                              <ArrowUp size={14} className="me-1" />
                                              Up
                                            </Button>
                                            <Button
                                              variant="outline-info"
                                              size="sm"
                                              onClick={() => {
                                                // Move down logic
                                                const currentIndex = leadStatuses.findIndex(s => s.leadStatusId === status.leadStatusId);
                                                if (currentIndex < leadStatuses.length - 1) {
                                                  const newOrder = leadStatuses[currentIndex + 1].displayOrder;
                                                  handleUpdateLeadStatus(status, status.name, newOrder, status.isActive);
                                                }
                                              }}
                                              disabled={index === leadStatuses.length - 1}
                                              className="flex-fill"
                                            >
                                              <ArrowDown size={14} className="me-1" />
                                              Down
                                            </Button>
                                          </>
                                        )}
                                      </div>

                                      {/* Additional action buttons in second row */}
                                      {!editingStatus?.leadStatusId || editingStatus?.leadStatusId !== status.leadStatusId ? (
                                        <div className="d-flex gap-2 mt-2">
                                          <Button
                                            variant="outline-warning"
                                            size="sm"
                                            onClick={() => handleToggleStatusActive(status)}
                                            className="flex-fill"
                                          >
                                            {status.isActive ? <ToggleRight size={14} className="me-1" /> : <ToggleLeft size={14} className="me-1" />}
                                            {status.isActive ? 'Deactivate' : 'Activate'}
                                          </Button>
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => setDeletingStatus(status)}
                                            className="flex-fill"
                                          >
                                            <Trash2 size={14} className="me-1" />
                                            Delete
                                          </Button>
                                        </div>
                                      ) : null}
                                    </Card.Body>
                                  </Card>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Desktop Drag-and-Drop View (md+ screens) */}
                        {/* CSS styles moved to components.css */}
                        <div className="d-none d-md-block">
                          <DragDropContext
                            onDragEnd={handleDragEnd}
                            onDragStart={(start) => console.log('🚀 DRAG START:', start)}
                          >
                            <div className="border rounded">
                              {/* Header */}
                              <div className="d-flex align-items-center bg-light border-bottom p-3 fw-bold text-muted">
                                <div className="status-drag-handle"></div>
                                <div className="status-name">Name</div>
                                <div className="status-order">Display Order</div>
                                <div className="status-status">Status</div>
                                <div className="status-actions">Actions</div>
                              </div>

                              {/* Droppable area - Using StrictModeDroppable for React 18 compatibility */}
                              <StrictModeDroppable droppableId="lead-statuses">
                                {(provided, snapshot) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={snapshot.isDraggingOver ? 'bg-light' : ''}
                                  >
                                    {leadStatuses.length === 0 ? (
                                      <div className="text-center py-5">
                                        <div className="text-muted mb-3">
                                          <Database size={48} className="mb-3 opacity-50" />
                                          <h5>No Lead Statuses Found</h5>
                                          <p className="mb-3">Get started by seeding default lead statuses or creating your own.</p>
                                          <div className="d-flex justify-content-center gap-2">
                                            <Button
                                              variant="primary"
                                              onClick={handleSeedDefaultData}
                                              disabled={seeding}
                                            >
                                              {seeding ? (
                                                <>
                                                  <Spinner animation="border" size="sm" className="me-2" />
                                                  Seeding...
                                                </>
                                              ) : (
                                                <>
                                                  <Database size={16} className="me-2" />
                                                  Seed Default Data
                                                </>
                                              )}
                                            </Button>
                                            <Button
                                              variant="outline-secondary"
                                              onClick={() => setShowAddStatusModal(true)}
                                            >
                                              <Plus size={16} className="me-2" />
                                              Add Manually
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      leadStatuses.map((status, index) => (
                                        <Draggable key={status.leadStatusId} draggableId={status.leadStatusId.toString()} index={index}>
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={`status-row ${snapshot.isDragging ? 'bg-primary bg-opacity-10' : ''}`}
                                              style={{
                                                ...provided.draggableProps.style
                                              }}
                                            >
                                              <div
                                                className="status-drag-handle"
                                                {...provided.dragHandleProps}
                                              >
                                                <div className="d-flex align-items-center justify-content-center">
                                                  <GripVertical size={16} className="text-muted" />
                                                </div>
                                              </div>
                                              <div className="status-name">
                                                {editingStatus?.leadStatusId === status.leadStatusId ? (
                                                  <Form.Control
                                                    type="text"
                                                    value={editStatusName}
                                                    onChange={(e) => setEditStatusName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') {
                                                        handleUpdateLeadStatus(status, editStatusName, editStatusOrder, status.isActive);
                                                      } else if (e.key === 'Escape') {
                                                        cancelEditingStatus();
                                                      }
                                                    }}
                                                    autoFocus
                                                    maxLength={50}
                                                  />
                                                ) : (
                                                  <span>{status.name}</span>
                                                )}
                                              </div>
                                              <div className="status-order">
                                                {editingStatus?.leadStatusId === status.leadStatusId ? (
                                                  <Form.Control
                                                    type="number"
                                                    value={editStatusOrder}
                                                    onChange={(e) => setEditStatusOrder(parseInt(e.target.value) || 0)}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') {
                                                        handleUpdateLeadStatus(status, editStatusName, editStatusOrder, status.isActive);
                                                      } else if (e.key === 'Escape') {
                                                        cancelEditingStatus();
                                                      }
                                                    }}
                                                    min={0}
                                                  />
                                                ) : (
                                                  <span>{status.displayOrder}</span>
                                                )}
                                              </div>
                                              <div className="status-status">
                                                <Badge bg={status.isActive ? 'success' : 'secondary'}>
                                                  {status.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                              </div>
                                              <div className="status-actions">
                                                <div className="d-flex justify-content-center gap-2">
                                                  {editingStatus?.leadStatusId === status.leadStatusId ? (
                                                    <>
                                                      <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={() => handleUpdateLeadStatus(status, editStatusName, editStatusOrder, status.isActive)}
                                                      >
                                                        <Check size={14} />
                                                      </Button>
                                                      <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={cancelEditingStatus}
                                                      >
                                                        <XIcon size={14} />
                                                      </Button>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => startEditingStatus(status)}
                                                        title="Edit name and order"
                                                      >
                                                        <Edit2 size={14} />
                                                      </Button>
                                                      <Button
                                                        variant="outline-warning"
                                                        size="sm"
                                                        onClick={() => handleToggleStatusActive(status)}
                                                        title={status.isActive ? 'Deactivate' : 'Activate'}
                                                      >
                                                        {status.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                                      </Button>
                                                      <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => setDeletingStatus(status)}
                                                        title="Delete"
                                                      >
                                                        <Trash2 size={14} />
                                                      </Button>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))
                                    )}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </StrictModeDroppable>
                            </div>
                          </DragDropContext>
                        </div>
                      </div>
                    )}

                    {/* Add New Status Modal */}
                    <Modal show={showAddStatusModal} onHide={() => setShowAddStatusModal(false)}>
                      <Modal.Header closeButton>
                        <Modal.Title>Add New Lead Status</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Form.Group className="mb-3">
                          <Form.Label>Status Name *</Form.Label>
                          <Form.Control
                            type="text"
                            value={newStatusName}
                            onChange={(e) => setNewStatusName(e.target.value)}
                            placeholder="Enter lead status name"
                            maxLength={50}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateLeadStatus();
                              }
                            }}
                          />
                          <Form.Text className="text-muted">
                            Maximum 50 characters
                          </Form.Text>
                        </Form.Group>
                        <Form.Group>
                          <Form.Label>Display Order</Form.Label>
                          <Form.Control
                            type="number"
                            value={newStatusOrder}
                            onChange={(e) => setNewStatusOrder(parseInt(e.target.value) || 0)}
                            placeholder="Enter display order"
                            min={0}
                          />
                          <Form.Text className="text-muted">
                            Lower numbers appear first (0 = top)
                          </Form.Text>
                        </Form.Group>
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddStatusModal(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleCreateLeadStatus}
                          disabled={!newStatusName.trim()}
                        >
                          Create Status
                        </Button>
                      </Modal.Footer>
                    </Modal>

                    {/* Delete Confirmation Modal */}
                    <Modal show={!!deletingStatus} onHide={() => setDeletingStatus(null)}>
                      <Modal.Header closeButton>
                        <Modal.Title>Delete Lead Status</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <p>Are you sure you want to delete the lead status <strong>"{deletingStatus?.name}"</strong>?</p>
                        <Alert variant="warning">
                          <strong>Note:</strong> This action cannot be undone. If this lead status is being used by existing leads, it will be deactivated instead of deleted.
                        </Alert>
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" onClick={() => setDeletingStatus(null)}>
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => deletingStatus && handleDeleteLeadStatus(deletingStatus)}
                        >
                          Delete
                        </Button>
                      </Modal.Footer>
                    </Modal>
                  </div>
                </Tab.Pane>

                <Tab.Pane eventKey="email" active={activeTab === 'email'}>
                  <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h4 className="mb-1">Email Settings</h4>
                        <p className="text-muted mb-0">Configure SMTP server settings for email notifications and testing.</p>
                      </div>
                      <Button
                        variant="outline-info"
                        onClick={handleTestEmailSettings}
                        disabled={emailSettingsTesting || emailSettingsSaving || !emailSettings}
                        className="d-flex align-items-center"
                      >
                        {emailSettingsTesting ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail size={16} className="me-2" />
                            Test Email
                          </>
                        )}
                      </Button>
                    </div>

                    {emailSettingsLoading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" />
                        <p className="mt-2">Loading email settings...</p>
                      </div>
                    ) : (
                      <Form onSubmit={handleSaveEmailSettings}>
                        <Row>
                          <Col lg={8}>
                            <Card className="mb-4">
                              <Card.Header>
                                <h5 className="mb-0">SMTP Configuration</h5>
                              </Card.Header>
                              <Card.Body>
                                <Row>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>SMTP Host *</Form.Label>
                                      <Form.Control
                                        type="text"
                                        name="smtpHost"
                                        value={emailFormData.smtpHost}
                                        onChange={handleEmailInputChange}
                                        placeholder="e.g., smtp.gmail.com"
                                        required
                                      />
                                      <Form.Text className="text-muted">
                                        The SMTP server hostname or IP address
                                      </Form.Text>
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>SMTP Port *</Form.Label>
                                      <Form.Control
                                        type="number"
                                        name="smtpPort"
                                        value={emailFormData.smtpPort}
                                        onChange={handleEmailNumberChange}
                                        placeholder="587"
                                        min="1"
                                        max="65535"
                                        required
                                      />
                                      <Form.Text className="text-muted">
                                        Common ports: 587 (TLS), 465 (SSL), 25 (unsecured)
                                      </Form.Text>
                                    </Form.Group>
                                  </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                  <Form.Label>SMTP Username *</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="smtpUsername"
                                    value={emailFormData.smtpUsername}
                                    onChange={handleEmailInputChange}
                                    placeholder="your-email@gmail.com"
                                    required
                                  />
                                  <Form.Text className="text-muted">
                                    Usually your email address
                                  </Form.Text>
                                </Form.Group>

                                <Row>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>SMTP Password</Form.Label>
                                      <Form.Control
                                        type="password"
                                        name="smtpPassword"
                                        value={emailFormData.smtpPassword}
                                        onChange={handleEmailInputChange}
                                        placeholder="Enter new password"
                                      />
                                      <Form.Text className="text-muted">
                                        Leave blank to keep current password
                                      </Form.Text>
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>Confirm Password</Form.Label>
                                      <Form.Control
                                        type="password"
                                        name="confirmPassword"
                                        value={emailFormData.confirmPassword}
                                        onChange={handleEmailInputChange}
                                        placeholder="Confirm new password"
                                      />
                                    </Form.Group>
                                  </Col>
                                </Row>
                              </Card.Body>
                            </Card>

                            <Card>
                              <Card.Header>
                                <h5 className="mb-0">Email Configuration</h5>
                              </Card.Header>
                              <Card.Body>
                                <Row>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>From Email Address *</Form.Label>
                                      <Form.Control
                                        type="email"
                                        name="fromEmail"
                                        value={emailFormData.fromEmail}
                                        onChange={handleEmailInputChange}
                                        placeholder="noreply@yourcompany.com"
                                        required
                                      />
                                      <Form.Text className="text-muted">
                                        Email address that appears as the sender
                                      </Form.Text>
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>From Name *</Form.Label>
                                      <Form.Control
                                        type="text"
                                        name="fromName"
                                        value={emailFormData.fromName}
                                        onChange={handleEmailInputChange}
                                        placeholder="Your Company Name"
                                        required
                                      />
                                      <Form.Text className="text-muted">
                                        Display name for the sender
                                      </Form.Text>
                                    </Form.Group>
                                  </Col>
                                </Row>

                                <Row>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Check
                                        type="checkbox"
                                        name="enableSsl"
                                        label="Enable SSL/TLS"
                                        checked={emailFormData.enableSsl}
                                        onChange={handleEmailInputChange}
                                      />
                                      <Form.Text className="text-muted">
                                        Enable secure connection (recommended)
                                      </Form.Text>
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Check
                                        type="checkbox"
                                        name="isActive"
                                        label="Email Settings Active"
                                        checked={emailFormData.isActive}
                                        onChange={handleEmailInputChange}
                                      />
                                      <Form.Text className="text-muted">
                                        Enable/disable email functionality
                                      </Form.Text>
                                    </Form.Group>
                                  </Col>
                                </Row>
                              </Card.Body>
                            </Card>
                          </Col>

                          <Col lg={4}>
                            <Card className="mb-4">
                              <Card.Header>
                                <h5 className="mb-0">Test Email</h5>
                              </Card.Header>
                              <Card.Body>
                                <p className="text-muted small mb-3">
                                  Send a test email to verify your SMTP configuration is working correctly.
                                </p>
                                <Button
                                  variant="outline-primary"
                                  onClick={handleTestEmailSettings}
                                  disabled={emailSettingsTesting || emailSettingsSaving || !emailSettings}
                                  className="w-100"
                                >
                                  {emailSettingsTesting ? (
                                    <>
                                      <Spinner animation="border" size="sm" className="me-2" />
                                      Sending Test Email...
                                    </>
                                  ) : (
                                    <>
                                      <Mail size={16} className="me-2" />
                                      Send Test Email
                                    </>
                                  )}
                                </Button>
                                <Form.Text className="text-muted mt-2 d-block">
                                  Test email will be sent to: <strong>{user?.email}</strong>
                                </Form.Text>
                              </Card.Body>
                            </Card>

                            <Card>
                              <Card.Header>
                                <h5 className="mb-0">Common SMTP Settings</h5>
                              </Card.Header>
                              <Card.Body>
                                <div className="mb-3">
                                  <h6>Gmail:</h6>
                                  <small className="text-muted">
                                    Host: smtp.gmail.com<br />
                                    Port: 587<br />
                                    Enable SSL: Yes
                                  </small>
                                </div>
                                <div className="mb-3">
                                  <h6>Outlook/Hotmail:</h6>
                                  <small className="text-muted">
                                    Host: smtp-mail.outlook.com<br />
                                    Port: 587<br />
                                    Enable SSL: Yes
                                  </small>
                                </div>
                                <div>
                                  <h6>Yahoo:</h6>
                                  <small className="text-muted">
                                    Host: smtp.mail.yahoo.com<br />
                                    Port: 587<br />
                                    Enable SSL: Yes
                                  </small>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                          <Button
                            type="submit"
                            variant="primary"
                            disabled={emailSettingsSaving || emailSettingsTesting}
                          >
                            {emailSettingsSaving ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  className="me-2"
                                />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save size={14} className="me-1" />
                                Save Email Settings
                              </>
                            )}
                          </Button>
                        </div>
                      </Form>
                    )}
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;