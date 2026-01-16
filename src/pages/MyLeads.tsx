import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Row, Col, Form, InputGroup, Alert, Pagination, Spinner, Dropdown } from 'react-bootstrap';
import { Plus, Edit, Eye, EyeOff, Filter, Search, Calendar } from 'lucide-react';
import AddLeadModal from '../components/AddLeadModal';
import { getMyLeads, getLeadSources, getLeadStatuses, getUrgencyLevels } from '../services/leadService';
import { Lead, LeadSource, LeadStatus, Urgency } from '../types/Lead';
import { MyLeadsResponse, PaginatedLeadResponse, LeadStatusDistribution } from '../services/leadService';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';

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
  interestedIn: boolean;
  notes: boolean;
  followupDate: boolean;
  createdDate: boolean;
}

const MyLeads: React.FC = () => {
  const { user } = useAuth();

  // Determine user's role
  const isReferralPartner = user?.roleName === 'Referral Partner';

  // State management
  const [leadsData, setLeadsData] = useState<MyLeadsResponse | null>(null);
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
    budgetMin: '',
    budgetMax: '',
    search: ''
  });

  const [sort, setSort] = useState<SortState>({
    sortBy: 'LeadDate',
    sortDirection: 'desc'
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
    interestedIn: true,
    notes: true,
    followupDate: true,
    createdDate: true
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dropdown options
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [urgencyLevels, setUrgencyLevels] = useState<Urgency[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Load dropdown options on component mount
  useEffect(() => {
    loadDropdownOptions();
  }, []);

  // Load leads when filters, sort, or page changes
  useEffect(() => {
    loadMyLeads();
  }, [filters, sort, currentPage]);

  const loadDropdownOptions = async () => {
    try {
      const [sourcesRes, statusesRes, urgencyRes] = await Promise.all([
        getLeadSources(),
        getLeadStatuses(),
        getUrgencyLevels()
      ]);

      if (sourcesRes.success && sourcesRes.data) {
        setLeadSources(sourcesRes.data.filter(s => s.isActive));
      }

      if (statusesRes.success && statusesRes.data) {
        setLeadStatuses(statusesRes.data.filter(s => s.isActive));
      }

      if (urgencyRes.success && urgencyRes.data) {
        setUrgencyLevels(urgencyRes.data.filter(u => u.isActive));
      }
    } catch (err) {
      console.error('Failed to load dropdown options:', err);
    }
  };

  const loadMyLeads = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        pageSize,
        sortBy: sort.sortBy,
        sortDirection: sort.sortDirection,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        followupDateFrom: filters.followupDateFrom || undefined,
        followupDateTo: filters.followupDateTo || undefined,
        createdDateFrom: filters.createdDateFrom || undefined,
        createdDateTo: filters.createdDateTo || undefined,
        leadSourceId: filters.leadSourceId ? parseInt(filters.leadSourceId) : undefined,
        leadStatusId: filters.leadStatusId ? parseInt(filters.leadStatusId) : undefined,
        urgencyLevelId: filters.urgencyLevelId ? parseInt(filters.urgencyLevelId) : undefined,
        budgetMin: filters.budgetMin ? parseFloat(filters.budgetMin) : undefined,
        budgetMax: filters.budgetMax ? parseFloat(filters.budgetMax) : undefined,
        search: filters.search || undefined
      };

      const response = await getMyLeads(params);

      if (response.success && response.data) {
        setLeadsData(response.data);
        // For Referral Partners, leads are readonly
        if (isReferralPartner) {
          // All leads for Referral Partners should have isReadonly = true
          // This is already handled by the backend, but we can verify here if needed
        }
      } else {
        setError(response.message || 'Failed to load leads');
      }
    } catch (err: any) {
      console.error('Load my leads error:', err);
      setError(err.response?.data?.message || 'Failed to load your leads');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (sortBy: string) => {
    setSort(prev => ({
      sortBy,
      sortDirection: prev.sortBy === sortBy && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const handleAddLead = () => {
    setEditingLead(undefined);
    setShowAddLeadModal(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowAddLeadModal(true);
  };

  const handleLeadSuccess = () => {
    loadMyLeads(); // Refresh the leads list
  };

  const clearFilters = () => {
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
      budgetMin: '',
      budgetMax: '',
      search: ''
    });
    setCurrentPage(1);
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

  const getUrgencyVariant = (urgencyName: string) => {
    switch (urgencyName?.toLowerCase()) {
      case 'immediate': return 'danger';
      case 'within 1 week': return 'warning';
      case 'within 1 month': return 'info';
      case 'just exploring': return 'secondary';
      default: return 'secondary';
    }
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
      <div className="mb-4">
        <div className="mb-3">
          <h2 className="mb-1">{isReferralPartner ? 'My Referred Leads' : 'My Leads'}</h2>
          <p className="text-muted mb-0">
            {isReferralPartner ? 'View leads you have referred' : 'Manage leads assigned to you'}
          </p>
        </div>
        
        {/* Search Bar - Full width on mobile */}
        <div className="mb-2">
          <InputGroup size="sm">
            <InputGroup.Text>
              <Search size={16} />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </InputGroup>
        </div>

        {/* Action Buttons - Grid layout on mobile */}
        <div className="row g-2">
          <div className="col-4 col-sm-3 col-md-auto">
            <Button
              variant="outline-secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="w-100"
              size="sm"
            >
              <Filter size={16} />
              <span className="d-none d-lg-inline ms-1">Filters</span>
            </Button>
          </div>
          <div className="col-4 col-sm-3 col-md-auto">
            <Dropdown className="w-100">
              <Dropdown.Toggle variant="outline-secondary" className="w-100" size="sm">
                <Eye size={16} />
                <span className="d-none d-lg-inline ms-1">Columns</span>
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
          </div>
          {!isReferralPartner && (
            <div className="col-4 col-sm-3 col-md-auto">
              <Button
                variant="primary"
                onClick={handleAddLead}
                className="w-100"
                size="sm"
              >
                <Plus size={16} />
                <span className="d-none d-lg-inline ms-1">Add</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}


      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-4">
          <Card.Body>
            <Row className="mb-3 g-3">
              <Col xs={12} sm={6} md={6}>
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
              <Col xs={12} sm={6} md={6}>
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
                    {leadSources.map((source) => (
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
                    {leadStatuses.map((status) => (
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
                    {urgencyLevels.map((urgency) => (
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
                <Button variant="outline-secondary" onClick={clearFilters} className="flex-fill">
                  Clear Filters
                </Button>
                <Button variant="primary" onClick={loadMyLeads} className="flex-fill">
                  Apply Filters
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Leads Table */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">My Leads ({leadsData?.leads.totalCount || 0})</h5>
            <Button variant="outline-primary" size="sm" onClick={loadMyLeads} disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Refresh'}
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading your leads...</p>
            </div>
          ) : leadsData?.leads.leads.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">
                {isReferralPartner
                  ? "No referred leads found."
                  : "No leads found matching your criteria."
                }
              </p>
              {!isReferralPartner && (
                <Button variant="primary" onClick={handleAddLead}>
                  <Plus size={16} className="me-2" />
                  Add Your First Lead
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View (xs/sm screens) */}
              <div className="d-block d-md-none px-0">
                <div className="row g-2">
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
                            <h6 className="mb-0 text-truncate fw-bold flex-grow-1 me-1" title={lead.clientName} style={{ fontSize: '0.9rem' }}>
                              {lead.clientName}
                            </h6>
                            <div className="d-flex gap-1 align-items-center flex-shrink-0">
                              <Badge bg={getStatusVariant(lead.leadStatusName || '')} className="text-nowrap" style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>
                                {lead.leadStatusName}
                              </Badge>
                              {!lead.isReadonly && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => handleEditLead(lead)}
                                  className="p-0 text-primary"
                                  title="Edit Lead"
                                >
                                  <Edit size={16} />
                                </Button>
                              )}
                              {lead.isReadonly && (
                                <Badge bg="secondary" style={{ fontSize: '0.65rem', padding: '0.2rem 0.3rem' }}>
                                  Read Only
                                </Badge>
                              )}
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
                <Table striped hover className="mb-0" style={{ fontSize: '0.875rem' }}>
                  <thead className="table-light">
                    <tr>
                      {columnVisibility.clientName && (
                        <th onClick={() => handleSort('ClientName')} style={{ cursor: 'pointer' }}>
                          Client {sort.sortBy === 'ClientName' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {columnVisibility.companyName && (
                        <th onClick={() => handleSort('CompanyName')} style={{ cursor: 'pointer' }} className="d-none d-md-table-cell">
                          Company {sort.sortBy === 'CompanyName' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {columnVisibility.leadDate && (
                        <th onClick={() => handleSort('LeadDate')} style={{ cursor: 'pointer' }} className="d-none d-md-table-cell">
                          Lead Date {sort.sortBy === 'LeadDate' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {columnVisibility.leadSource && <th className="d-none d-lg-table-cell">Source</th>}
                      {columnVisibility.status && <th>Status</th>}
                      {columnVisibility.urgency && <th className="d-none d-lg-table-cell">Urgency</th>}
                      {columnVisibility.expectedBudget && (
                        <th onClick={() => handleSort('ExpectedBudget')} style={{ cursor: 'pointer' }} className="d-none d-lg-table-cell">
                          Budget {sort.sortBy === 'ExpectedBudget' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {columnVisibility.interestedIn && <th className="d-none d-xl-table-cell">Interested In</th>}
                      {columnVisibility.notes && <th className="d-none d-xl-table-cell">Notes</th>}
                      {columnVisibility.followupDate && (
                        <th onClick={() => handleSort('FollowupDate')} style={{ cursor: 'pointer' }} className="d-none d-lg-table-cell">
                          Follow-up {sort.sortBy === 'FollowupDate' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {columnVisibility.createdDate && (
                        <th onClick={() => handleSort('CreatedDate')} style={{ cursor: 'pointer' }} className="d-none d-xl-table-cell">
                          Created {sort.sortBy === 'CreatedDate' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {!isReferralPartner && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {leadsData?.leads.leads.map((lead) => (
                      <tr key={lead.leadId}>
                        {columnVisibility.clientName && (
                          <td>
                            <div>
                              <strong className="text-truncate d-block" style={{ maxWidth: '120px' }} title={lead.clientName}>
                                {lead.clientName}
                              </strong>
                              <div className="small text-muted text-truncate" style={{ maxWidth: '120px' }} title={lead.mobileNumber}>
                                {lead.mobileNumber}
                              </div>
                              {/* Show email on mobile since email column is hidden */}
                              {lead.emailAddress && (
                                <div className="small text-muted text-truncate d-md-none" style={{ maxWidth: '120px' }} title={lead.emailAddress}>
                                  {lead.emailAddress}
                                </div>
                              )}
                              {/* Show company on mobile since company column is hidden */}
                              {lead.companyName && (
                                <div className="small text-muted d-md-none">{lead.companyName}</div>
                              )}
                            </div>
                          </td>
                        )}
                        {columnVisibility.companyName && (
                          <td className="d-none d-md-table-cell">
                            <span className="text-truncate d-inline-block" style={{ maxWidth: '100px' }} title={lead.companyName || '-'}>
                              {lead.companyName || '-'}
                            </span>
                          </td>
                        )}
                        {columnVisibility.leadDate && <td className="d-none d-md-table-cell">{formatDate(lead.leadDate)}</td>}
                        {columnVisibility.leadSource && (
                          <td className="d-none d-lg-table-cell">
                            <span className="text-truncate d-inline-block" style={{ maxWidth: '90px' }} title={lead.leadSourceName}>
                              {lead.leadSourceName}
                            </span>
                          </td>
                        )}
                        {columnVisibility.status && (
                          <td>
                            <Badge bg={getStatusVariant(lead.leadStatusName || '')} className="text-truncate" style={{ maxWidth: '90px' }} title={lead.leadStatusName}>
                              {lead.leadStatusName}
                            </Badge>
                          </td>
                        )}
                        {columnVisibility.urgency && (
                          <td className="d-none d-lg-table-cell">
                            <span 
                              className="text-truncate d-inline-block" 
                              style={{ 
                                maxWidth: '90px',
                                color: lead.urgencyLevelName?.toLowerCase().includes('immediate') ? '#dc3545' : 'inherit',
                                fontWeight: lead.urgencyLevelName?.toLowerCase().includes('immediate') ? '600' : 'normal'
                              }} 
                              title={lead.urgencyLevelName}
                            >
                              {lead.urgencyLevelName}
                            </span>
                          </td>
                        )}
                        {columnVisibility.expectedBudget && (
                          <td className="text-end d-none d-lg-table-cell">
                            {lead.expectedBudget ? `$${lead.expectedBudget.toLocaleString()}` : '-'}
                          </td>
                        )}
                        {columnVisibility.interestedIn && (
                          <td className="d-none d-xl-table-cell">
                            <div style={{ maxWidth: '150px' }}>
                              {lead.interestedIn ? (
                                <span
                                  className="text-truncate d-inline-block"
                                  style={{ maxWidth: '150px', cursor: 'pointer' }}
                                  title={lead.interestedIn}
                                >
                                  {lead.interestedIn}
                                </span>
                              ) : '-'}
                            </div>
                          </td>
                        )}
                        {columnVisibility.notes && (
                          <td className="d-none d-xl-table-cell">
                            <div style={{ maxWidth: '150px' }}>
                              {lead.notes ? (
                                <span
                                  className="text-truncate d-inline-block"
                                  style={{ maxWidth: '150px', cursor: 'pointer' }}
                                  title={lead.notes}
                                >
                                  {lead.notes}
                                </span>
                              ) : '-'}
                            </div>
                          </td>
                        )}
                        {columnVisibility.followupDate && <td className="d-none d-lg-table-cell">{formatDate(lead.followupDate)}</td>}
                        {columnVisibility.createdDate && <td className="d-none d-xl-table-cell">{formatDate(lead.createdDate)}</td>}
                        {!isReferralPartner && (
                          <td>
                            {!lead.isReadonly ? (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditLead(lead)}
                                title="Edit Lead"
                              >
                                <Edit size={14} />
                              </Button>
                            ) : (
                              <Badge bg="secondary" className="d-flex align-items-center justify-content-center" style={{ minWidth: '60px', minHeight: '31px' }}>
                                Read Only
                              </Badge>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {leadsData && renderPagination()}

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

export default MyLeads;