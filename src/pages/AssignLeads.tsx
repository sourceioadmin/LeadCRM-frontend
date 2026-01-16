import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Row, Col, Form, InputGroup, Alert, Pagination, Spinner, Modal, Dropdown } from 'react-bootstrap';
import { Filter, Search, CheckSquare, Square, UserPlus, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { getUnassignedLeads, bulkAssignLeads, getLeadSources, getLeadStatuses, getUrgencyLevels, getAssignableUsers } from '../services/leadService';
import { Lead, LeadSource, LeadStatus, Urgency } from '../types/Lead';
import { PaginatedLeadResponse } from '../services/leadService';
import { formatDate } from '../utils/dateUtils';

interface FilterState {
  dateFrom: string;
  dateTo: string;
  leadSourceId: string;
  leadStatusId: string;
  urgencyLevelId: string;
  interestedIn: string;
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
  interestedIn: boolean;
  status: boolean;
  urgency: boolean;
  followupDate: boolean;
  expectedBudget: boolean;
  createdBy: boolean;
}

interface AssignableUser {
  userId: number;
  fullName: string;
  email: string;
  roleName: string;
}

const AssignLeads: React.FC = () => {
  // State management
  const [leadsData, setLeadsData] = useState<PaginatedLeadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selection state
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Filter and pagination states
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    leadSourceId: '',
    leadStatusId: '',
    urgencyLevelId: '',
    interestedIn: '',
    search: ''
  });

  const [sort, setSort] = useState<SortState>({
    sortBy: 'LeadDate',
    sortDirection: 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    clientName: true,
    companyName: true,
    leadDate: true,
    leadSource: true,
    interestedIn: true,
    status: true,
    urgency: true,
    followupDate: true,
    expectedBudget: true,
    createdBy: true
  });

  // Dropdown options
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [urgencyLevels, setUrgencyLevels] = useState<Urgency[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);

  // Bulk assign modal state
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // Inline assign state
  const [inlineAssigning, setInlineAssigning] = useState<number | null>(null);

  // Load dropdown options on component mount
  useEffect(() => {
    loadDropdownOptions();
  }, []);

  // Load leads when filters, sort, or page changes
  useEffect(() => {
    loadUnassignedLeads();
  }, [filters, sort, currentPage, pageSize]);

  const loadDropdownOptions = async () => {
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
        setLeadStatuses(statusesRes.data.filter(s => s.isActive));
      }

      if (urgencyRes.success && urgencyRes.data) {
        setUrgencyLevels(urgencyRes.data.filter(u => u.isActive));
      }

      if (usersRes.success && usersRes.data) {
        setAssignableUsers(usersRes.data);
      }
    } catch (err) {
      console.error('Failed to load dropdown options:', err);
    }
  };

  const loadUnassignedLeads = async () => {
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
        leadSourceId: filters.leadSourceId ? parseInt(filters.leadSourceId) : undefined,
        leadStatusId: filters.leadStatusId ? parseInt(filters.leadStatusId) : undefined,
        urgencyLevelId: filters.urgencyLevelId ? parseInt(filters.urgencyLevelId) : undefined,
        interestedIn: filters.interestedIn || undefined,
        search: filters.search || undefined
      };

      const response = await getUnassignedLeads(params);

      if (response.success && response.data) {
        setLeadsData(response.data);
        setSelectedLeads(new Set()); // Clear selection on data reload
        setSelectAll(false);
      } else {
        setError(response.message || 'Failed to load unassigned leads');
      }
    } catch (err: any) {
      console.error('Load unassigned leads error:', err);
      setError(err.response?.data?.message || 'Failed to load unassigned leads');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleSort = (sortBy: string) => {
    setSort(prev => ({
      sortBy,
      sortDirection: prev.sortBy === sortBy && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      leadSourceId: '',
      leadStatusId: '',
      urgencyLevelId: '',
      interestedIn: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads(new Set());
    } else {
      const allLeadIds = leadsData?.leads.map(lead => lead.leadId) || [];
      setSelectedLeads(new Set(allLeadIds));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectLead = (leadId: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
    setSelectAll(newSelected.size === leadsData?.leads.length);
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const handleInlineAssign = async (leadId: number, userId: number) => {
    setInlineAssigning(leadId);
    setError(null);
    setSuccess(null);

    try {
      const response = await bulkAssignLeads([leadId], userId);
      if (response.success) {
        const userName = assignableUsers.find(u => u.userId === userId)?.fullName || 'User';
        setSuccess(`Lead assigned successfully to ${userName}`);
        loadUnassignedLeads(); // Refresh the list
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to assign lead');
      }
    } catch (err: any) {
      console.error('Inline assign error:', err);
      setError(err.response?.data?.message || 'Failed to assign lead');
    } finally {
      setInlineAssigning(null);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedUserId || selectedLeads.size === 0) {
      setError('Please select a user and at least one lead');
      return;
    }

    setBulkAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      const leadIds = Array.from(selectedLeads);
      const response = await bulkAssignLeads(leadIds, selectedUserId);
      
      if (response.success) {
        const userName = assignableUsers.find(u => u.userId === selectedUserId)?.fullName || 'User';
        setSuccess(`${response.data?.updatedCount || leadIds.length} lead(s) assigned successfully to ${userName}`);
        setShowBulkAssignModal(false);
        setSelectedLeads(new Set());
        setSelectAll(false);
        setSelectedUserId(null);
        loadUnassignedLeads(); // Refresh the list
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(response.message || 'Failed to assign leads');
      }
    } catch (err: any) {
      console.error('Bulk assign error:', err);
      setError(err.response?.data?.message || 'Failed to assign leads');
    } finally {
      setBulkAssigning(false);
    }
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

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderSortIcon = (column: string) => {
    if (sort.sortBy !== column) return null;
    return sort.sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const renderPagination = () => {
    if (!leadsData?.totalPages || leadsData.totalPages <= 1) return null;

    return (
      <Card className="mt-3">
        <Card.Body className="py-2">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
            <span className="text-muted small">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, leadsData.totalCount)} of {leadsData.totalCount} leads
            </span>
            <Pagination className="mb-0">
              <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
              <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} />
              <Pagination.Item active>{currentPage}</Pagination.Item>
              <Pagination.Item disabled>of {leadsData.totalPages}</Pagination.Item>
              <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(leadsData.totalPages, prev + 1))} disabled={currentPage === leadsData.totalPages} />
              <Pagination.Last onClick={() => setCurrentPage(leadsData.totalPages)} disabled={currentPage === leadsData.totalPages} />
            </Pagination>
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="container-fluid py-4">
      {/* Mobile-first header: stack vertically on mobile, side-by-side on larger */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div className="flex-grow-1">
          <h2 className="mb-1">Assign Leads</h2>
          <p className="text-muted mb-0">Assign unassigned leads to team members</p>
        </div>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <div style={{ width: '300px' }}>
            <InputGroup size="sm">
              <InputGroup.Text>
                <Search size={16} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by client name, company, email..."
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
                  {columnVisibility[column as keyof ColumnVisibility] ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span className="ms-2">{column.replace(/([A-Z])/g, ' $1').trim()}</span>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Button
            variant="primary"
            disabled={selectedLeads.size === 0}
            onClick={() => setShowBulkAssignModal(true)}
            className="w-100 w-md-auto mt-2 mt-md-0"
          >
            <UserPlus size={18} className="me-2" />
            <span className="d-none d-sm-inline">Bulk Assign</span> ({selectedLeads.size})
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

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

            <Row className="mb-3 g-3">
              <Col xs={12} md={12}>
                <Form.Group>
                  <Form.Label className="small">Interested In</Form.Label>
                  <Form.Control
                    type="text"
                    size="sm"
                    placeholder="Search by product/service interest..."
                    value={filters.interestedIn}
                    onChange={(e) => handleFilterChange('interestedIn', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col xs={12} className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-end">
                <Button variant="outline-secondary" onClick={clearFilters} className="flex-fill">
                  Clear Filters
                </Button>
                <Button variant="primary" onClick={() => loadUnassignedLeads()} className="flex-fill">
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
            <h5 className="mb-0">Unassigned Leads ({leadsData?.totalCount || 0})</h5>
            <Button variant="outline-primary" size="sm" onClick={() => loadUnassignedLeads()} disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Refresh'}
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-2">Loading unassigned leads...</p>
            </div>
          ) : leadsData && leadsData.leads.length > 0 ? (
            <div className="table-responsive">
              {/* Mobile Card View (xs/sm screens) */}
              <div className="d-block d-md-none">
                <div className="row g-3">
                  {leadsData.leads.map((lead) => (
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
                            <div className="d-flex gap-1">
                              <Form.Check
                                type="checkbox"
                                checked={selectedLeads.has(lead.leadId)}
                                onChange={() => toggleSelectLead(lead.leadId)}
                                className="ms-2"
                              />
                              <Badge bg={getStatusVariant(lead.leadStatusName || '')} className="ms-2 flex-shrink-0">
                                {lead.leadStatusName}
                              </Badge>
                            </div>
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
                            <div className="col-6">
                              <small className="text-muted d-block"><i className="bi bi-calendar me-1"></i>Lead Date</small>
                              <span>{formatDate(lead.leadDate)}</span>
                            </div>
                            <div className="col-6">
                              <small className="text-muted d-block"><i className="bi bi-diagram-3 me-1"></i>Source</small>
                              <span className="text-truncate d-block" style={{ maxWidth: '100px' }} title={lead.leadSourceName}>
                                {lead.leadSourceName}
                              </span>
                            </div>
                            {lead.urgencyLevelName && (
                              <div className="col-6">
                                <small className="text-muted d-block"><i className="bi bi-exclamation-triangle me-1"></i>Urgency</small>
                                <span 
                                  className="text-truncate d-block" 
                                  style={{ 
                                    maxWidth: '100px',
                                    color: lead.urgencyLevelName.toLowerCase().includes('immediate') ? '#dc3545' : 'inherit',
                                    fontWeight: lead.urgencyLevelName.toLowerCase().includes('immediate') ? '600' : 'normal'
                                  }} 
                                  title={lead.urgencyLevelName}
                                >
                                  {lead.urgencyLevelName}
                                </span>
                              </div>
                            )}
                            {lead.expectedBudget && (
                              <div className="col-6">
                                <small className="text-muted d-block"><i className="bi bi-cash me-1"></i>Budget</small>
                                <span className="fw-medium">
                                  {formatCurrency(lead.expectedBudget)}
                                </span>
                              </div>
                            )}
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
                            {lead.createdByUserName && (
                              <div className="col-6">
                                <small className="text-muted d-block"><i className="bi bi-person me-1"></i>Created By</small>
                                <span>{lead.createdByUserName}</span>
                              </div>
                            )}
                          </div>

                          {/* Assign To dropdown for mobile */}
                          <div className="mt-3 pt-2 border-top">
                            <Form.Group>
                              <Form.Label className="small fw-medium">Assign To:</Form.Label>
                              <Form.Select
                                size="sm"
                                disabled={inlineAssigning === lead.leadId}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleInlineAssign(lead.leadId, parseInt(e.target.value));
                                  }
                                }}
                                value=""
                              >
                                <option value="">Select user...</option>
                                {assignableUsers.map(user => (
                                  <option key={user.userId} value={user.userId}>
                                    {user.fullName} ({user.roleName})
                                  </option>
                                ))}
                              </Form.Select>
                              {inlineAssigning === lead.leadId && (
                                <div className="mt-2 text-center">
                                  <Spinner size="sm" />
                                  <small className="text-muted ms-2">Assigning...</small>
                                </div>
                              )}
                            </Form.Group>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View (md+ screens) */}
              <div className="d-none d-md-block">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: '50px' }}>
                        <Form.Check
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      {columnVisibility.clientName && (
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ClientName')}>
                          Client Name {renderSortIcon('ClientName')}
                        </th>
                      )}
                      {columnVisibility.companyName && (
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('CompanyName')}>
                          Company {renderSortIcon('CompanyName')}
                        </th>
                      )}
                      {columnVisibility.leadDate && (
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('LeadDate')}>
                          Lead Date {renderSortIcon('LeadDate')}
                        </th>
                      )}
                      {columnVisibility.leadSource && <th>Lead Source</th>}
                      {columnVisibility.interestedIn && <th>Interested In</th>}
                      {columnVisibility.status && <th>Status</th>}
                      {columnVisibility.urgency && <th>Urgency</th>}
                      {columnVisibility.followupDate && (
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('FollowupDate')}>
                          Follow-up {renderSortIcon('FollowupDate')}
                        </th>
                      )}
                      {columnVisibility.expectedBudget && (
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ExpectedBudget')}>
                          Budget {renderSortIcon('ExpectedBudget')}
                        </th>
                      )}
                      {columnVisibility.createdBy && <th>Created By</th>}
                      <th style={{ width: '200px' }}>Assign To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsData.leads.map((lead) => (
                      <tr key={lead.leadId}>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedLeads.has(lead.leadId)}
                            onChange={() => toggleSelectLead(lead.leadId)}
                          />
                        </td>
                        {columnVisibility.clientName && <td><strong>{lead.clientName}</strong></td>}
                        {columnVisibility.companyName && <td>{lead.companyName || '-'}</td>}
                        {columnVisibility.leadDate && <td>{formatDate(lead.leadDate)}</td>}
                        {columnVisibility.leadSource && <td>{lead.leadSourceName || '-'}</td>}
                        {columnVisibility.interestedIn && (
                          <td>
                            {lead.interestedIn ? (
                              <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }} title={lead.interestedIn}>
                                {lead.interestedIn}
                              </span>
                            ) : '-'}
                          </td>
                        )}
                        {columnVisibility.status && (
                          <td>
                            <Badge bg={getStatusVariant(lead.leadStatusName || '')}>
                              {lead.leadStatusName}
                            </Badge>
                          </td>
                        )}
                        {columnVisibility.urgency && (
                          <td>
                            {lead.urgencyLevelName ? (
                              <span
                                style={{
                                  color: lead.urgencyLevelName.toLowerCase().includes('immediate') ? '#dc3545' : 'inherit',
                                  fontWeight: lead.urgencyLevelName.toLowerCase().includes('immediate') ? '600' : 'normal'
                                }}
                              >
                                {lead.urgencyLevelName}
                              </span>
                            ) : '-'}
                          </td>
                        )}
                        {columnVisibility.followupDate && <td>{formatDate(lead.followupDate)}</td>}
                        {columnVisibility.expectedBudget && <td>{formatCurrency(lead.expectedBudget)}</td>}
                        {columnVisibility.createdBy && <td>{lead.createdByUserName || '-'}</td>}
                        <td>
                          <Form.Select
                            size="sm"
                            disabled={inlineAssigning === lead.leadId}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleInlineAssign(lead.leadId, parseInt(e.target.value));
                              }
                            }}
                            value=""
                          >
                            <option value="">Select user...</option>
                            {assignableUsers.map(user => (
                              <option key={user.userId} value={user.userId}>
                                {user.fullName} ({user.roleName})
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No unassigned leads found</p>
              {(Object.values(filters).some(v => v !== '') || filters.search) && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters to see all unassigned leads
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Pagination Controls */}
      {leadsData && renderPagination()}

      {/* Bulk Assign Modal */}
      <Modal show={showBulkAssignModal} onHide={() => setShowBulkAssignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Bulk Assign Leads</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Assign {selectedLeads.size} selected lead(s) to:
          </p>
          <Form.Group>
            <Form.Label>Select User</Form.Label>
            <Form.Select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
            >
              <option value="">Choose a user...</option>
              {assignableUsers.map(user => (
                <option key={user.userId} value={user.userId}>
                  {user.fullName} - {user.roleName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkAssignModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleBulkAssign}
            disabled={!selectedUserId || bulkAssigning}
          >
            {bulkAssigning ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus size={18} className="me-2" />
                Assign Leads
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AssignLeads;
