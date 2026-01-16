import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Row, Col, Form, InputGroup, Alert, Pagination, Spinner, Dropdown } from 'react-bootstrap';
import { Edit, Filter, Search, Calendar, Download, CheckSquare, Square, Eye, EyeOff } from 'lucide-react';
import AddLeadModal from '../components/AddLeadModal';
import { getAllLeads, getLeadSources, getLeadStatuses, getUrgencyLevels, bulkUpdateStatus, exportLeads } from '../services/leadService';
import { Lead, LeadSource, LeadStatus, Urgency } from '../types/Lead';
import { AllLeadsResponse, PaginatedLeadResponse, LeadSourceDistribution } from '../services/leadService';
import { useAuth } from '../contexts/AuthContext';
import { getUsers } from '../services/userService';
import { formatDate, getTodayForInput } from '../utils/dateUtils';

interface User {
  userId: number;
  fullName: string;
  email: string;
  roleName: string;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  followupDateFrom: string;
  followupDateTo: string;
  createdDateFrom: string;
  createdDateTo: string;
  leadSourceId: string;
  leadStatusId: string;
  urgencyLevelId: string;
  assignedToUserId: string;
  budgetMin: string;
  budgetMax: string;
  search: string;
}

interface SortState {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

interface ColumnVisibility {
  clientName: boolean;
  companyName: boolean;
  leadDate: boolean;
  leadSource: boolean;
  status: boolean;
  urgency: boolean;
  expectedBudget: boolean;
  assignedTo: boolean;
  followupDate: boolean;
  createdDate: boolean;
}

const AllLeads: React.FC = () => {
  const { user } = useAuth();

  // State management
  const [leadsData, setLeadsData] = useState<AllLeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);

