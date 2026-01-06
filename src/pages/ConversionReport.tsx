import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Form, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { Filter, TrendingUp, Calendar, Users, Target, RefreshCw, User } from 'lucide-react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { getConversionReport, getTeamPerformance } from '../services/reportService';
import { getLeadSources } from '../services/leadService';
import { getUsers } from '../services/userService';
import { ConversionReport as ConversionReportType, TeamPerformance } from '../types/Reports';
import { LeadSource } from '../types/Lead';
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
  leadSourceId: string;
  assignedUserId: string;
}


// Bar chart colors
const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

const ConversionReport: React.FC = () => {
  const { user } = useAuth();

  // State management
  const [reportData, setReportData] = useState<ConversionReportType | null>(null);
  const [teamPerformanceData, setTeamPerformanceData] = useState<TeamPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    leadSourceId: '',
    assignedUserId: '',
  });

  // Dropdown data
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Load dropdown data on component mount
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [leadSourcesResponse, usersResponse] = await Promise.all([
          getLeadSources(),
          getUsers()
        ]);

        if (leadSourcesResponse.success && leadSourcesResponse.data) {
          setLeadSources(leadSourcesResponse.data);
        }

        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data);
        }
      } catch (err) {
        console.error('Error loading dropdown data:', err);
      }
    };

    loadDropdownData();
  }, []);

  // Load report data
  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.leadSourceId && { leadSourceId: parseInt(filters.leadSourceId) }),
        ...(filters.assignedUserId && { assignedUserId: parseInt(filters.assignedUserId) }),
      };

      const response = await getConversionReport(params);

      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        setError(response.message || 'Failed to load conversion report');
      }
    } catch (err) {
      console.error('Error loading conversion report:', err);
      setError('An error occurred while loading the conversion report');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load team performance data
  const loadTeamPerformance = useCallback(async () => {
    setLoadingTeam(true);

    try {
      const params = {
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      };

      const response = await getTeamPerformance(params);

      if (response.success && response.data) {
        setTeamPerformanceData(response.data);
      } else {
        console.error('Failed to load team performance data:', response.message);
      }
    } catch (err) {
      console.error('Error loading team performance:', err);
    } finally {
      setLoadingTeam(false);
    }
  }, [filters.dateFrom, filters.dateTo]);

  // Load report and team performance on component mount
  useEffect(() => {
    loadReportData();
    loadTeamPerformance();
  }, []);

  // Handle filter changes
  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    loadReportData();
    loadTeamPerformance();
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      leadSourceId: '',
      assignedUserId: '',
    });
    setTimeout(() => {
      loadReportData();
      loadTeamPerformance();
    }, 0);
  };



  // ApexCharts Bar Chart Configuration for Top Lead Sources
  const barChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        distributed: true,
        columnWidth: '60%',
      }
    },
    colors: BAR_COLORS,
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return `${val}%`;
      },
      style: {
        fontSize: '11px',
        colors: ['#fff']
      },
      offsetY: -25
    },
    xaxis: {
      categories: reportData?.topLeadSources.map(s =>
        s.leadSourceName.length > 15 ? s.leadSourceName.substring(0, 15) + '...' : s.leadSourceName
      ) || [],
      labels: {
        style: {
          fontSize: '12px'
        },
        rotate: -45
      }
    },
    yaxis: {
      max: 100,
      labels: {
        formatter: function (val: number) {
          return `${val}%`;
        },
        style: {
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    tooltip: {
      enabled: true,
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const source = reportData?.topLeadSources[dataPointIndex];
        if (!source) return '';
        
        return `
          <div style="padding: 12px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="font-weight: 600; font-size: 14px; color: ${BAR_COLORS[dataPointIndex]}; margin-bottom: 8px;">
              ${source.leadSourceName}
            </div>
            <div style="color: #374151; margin-bottom: 4px;">
              Total Leads: <strong>${source.totalLeads}</strong>
            </div>
            <div style="color: #22c55e; margin-bottom: 4px;">
              Converted: <strong>${source.convertedLeads}</strong>
            </div>
            <div style="color: #6366f1;">
              Conversion Rate: <strong>${source.conversionRate}%</strong>
            </div>
          </div>
        `;
      }
    },
    legend: {
      show: false
    }
  };

  const barChartSeries = [{
    name: 'Conversion Rate',
    data: reportData?.topLeadSources.map(s => s.conversionRate) || []
  }];

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <Target className="me-2" size={28} />
            Conversion Report
          </h2>
          <p className="text-muted mb-0">Track your lead conversion performance and analytics</p>
        </div>
        <Button variant="outline-primary" onClick={loadReportData} disabled={loading}>
          <RefreshCw className={`me-2 ${loading ? 'spin' : ''}`} size={16} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">
            <Filter className="me-2" size={18} />
            Filters
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-medium">Date From</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-medium">Date To</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-medium">Lead Source</Form.Label>
                <Form.Select
                  value={filters.leadSourceId}
                  onChange={(e) => handleFilterChange('leadSourceId', e.target.value)}
                >
                  <option value="">All Sources</option>
                  {leadSources.map(source => (
                    <option key={source.leadSourceId} value={source.leadSourceId.toString()}>
                      {source.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
            <Form.Group>
  <Form.Label className="fw-medium">Assigned User</Form.Label>
  <Form.Select
    value={filters.assignedUserId}
    onChange={(e) => handleFilterChange('assignedUserId', e.target.value)}
  >
    <option value="">All Users</option>
    {users.map((u, index) => (
      <option 
        key={u.userId ?? `user-${index}`}
        value={(u.userId ?? index).toString()}
      >
        {u.fullName ?? 'Unknown User'}
      </option>
    ))}
  </Form.Select>
</Form.Group>

            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Button variant="primary" onClick={handleApplyFilters} disabled={loading}>
                {loading ? (
                  <div>
                    <Spinner size="sm" className="me-2" />
                    Loading...
                  </div>
                ) : (
                  <div>
                    <TrendingUp className="me-2" size={16} />
                    Apply Filters
                  </div>
                )}
              </Button>
              <Button variant="outline-secondary" className="ms-2" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          <Alert.Heading>Error</Alert.Heading>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && !reportData && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading conversion report...</p>
        </div>
      )}

      {/* No Data State */}
      {!loading && reportData && reportData.totalLeads === 0 && (
        <Alert variant="info" className="mb-4">
          <Alert.Heading>No Data Available</Alert.Heading>
          <p className="mb-0">No leads found for the selected filters. Try adjusting your date range or other filter criteria.</p>
        </Alert>
      )}

      {/* Report Content */}
      {reportData && reportData.totalLeads > 0 && (
        <div>
          {/* Key Metrics Cards */}
          <Row className="mb-4 g-3">
            <Col md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                      <Target size={28} className="text-primary" />
                    </div>
                  </div>
                  <h6 className="text-muted mb-2">Overall Conversion Rate</h6>
                  <h2 className="text-primary mb-2">{reportData.overallConversionRate}%</h2>
                  <small className="text-muted">
                    {reportData.totalConvertedLeads} of {reportData.totalLeads} leads converted
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div className="rounded-circle bg-success bg-opacity-10 p-3">
                      <Calendar size={28} className="text-success" />
                    </div>
                  </div>
                  <h6 className="text-muted mb-2">Avg Days to Convert</h6>
                  <h2 className="text-success mb-2">{reportData.averageDaysToConversion}</h2>
                  <small className="text-muted">days on average</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div className="rounded-circle bg-info bg-opacity-10 p-3">
                      <Users size={28} className="text-info" />
                    </div>
                  </div>
                  <h6 className="text-muted mb-2">Total Converted</h6>
                  <h2 className="text-info mb-2">{reportData.totalConvertedLeads}</h2>
                  <small className="text-muted">successfully converted</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                      <TrendingUp size={28} className="text-warning" />
                    </div>
                  </div>
                  <h6 className="text-muted mb-2">Total Leads</h6>
                  <h2 className="text-warning mb-2">{reportData.totalLeads}</h2>
                  <small className="text-muted">in the pipeline</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4">
            {/* Top Performing Sources Chart */}
            <Col lg={6}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="mb-0">
                    <Target className="me-2" size={20} />
                    Top Performing Sources
                  </h5>
                </Card.Header>
                <Card.Body>
                  {reportData.topLeadSources.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No lead source data available</p>
                    </div>
                  ) : (
                    <div style={{ width: '100%', minHeight: '300px' }}>
                      <Chart
                        options={barChartOptions}
                        series={barChartSeries}
                        type="bar"
                        height={300}
                      />
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Detailed Source Metrics Table */}
            <Col lg={6}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="mb-0">
                    <Target className="me-2" size={20} />
                    Detailed Source Metrics
                  </h5>
                </Card.Header>
                <Card.Body>
                  {reportData.topLeadSources.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No lead source data available</p>
                    </div>
                  ) : (
                    <div className="table-responsive h-100">
                      <Table hover size="sm" className="align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Source</th>
                            <th className="text-center">Total</th>
                            <th className="text-center">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.topLeadSources.map((source, index) => (
                            <tr key={source.leadSourceName}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div
                                    className="rounded-circle me-2"
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      backgroundColor: BAR_COLORS[index % BAR_COLORS.length]
                                    }}
                                  />
                                  <span
                                    className="text-truncate"
                                    style={{ maxWidth: '120px' }}
                                    title={source.leadSourceName}
                                  >
                                    {source.leadSourceName}
                                  </span>
                                </div>
                              </td>
                              <td className="text-center">
                                <small className="text-muted">{source.convertedLeads}/{source.totalLeads}</small>
                              </td>
                              <td className="text-center">
                                <Badge
                                  bg={source.conversionRate >= 50 ? 'success' : source.conversionRate >= 25 ? 'warning' : 'secondary'}
                                  className="px-1"
                                  style={{ fontSize: '0.7rem' }}
                                >
                                  {source.conversionRate}%
                                </Badge>
                              </td>
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

          {/* Team Performance Table */}
          <Row className="mt-4">
            <Col lg={12}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white border-bottom">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <Users size={20} className="me-2" />
                      <h5 className="mb-0">Team Performance</h5>
                    </div>
                    {loadingTeam && <Spinner size="sm" animation="border" />}
                  </div>
                </Card.Header>
                <Card.Body>
                  {teamPerformanceData.length > 0 ? (
                    <div className="table-responsive">
                      <Table striped hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Team Member</th>
                            <th className="text-center">Leads Assigned</th>
                            <th className="text-center">Converted</th>
                            <th className="text-center">Conversion Rate</th>
                            <th className="text-center">Avg Conversion Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamPerformanceData.map((member) => (
                            <tr key={member.userId}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <User size={16} className="me-2 text-muted" />
                                  <span className="fw-medium">{member.memberName}</span>
                                </div>
                              </td>
                              <td className="text-center">
                                <Badge bg="primary" className="fs-6 px-3 py-2">
                                  {member.leadsAssigned}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge bg="success" className="fs-6 px-3 py-2">
                                  {member.convertedLeads}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge
                                  bg={(member.conversionRate ?? 0) >= 50 ? "success" : (member.conversionRate ?? 0) >= 25 ? "warning" : "danger"}
                                  className="fs-6 px-3 py-2"
                                >
                                  {(member.conversionRate ?? 0).toFixed(1)}%
                                </Badge>
                              </td>
                              <td className="text-center">
                                {member.averageConversionTime != null ? (
                                  <span className="fw-medium">{member.averageConversionTime.toFixed(1)} days</span>
                                ) : (
                                  <span className="text-muted">N/A</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-5">
                      {loadingTeam ? (
                        <div>
                          <Spinner animation="border" />
                          <p className="mt-2">Loading team performance...</p>
                        </div>
                      ) : (
                        <p>No team performance data available</p>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .apexcharts-tooltip {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default ConversionReport;
