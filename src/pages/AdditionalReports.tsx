import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Alert, Spinner, InputGroup, Dropdown, Table, Badge, Pagination } from 'react-bootstrap';
import { Filter, RefreshCw, Search, Download, Edit, Eye } from 'lucide-react';
import { getUsers } from '../services/userService';
import { getLeadSources, getLeadStatuses, getUrgencyLevels, exportLeads, getAllLeads, AllLeadsResponse } from '../services/leadService';
import { LeadSource, LeadStatus, Urgency, Lead } from '../types/Lead';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';

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
  leadSourceId: string;
  leadStatusId: string;
  urgencyLevelId: string;
  budgetMin: string;
  budgetMax: string;
  assignedUserId: string;
  search: string;
}

const AdditionalReports: React.FC = () => {
  const { user } = useAuth();

  // Debug logging
  console.log('AdditionalReports component rendered');
  console.log('User:', user);

  // Error states
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    followupDateFrom: '',
    followupDateTo: '',
    leadSourceId: '',
    leadStatusId: '',
    urgencyLevelId: '',
    budgetMin: '',
    budgetMax: '',
    assignedUserId: '',
    search: ''
  });

  // Dropdown data
  const [users, setUsers] = useState<User[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [urgencyLevels, setUrgencyLevels] = useState<Urgency[]>([]);

  // Filter visibility
  const [showFilters, setShowFilters] = useState(false);

  // Export loading state
  const [exportLoading, setExportLoading] = useState(false);

  // Leads data and loading states
  const [leadsData, setLeadsData] = useState<AllLeadsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination and sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ sortBy: string; sortDirection: 'asc' | 'desc' }>({
    sortBy: 'LeadDate',
    sortDirection: 'desc'
  });

  // Load dropdown data on component mount
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [usersResponse, sourcesRes, statusesRes, urgencyRes] = await Promise.all([
          getUsers(),
          getLeadSources(),
          getLeadStatuses(),
          getUrgencyLevels()
        ]);

        if (usersResponse.success && usersResponse.data) {
          console.log('Loaded users:', usersResponse.data);
          // Filter out any users with invalid userId
          const validUsers = usersResponse.data.filter(user => user.userId != null);
          console.log('Valid users after filtering:', validUsers);
          setUsers(validUsers);
        }

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
        console.error('Error loading dropdown data:', err);
      }
    };

    loadDropdownData();
  }, []);

  // Load leads when filters, sort, or page changes (only if filters are active)
  useEffect(() => {
    if (hasActiveFilters()) {
      loadAllLeads();
    } else {
      // Clear data when no filters are active
      setLeadsData(null);
    }
  }, [filters, sort, currentPage, pageSize]);



  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const loadAllLeads = async () => {
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
        leadSourceId: filters.leadSourceId ? parseInt(filters.leadSourceId) : undefined,
        leadStatusId: filters.leadStatusId ? parseInt(filters.leadStatusId) : undefined,
        urgencyLevelId: filters.urgencyLevelId ? parseInt(filters.urgencyLevelId) : undefined,
        assignedToUserId: filters.assignedUserId ? parseInt(filters.assignedUserId) : undefined,
        budgetMin: filters.budgetMin ? parseFloat(filters.budgetMin) : undefined,
        budgetMax: filters.budgetMax ? parseFloat(filters.budgetMax) : undefined,
        search: filters.search || undefined
      };

      const response = await getAllLeads(params);

      if (response.success && response.data) {
        setLeadsData(response.data);
      } else {
        setError(response.message || 'Failed to load leads');
      }
    } catch (err: any) {
      console.error('Load all leads error:', err);
      setError(err.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (sortBy: string) => {
    setSort(prev => ({
      sortBy,
      sortDirection: prev.sortBy === sortBy && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRefresh = () => {
    loadAllLeads();
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      followupDateFrom: '',
      followupDateTo: '',
      leadSourceId: '',
      leadStatusId: '',
      urgencyLevelId: '',
      budgetMin: '',
      budgetMax: '',
      assignedUserId: '',
      search: ''
    });
    setCurrentPage(1);
    // Clear leads data when filters are cleared
    setLeadsData(null);
  };

  const hasActiveFilters = () => {
    return (
      filters.dateFrom ||
      filters.dateTo ||
      filters.followupDateFrom ||
      filters.followupDateTo ||
      filters.leadSourceId ||
      filters.leadStatusId ||
      filters.urgencyLevelId ||
      filters.budgetMin ||
      filters.budgetMax ||
      filters.assignedUserId ||
      filters.search ||
      false
    );
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

  const handleExport = async (format: 'excel' | 'csv' = 'excel') => {
    setExportLoading(true);
    setError(null);

    try {
      const params = {
        format,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        followupDateFrom: filters.followupDateFrom || undefined,
        followupDateTo: filters.followupDateTo || undefined,
        leadSourceId: filters.leadSourceId ? parseInt(filters.leadSourceId) : undefined,
        leadStatusId: filters.leadStatusId ? parseInt(filters.leadStatusId) : undefined,
        urgencyLevelId: filters.urgencyLevelId ? parseInt(filters.urgencyLevelId) : undefined,
        assignedToUserId: filters.assignedUserId ? parseInt(filters.assignedUserId) : undefined,
        budgetMin: filters.budgetMin ? parseFloat(filters.budgetMin) : undefined,
        budgetMax: filters.budgetMax ? parseFloat(filters.budgetMax) : undefined,
        search: filters.search || undefined
      };

      const blob = await exportLeads(params);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export leads');
      console.error('Export error:', err);
    } finally {
      setExportLoading(false);
    }
  };


  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div className="flex-grow-1">
          <h2 className="mb-1">Additional Analytics</h2>
          <p className="text-muted mb-0">Comprehensive lead distribution and team performance insights</p>
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
            <Dropdown.Toggle variant="outline-success" disabled={exportLoading}>
              <Download size={18} className="me-2" />
              <span className="d-none d-sm-inline">Export</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleExport('excel')}>
                Export as Excel (.xlsx)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleExport('csv')}>
                Export as CSV (.csv)
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button
            variant="outline-primary"
            onClick={handleRefresh}
            className="flex-grow-1 flex-md-grow-0"
          >
            <RefreshCw size={16} className="me-2" />
            <span className="d-none d-sm-inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          <strong>Error:</strong> {error}
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
                    value={filters.assignedUserId}
                    onChange={(e) => handleFilterChange('assignedUserId', e.target.value)}
                  >
                    <option value="">All Users</option>
                    {users
                      .filter(user => user.userId != null)
                      .map(user => (
                        <option key={user.userId} value={user.userId.toString()}>
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
                <Button variant="primary" onClick={handleRefresh} className="flex-fill">
                  Apply Filters
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Leads Table - Only show when filters are applied */}
      {hasActiveFilters() && (
        <>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Filtered Leads ({leadsData?.leads.totalCount || 0})</h5>
                <Button variant="outline-primary" size="sm" onClick={loadAllLeads} disabled={loading}>
                  {loading ? <Spinner size="sm" /> : 'Refresh'}
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading leads...</p>
                </div>
              ) : leadsData?.leads.leads.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No leads found matching your criteria.</p>
                  <Button variant="primary" onClick={clearFilters}>
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
                          <Card className="h-100 shadow-sm">
                            <Card.Body className="p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="flex-grow-1">
                                  <h6 className="mb-1 text-truncate" title={lead.clientName}>
                                    {lead.clientName}
                                  </h6>
                                  {lead.companyName && (
                                    <small className="text-muted d-block text-truncate" title={lead.companyName}>
                                      <i className="bi bi-building me-1"></i>{lead.companyName}
                                    </small>
                                  )}
                                </div>
                                <Badge bg={getStatusVariant(lead.leadStatusName || '')} className="ms-2 flex-shrink-0">
                                  {lead.leadStatusName}
                                </Badge>
                              </div>

                              <div className="row g-2 text-sm">
                                {lead.mobileNumber && (
                                  <div className="col-6">
                                    <small className="text-muted d-block"><i className="bi bi-phone me-1"></i>Phone</small>
                                    <span className="text-truncate d-block" title={lead.mobileNumber}>
                                      {lead.mobileNumber}
                                    </span>
                                  </div>
                                )}
                                {lead.emailAddress && (
                                  <div className="col-6">
                                    <small className="text-muted d-block"><i className="bi bi-envelope me-1"></i>Email</small>
                                    <span className="text-truncate d-block" title={lead.emailAddress}>
                                      {lead.emailAddress}
                                    </span>
                                  </div>
                                )}
                                <div className="col-6">
                                  <small className="text-muted d-block"><i className="bi bi-calendar me-1"></i>Lead Date</small>
                                  <span>{formatDate(lead.leadDate)}</span>
                                </div>
                                <div className="col-6">
                                  <small className="text-muted d-block"><i className="bi bi-diagram-3 me-1"></i>Source</small>
                                  <Badge bg="light" text="dark" className="text-truncate" style={{ maxWidth: '100px' }} title={lead.leadSourceName}>
                                    {lead.leadSourceName}
                                  </Badge>
                                </div>
                                <div className="col-6">
                                  <small className="text-muted d-block"><i className="bi bi-exclamation-triangle me-1"></i>Urgency</small>
                                  <Badge bg={getUrgencyVariant(lead.urgencyLevelName || '')} className="text-truncate" style={{ maxWidth: '100px' }} title={lead.urgencyLevelName}>
                                    {lead.urgencyLevelName}
                                  </Badge>
                                </div>
                                <div className="col-6">
                                  <small className="text-muted d-block"><i className="bi bi-cash me-1"></i>Budget</small>
                                  <span className="fw-medium">
                                    {lead.expectedBudget ? `$${lead.expectedBudget.toLocaleString()}` : 'Not specified'}
                                  </span>
                                </div>
                                {lead.followupDate && (
                                  <div className="col-6">
                                    <small className="text-muted d-block"><i className="bi bi-telephone me-1"></i>Follow-up</small>
                                    <span>{formatDate(lead.followupDate)}</span>
                                  </div>
                                )}
                                {lead.interestedIn && (
                                  <div className="col-12">
                                    <small className="text-muted d-block"><i className="bi bi-target me-1"></i>Interested In</small>
                                    <span className="text-truncate d-block" title={lead.interestedIn}>
                                      {lead.interestedIn}
                                    </span>
                                  </div>
                                )}
                              </div>
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
                            <th onClick={() => handleSort('ClientName')} style={{ cursor: 'pointer' }}>
                              Client {sort.sortBy === 'ClientName' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('CompanyName')} style={{ cursor: 'pointer' }} className="d-none d-md-table-cell">
                              Company {sort.sortBy === 'CompanyName' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('LeadDate')} style={{ cursor: 'pointer' }} className="d-none d-md-table-cell">
                              Lead Date {sort.sortBy === 'LeadDate' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="d-none d-lg-table-cell">Source</th>
                            <th>Status</th>
                            <th className="d-none d-lg-table-cell">Urgency</th>
                            <th onClick={() => handleSort('ExpectedBudget')} style={{ cursor: 'pointer' }} className="d-none d-lg-table-cell">
                              Budget {sort.sortBy === 'ExpectedBudget' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="d-none d-xl-table-cell">Interested In</th>
                            <th onClick={() => handleSort('FollowupDate')} style={{ cursor: 'pointer' }} className="d-none d-lg-table-cell">
                              Follow-up {sort.sortBy === 'FollowupDate' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('CreatedDate')} style={{ cursor: 'pointer' }} className="d-none d-xl-table-cell">
                              Created {sort.sortBy === 'CreatedDate' && (sort.sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {leadsData?.leads.leads.map((lead) => (
                            <tr key={lead.leadId}>
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
                              <td className="d-none d-md-table-cell">
                                <span className="text-truncate d-inline-block" style={{ maxWidth: '100px' }} title={lead.companyName || '-'}>
                                  {lead.companyName || '-'}
                                </span>
                              </td>
                              <td className="d-none d-md-table-cell">{formatDate(lead.leadDate)}</td>
                              <td className="d-none d-lg-table-cell">
                                <Badge bg="light" text="dark" className="text-truncate" style={{ maxWidth: '90px' }} title={lead.leadSourceName}>
                                  {lead.leadSourceName}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={getStatusVariant(lead.leadStatusName || '')} className="text-truncate" style={{ maxWidth: '90px' }} title={lead.leadStatusName}>
                                  {lead.leadStatusName}
                                </Badge>
                              </td>
                              <td className="d-none d-lg-table-cell">
                                <Badge bg={getUrgencyVariant(lead.urgencyLevelName || '')} className="text-truncate" style={{ maxWidth: '90px' }} title={lead.urgencyLevelName}>
                                  {lead.urgencyLevelName}
                                </Badge>
                              </td>
                              <td className="text-end d-none d-lg-table-cell">
                                {lead.expectedBudget ? `$${lead.expectedBudget.toLocaleString()}` : '-'}
                              </td>
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
                              <td className="d-none d-lg-table-cell">{formatDate(lead.followupDate)}</td>
                              <td className="d-none d-xl-table-cell">{formatDate(lead.createdDate)}</td>
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

          {/* Pagination Controls */}
          {leadsData && leadsData.leads.totalPages > 1 && (
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
          )}
        </>
      )}

      {/* Instructions when no filters are applied */}
      {!hasActiveFilters() && (
        <Card className="text-center py-5">
          <Card.Body>
            <div className="mb-4">
              <Filter size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Apply Filters to View Leads</h5>
              <p className="text-muted mb-4">
                Use the filter options above to search and filter leads based on your criteria.
                The leads table will appear here once you apply filters.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowFilters(true)}
              className="me-2"
            >
              <Filter size={16} className="me-2" />
              Show Filters
            </Button>
          </Card.Body>
        </Card>
      )}

    </div>
  );
};

export default AdditionalReports;