  // Filter and pagination states
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    followupDateFrom: '',
    followupDateTo: '',
    createdDateFrom: '',
    createdDateTo: '',
    leadSourceId: '',
    leadStatusId: '',
    urgencyLevelId: '',
    assignedToUserId: '',
    budgetMin: '',
    budgetMax: '',
    search: '',
  });

  const [sort, setSort] = useState<SortState>({
    sortBy: 'LeadDate',
    sortDirection: 'desc',
  });

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    clientName: true,
    companyName: true,
    leadDate: true,
    leadSource: true,
    status: true,
    urgency: true,
    expectedBudget: true,
    assignedTo: true,
    followupDate: true,
    createdDate: true
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Bulk selection states
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [bulkStatusId, setBulkStatusId] = useState<string>('');
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);

  // Reference data
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [urgencyLevels, setUrgencyLevels] = useState<Urgency[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Load reference data on component mount
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [sourcesRes, statusesRes, urgencyRes, usersRes] = await Promise.all([
          getLeadSources(),
          getLeadStatuses(),
          getUrgencyLevels(),
          getUsers(), // Assuming this service exists
        ]);

        if (sourcesRes.success && sourcesRes.data) {
          setLeadSources(sourcesRes.data);
        }

        if (statusesRes.success && statusesRes.data) {
          setLeadStatuses(statusesRes.data);
        }

        if (urgencyRes.success && urgencyRes.data) {
          setUrgencyLevels(urgencyRes.data);
        }

        if (usersRes.success && usersRes.data) {
          setUsers(usersRes.data);
        }
      } catch (err) {
        console.error('Error loading reference data:', err);
      }
    };

    loadReferenceData();
  }, []);

  // Load leads data
  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        pageSize: pageSize,
        sortBy: sort.sortBy,
        sortDirection: sort.sortDirection,
      };

      // Add filters only if they have values
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.followupDateFrom) params.followupDateFrom = filters.followupDateFrom;
      if (filters.followupDateTo) params.followupDateTo = filters.followupDateTo;
      if (filters.createdDateFrom) params.createdDateFrom = filters.createdDateFrom;
      if (filters.createdDateTo) params.createdDateTo = filters.createdDateTo;
      if (filters.leadSourceId) params.leadSourceId = parseInt(filters.leadSourceId);
      if (filters.leadStatusId) params.leadStatusId = parseInt(filters.leadStatusId);
      if (filters.urgencyLevelId) params.urgencyLevelId = parseInt(filters.urgencyLevelId);
      if (filters.assignedToUserId) params.assignedToUserId = parseInt(filters.assignedToUserId);
      if (filters.budgetMin) params.budgetMin = parseFloat(filters.budgetMin);
      if (filters.budgetMax) params.budgetMax = parseFloat(filters.budgetMax);
      if (filters.search) params.search = filters.search;

      const response = await getAllLeads(params);

      if (response.success && response.data) {
        setLeadsData(response.data);
      } else {
        setError(response.message || 'Failed to load leads');
      }
    } catch (err: any) {
      console.error('Error loading leads:', err);
      setError(err.response?.data?.message || 'An error occurred while loading leads');
    } finally {
      setLoading(false);
    }
  };

  // Reload leads when filters, sort, or pagination changes
  useEffect(() => {
    loadLeads();
    // Reset selection when filters change
    setSelectedLeads([]);
  }, [currentPage, pageSize, sort, filters]);

  const handleAddLead = () => {
    setEditingLead(undefined);
    setShowAddLeadModal(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowAddLeadModal(true);
  };

  const handleLeadSuccess = () => {
    loadLeads();
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const handleClearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      followupDateFrom: '',
      followupDateTo: '',
      createdDateFrom: '',
      createdDateTo: '',
      leadSourceId: '',
      leadStatusId: '',
      urgencyLevelId: '',
      assignedToUserId: '',
      budgetMin: '',
      budgetMax: '',
      search: '',
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return (
      filters.dateFrom ||
      filters.dateTo ||
      filters.followupDateFrom ||
      filters.followupDateTo ||
      filters.createdDateFrom ||
      filters.createdDateTo ||
      filters.leadSourceId ||
      filters.leadStatusId ||
      filters.urgencyLevelId ||
      filters.assignedToUserId ||
      filters.budgetMin ||
      filters.budgetMax ||
      filters.search ||
      false
    );
  };

  const handleSort = (column: string) => {
    if (sort.sortBy === column) {
      setSort({ ...sort, sortDirection: sort.sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      setSort({ sortBy: column, sortDirection: 'desc' });
    }
    setCurrentPage(1);
  };


  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedLeads.length === leadsData?.leads.leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leadsData?.leads.leads?.map(lead => lead.leadId) || []);
    }
  };

  const handleSelectLead = (leadId: number) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedLeads.length === 0 || !bulkStatusId) {
      alert('Please select leads and a status to update');
      return;
    }

    if (!confirm(`Are you sure you want to update ${selectedLeads.length} lead(s) status?`)) {
      return;
    }

    try {
      setBulkUpdateLoading(true);
      const response = await bulkUpdateStatus(selectedLeads, parseInt(bulkStatusId));

      if (response.success) {
        alert(`Successfully updated ${response.data?.updatedCount} lead(s)`);
        setSelectedLeads([]);
        setBulkStatusId('');
        loadLeads();
      } else {
        alert(response.message || 'Failed to update leads');
      }
    } catch (err: any) {
      console.error('Error updating leads:', err);
      alert(err.response?.data?.message || 'An error occurred while updating leads');
    } finally {
      setBulkUpdateLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: any = {};

      // Add filters only if they have values
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.followupDateFrom) params.followupDateFrom = filters.followupDateFrom;
      if (filters.followupDateTo) params.followupDateTo = filters.followupDateTo;
      if (filters.createdDateFrom) params.createdDateFrom = filters.createdDateFrom;
      if (filters.createdDateTo) params.createdDateTo = filters.createdDateTo;
      if (filters.leadSourceId) params.leadSourceId = parseInt(filters.leadSourceId);
      if (filters.leadStatusId) params.leadStatusId = parseInt(filters.leadStatusId);
      if (filters.urgencyLevelId) params.urgencyLevelId = parseInt(filters.urgencyLevelId);
      if (filters.assignedToUserId) params.assignedToUserId = parseInt(filters.assignedToUserId);
      if (filters.budgetMin) params.budgetMin = parseFloat(filters.budgetMin);
      if (filters.budgetMax) params.budgetMax = parseFloat(filters.budgetMax);
      if (filters.search) params.search = filters.search;

      params.format = 'csv';

      const blob = await exportLeads(params);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting leads:', err);
      alert('An error occurred while exporting leads');
    }
  };

  const getStatusBadgeVariant = (statusName: string): string => {
    const statusLower = statusName.toLowerCase();
    if (statusLower.includes('converted')) return 'success';
    if (statusLower.includes('lost')) return 'danger';
    if (statusLower.includes('new')) return 'primary';
    if (statusLower.includes('contacted') || statusLower.includes('meeting') || statusLower.includes('demo')) return 'info';
    if (statusLower.includes('proposal') || statusLower.includes('follow')) return 'warning';
    return 'secondary';
  };

  const getUrgencyBadgeVariant = (urgencyName: string): string => {
    const urgencyLower = urgencyName.toLowerCase();
    if (urgencyLower.includes('immediate')) return 'danger';
    if (urgencyLower.includes('week')) return 'warning';
    if (urgencyLower.includes('month')) return 'info';
    return 'secondary';
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderPagination = () => {
    if (!leadsData?.leads.totalPages || leadsData.leads.totalPages <= 1) return null;

    return (
      <Card className="mt-3">
        <Card.Body className="py-2">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
            <span className="text-muted small">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, leadsData.leads.totalCount)} of {leadsData.leads.totalCount} leads
            </span>
            <Pagination className="mb-0">
              <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
              <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} />
              <Pagination.Item active>{currentPage}</Pagination.Item>
              <Pagination.Item disabled>of {leadsData.leads.totalPages}</Pagination.Item>
              <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(leadsData.leads.totalPages, prev + 1))} disabled={currentPage === leadsData.leads.totalPages} />
              <Pagination.Last onClick={() => setCurrentPage(leadsData.leads.totalPages)} disabled={currentPage === leadsData.leads.totalPages} />
            </Pagination>
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div>
      {/* Mobile-first header: stack vertically on mobile, side-by-side on larger */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div className="flex-grow-1">
          <h2 className="mb-1">All Leads</h2>
          <p className="text-muted mb-0">
            {user?.roleName === 'Company Manager'
              ? 'View and manage leads for your team'
              : 'View and manage all company leads'}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <div style={{ width: '300px' }}>
            <InputGroup size="sm">
              <InputGroup.Text>
                <Search size={16} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by client name, company, email, mobile..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </InputGroup>
          </div>
          <Button
            variant="outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-grow-1 flex-md-grow-0"
          >
            <Filter size={18} className="me-2" />
            <span className="d-none d-sm-inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            <span className="d-sm-none">Filters</span>
          </Button>
          <Dropdown className="flex-grow-1 flex-md-grow-0">
            <Dropdown.Toggle variant="outline-secondary" className="w-100">
              <Eye size={18} className="me-2" />
              <span className="d-none d-sm-inline">Columns</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.keys(columnVisibility).map((column) => (
                <Dropdown.Item
                  key={column}
                  onClick={() => toggleColumnVisibility(column as keyof ColumnVisibility)}
                >
                  {columnVisibility[column as keyof ColumnVisibility] ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span className="ms-2">{column.replace(/([A-Z])/g, ' $1').trim()}</span>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <div className="d-flex gap-2 flex-wrap">
            <Button variant="outline-primary" className="flex-fill flex-md-auto" onClick={handleExport}>
              <Download size={18} className="me-2" />
              <span className="d-none d-sm-inline">Export</span>
            </Button>
            <Button variant="primary" className="flex-fill flex-md-auto" onClick={handleAddLead}>
              <span className="d-none d-sm-inline">Add Lead</span>
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}


      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-4">
          <Card.Body>
            <Row className="mb-3 g-3">
              <Col xs={12} sm={6} md={4}>
                <Form.Group>
                  <Form.Label className="small">Assigned User</Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.assignedToUserId}
                    onChange={(e) => handleFilterChange('assignedToUserId', e.target.value)}
                  >
                    <option value="">All Users</option>
                    {users.map(user => (
                      <option key={user.userId} value={user.userId}>
                        {user.fullName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Form.Group>
                  <Form.Label className="small">Lead Date From</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Form.Group>
                  <Form.Label className="small">Lead Date To</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3 g-3">
              <Col xs={12} sm={6} md={4}>
                <Form.Group>
                  <Form.Label className="small">Lead Source</Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.leadSourceId}
                    onChange={(e) => handleFilterChange('leadSourceId', e.target.value)}
                  >
                    <option value="">All Sources</option>
                    {leadSources.map(source => (
                      <option key={source.leadSourceId} value={source.leadSourceId}>
                        {source.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Form.Group>
                  <Form.Label className="small">Lead Status</Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.leadStatusId}
                    onChange={(e) => handleFilterChange('leadStatusId', e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {leadStatuses.map(status => (
                      <option key={status.leadStatusId} value={status.leadStatusId}>
                        {status.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Form.Group>
                  <Form.Label className="small">Urgency</Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.urgencyLevelId}
                    onChange={(e) => handleFilterChange('urgencyLevelId', e.target.value)}
                  >
                    <option value="">All Urgencies</option>
                    {urgencyLevels.map(urgency => (
                      <option key={urgency.urgencyLevelId} value={urgency.urgencyLevelId}>
                        {urgency.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col xs={12} sm={6} md={6}>
                <Form.Group>
                  <Form.Label className="small">Budget Min ($)</Form.Label>
                  <Form.Control
                    type="number"
                    size="sm"
                    placeholder="0"
                    value={filters.budgetMin}
                    onChange={(e) => handleFilterChange('budgetMin', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={6}>
                <Form.Group>
                  <Form.Label className="small">Budget Max ($)</Form.Label>
                  <Form.Control
                    type="number"
                    size="sm"
                    placeholder="1000000"
                    value={filters.budgetMax}
                    onChange={(e) => handleFilterChange('budgetMax', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3 g-3">
              <Col xs={12} sm={6} md={6}>
                <Form.Group>
                  <Form.Label className="small">Follow-up Date From</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={filters.followupDateFrom}
                    onChange={(e) => handleFilterChange('followupDateFrom', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={6}>
                <Form.Group>
                  <Form.Label className="small">Follow-up Date To</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={filters.followupDateTo}
                    onChange={(e) => handleFilterChange('followupDateTo', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col xs={12} className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-end">
                <Button variant="outline-secondary" onClick={handleClearFilters} className="flex-fill">
                  Clear Filters
                </Button>
                <Button variant="primary" onClick={loadLeads} className="flex-fill">
                  Apply Filters
                </Button>
              </Col>
            </Row>
            </Card.Body>
          </Card>
        )}

      {/* Bulk Actions */}
      {selectedLeads.length > 0 && (
        <Card className="mb-4 border-primary shadow-sm">
          <Card.Body>
            <Row className="align-items-center g-3">
              <Col xs={12} md={6}>
                <strong>{selectedLeads.length}</strong> lead(s) selected
              </Col>
              <Col xs={12} md={6}>
                <div className="d-flex gap-2 justify-content-end flex-wrap">
                  <Form.Select
                    size="sm"
                    value={bulkStatusId}
                    onChange={(e) => setBulkStatusId(e.target.value)}
                    style={{ width: 'auto', minWidth: '140px' }}
                  >
                    <option value="">Select Status</option>
                    {leadStatuses.map(status => (
                      <option key={status.leadStatusId} value={status.leadStatusId}>
                        {status.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleBulkStatusUpdate}
                    disabled={!bulkStatusId || bulkUpdateLoading}
                  >
                    {bulkUpdateLoading ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Leads Data Grid */}
      <Card>
        <Card.Header className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 bg-light">
          <div>
            <h5 className="mb-0">Leads ({leadsData?.leads.totalCount || 0})</h5>
                <Button variant="outline-primary" size="sm" onClick={loadLeads} disabled={loading}>
                  {loading ? <Spinner size="sm" /> : 'Refresh'}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading leads...</p>
                </div>
              ) : leadsData?.leads.leads.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No leads found matching your criteria.</p>
                  <Button variant="primary" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile Card View (xs/sm screens) */}
                  <div className="d-block d-md-none">
                    <div className="row g-3">
                      {leadsData?.leads.leads.map((lead) => (
                        <div key={lead.leadId} className="col-12">
                          <Card 
                            className="shadow-sm"
                            style={{
                              border: '1px solid #e0e0e0',
                              borderRadius: '0.375rem'
                            }}
                          >
                            <Card.Body className="p-2">
                              {/* Row 1: Client Name, Status Badge, Edit Button */}
                              <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '0.25rem' }}>
                                <div className="d-flex align-items-center flex-grow-1 me-1" style={{ minWidth: 0 }}>
                                  <Form.Check
                                    type="checkbox"
                                    checked={selectedLeads.includes(lead.leadId)}
                                    onChange={() => handleSelectLead(lead.leadId)}
                                    className="me-1"
                                    style={{ transform: 'scale(0.9)' }}
                                  />
                                  <h6 className="mb-0 text-truncate fw-bold" title={lead.clientName} style={{ fontSize: '0.9rem' }}>
                                    {lead.clientName}
                                  </h6>
                                </div>
                                <div className="d-flex gap-1 align-items-center flex-shrink-0">
                                  <Badge bg={getStatusBadgeVariant(lead.leadStatusName || '')} className="text-nowrap" style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>
                                    {lead.leadStatusName}
                                  </Badge>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleEditLead(lead)}
                                    className="p-0 text-primary"
                                    title="Edit Lead"
                                  >
                                    <Edit size={16} />
                                  </Button>
                                </div>
                              </div>

                              {/* Company */}
                              {lead.companyName && (
                                <div className="d-flex align-items-center text-muted" style={{ marginBottom: '0.25rem' }}>
                                  <i className="bi bi-building me-1" style={{ fontSize: '0.8rem' }}></i>
                                  <span className="text-truncate" title={lead.companyName} style={{ fontSize: '0.8rem' }}>
                                    {lead.companyName}
                                  </span>
                                </div>
                              )}

                              {/* Phone */}
                              {lead.mobileNumber && (
                                <div className="d-flex align-items-center" style={{ marginBottom: '0.25rem' }}>
                                  <i className="bi bi-phone text-muted me-1" style={{ fontSize: '0.8rem' }}></i>
                                  <span className="text-truncate" title={lead.mobileNumber} style={{ fontSize: '0.8rem' }}>
                                    {lead.mobileNumber}
                                  </span>
                                </div>
                              )}

                              {/* Lead Date and Source */}
                              <div className="d-flex gap-2" style={{ marginBottom: '0.25rem' }}>
                                <div className="d-flex align-items-center flex-fill" style={{ minWidth: 0 }}>
                                  <i className="bi bi-calendar3 text-muted me-1" style={{ fontSize: '0.8rem' }}></i>
                                  <span className="text-truncate" style={{ fontSize: '0.8rem' }}>
                                    {formatDate(lead.leadDate)}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center flex-fill" style={{ minWidth: 0 }}>
                                  <i className="bi bi-diagram-3 text-muted me-1" style={{ fontSize: '0.8rem' }}></i>
                                  <span className="text-truncate" title={lead.leadSourceName} style={{ fontSize: '0.8rem' }}>
                                    {lead.leadSourceName}
                                  </span>
                                </div>
                              </div>

                              {/* Referral */}
                              {lead.referredBy && (
                                <div className="d-flex align-items-center">
                                  <i className="bi bi-person-check text-muted me-1" style={{ fontSize: '0.8rem' }}></i>
                                  <span className="text-truncate" title={lead.referredBy} style={{ fontSize: '0.8rem' }}>
                                    {lead.referredBy}
                                  </span>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Table View (md+ screens) */}
                  <div className="d-none d-md-block">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="text-center" style={{ width: '40px' }}>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={handleSelectAll}
                                className="p-0"
                              >
                                {selectedLeads.length === leadsData?.leads.leads.length ? (
                                  <CheckSquare size={18} />
                                ) : (
                                  <Square size={18} />
                                )}
                              </Button>
                            </th>
                            {columnVisibility.clientName && (
                              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ClientName')} className="fw-medium">
                                Client Name {sort.sortBy === 'ClientName' && (sort.sortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                            )}
                            {columnVisibility.companyName && (
                              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('CompanyName')} className="fw-medium d-none d-md-table-cell">
                                Company {sort.sortBy === 'CompanyName' && (sort.sortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                            )}
                            {columnVisibility.leadDate && (
                              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('LeadDate')} className="d-none d-lg-table-cell">
                                Lead Date {sort.sortBy === 'LeadDate' && (sort.sortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                            )}
                            {columnVisibility.leadSource && <th className="d-none d-sm-table-cell">Source</th>}
                            {columnVisibility.status && <th>Status</th>}
                            {columnVisibility.urgency && <th className="d-none d-lg-table-cell">Urgency</th>}
                            {columnVisibility.expectedBudget && (
                              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ExpectedBudget')} className="d-none d-lg-table-cell">
                                Budget {sort.sortBy === 'ExpectedBudget' && (sort.sortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                            )}
                            {columnVisibility.assignedTo && <th className="d-none d-md-table-cell">Assigned</th>}
                            {columnVisibility.followupDate && (
                              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('FollowupDate')} className="d-none d-lg-table-cell">
                                Follow-up {sort.sortBy === 'FollowupDate' && (sort.sortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                            )}
                            {columnVisibility.createdDate && (
                              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('CreatedDate')} className="d-none d-xl-table-cell">
                                Created {sort.sortBy === 'CreatedDate' && (sort.sortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                            )}
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leadsData?.leads.leads.map((lead) => (
                            <tr key={lead.leadId}>
                              <td className="text-center">
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => handleSelectLead(lead.leadId)}
                                  className="p-0"
                                >
                                  {selectedLeads.includes(lead.leadId) ? (
                                    <CheckSquare size={18} />
                                  ) : (
                                    <Square size={18} />
                                  )}
                                </Button>
                              </td>
                              {columnVisibility.clientName && (
                                <td>
                                  <strong>{lead.clientName}</strong>
                                </td>
                              )}
                              {columnVisibility.companyName && <td className="d-none d-md-table-cell">{lead.companyName || '-'}</td>}
                              {columnVisibility.leadDate && <td className="d-none d-lg-table-cell">{formatDate(lead.leadDate)}</td>}
                              {columnVisibility.leadSource && (
                                <td className="d-none d-sm-table-cell">
                                  {lead.leadSourceName}
                                </td>
                              )}
                              {columnVisibility.status && (
                                <td>
                                  <Badge bg={getStatusBadgeVariant(lead.leadStatusName || '')}>
                                    {lead.leadStatusName}
                                  </Badge>
                                </td>
                              )}
                              {columnVisibility.urgency && (
                                <td className="d-none d-lg-table-cell">
                                  {lead.urgencyLevelName ? (
                                    <span 
                                      style={{
                                        color: lead.urgencyLevelName.toLowerCase().includes('immediate') ? '#dc3545' : 'inherit',
                                        fontWeight: lead.urgencyLevelName.toLowerCase().includes('immediate') ? '600' : 'normal'
                                      }}
                                    >
                                      {lead.urgencyLevelName}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              )}
                              {columnVisibility.expectedBudget && <td className="d-none d-lg-table-cell">{formatCurrency(lead.expectedBudget)}</td>}
                              {columnVisibility.assignedTo && <td className="d-none d-md-table-cell">{lead.assignedToUserName || 'Unassigned'}</td>}
                              {columnVisibility.followupDate && <td className="d-none d-lg-table-cell">{formatDate(lead.followupDate)}</td>}
                              {columnVisibility.createdDate && <td className="d-none d-xl-table-cell">{formatDate(lead.createdDate)}</td>}
                              <td className="text-center">
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => handleEditLead(lead)}
                                  title="Edit Lead"
                                >
                                  <Edit size={16} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
            {leadsData?.leads && leadsData.leads.totalPages > 1 && (
              <Card.Footer className="d-flex justify-content-center">
                {renderPagination()}
              </Card.Footer>
            )}
          </Card>

      {/* Add/Edit Lead Modal */}
      <AddLeadModal
        show={showAddLeadModal}
        onHide={() => setShowAddLeadModal(false)}
        onSuccess={handleLeadSuccess}
        lead={editingLead}
      />
    </div>
  );
};

export default AllLeads;
