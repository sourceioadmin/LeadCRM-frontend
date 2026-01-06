import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Button, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { Plus, Users, Calendar, TrendingUp, PieChart as PieChartIcon, BarChart3, ArrowRight, RefreshCw } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import {
  PieChart as RechartsPieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Cell
} from 'recharts';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import AddLeadModal from '../components/AddLeadModal';
import { useAuth } from '../contexts/AuthContext';
import {
  getDashboardStats,
  getRecentLeads,
  DashboardStats,
  RecentLead
} from '../services/dashboardService';
import {
  getConversionReport,
  getLeadsBySource,
  getLeadsByStatus
} from '../services/reportService';
import {
  ConversionReport,
  LeadsBySource,
  LeadsByStatus
} from '../types/Reports';

// Funnel stage colors
const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#22c55e'];

/**
 * Custom tooltip for pie chart (from AdditionalReports)
 */
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded shadow">
        <p className="mb-1 fw-bold">{data.sourceName}</p>
        <p className="mb-1">Leads: <span className="fw-bold">{data.leadCount}</span></p>
        <p className="mb-0">Percentage: <span className="fw-bold">{data.percentage}%</span></p>
      </div>
    );
  }
  return null;
};

/**
 * Custom tooltip for bar chart (from AdditionalReports)
 */
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow">
        <p className="mb-1 fw-bold">{label}</p>
        <p className="mb-0">Leads: <span className="fw-bold">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

/**
 * Generate ApexCharts funnel configuration for dashboard
 */
const createFunnelChartOptions = (funnelStages: any[]): ApexOptions => ({
  chart: {
    type: 'bar',
    height: 300,
    toolbar: {
      show: false
    },
    animations: {
      enabled: true,
      speed: 800,
    }
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      horizontal: true,
      distributed: true,
      barHeight: '80%',
      isFunnel: true,
    },
  },
  colors: FUNNEL_COLORS,
  dataLabels: {
    enabled: true,
    formatter: function (val: number, opts: { dataPointIndex: number }) {
      const stageName = funnelStages[opts.dataPointIndex]?.stageName || '';
      return `${stageName}: ${val}`;
    },
    dropShadow: {
      enabled: false,
    },
    style: {
      fontSize: '13px',
      fontWeight: 600,
      colors: ['#fff']
    }
  },
  xaxis: {
    categories: funnelStages.map(s => s.stageName) || [],
    labels: {
      show: false
    },
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    }
  },
  yaxis: {
    labels: {
      show: false
    }
  },
  grid: {
    show: false
  },
  tooltip: {
    enabled: true,
    y: {
      formatter: function (val: number) {
        return `${val} leads`;
      },
      title: {
        formatter: function (seriesName: string) {
          return '';
        }
      }
    },
    custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
      const stage = funnelStages[dataPointIndex];
      if (!stage) return '';

      const conversionText = stage.conversionRate > 0
        ? `<div style="color: #22c55e; margin-top: 4px;">Conversion Rate: <strong>${stage.conversionRate}%</strong></div>`
        : '';

      return `
        <div style="padding: 12px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <div style="font-weight: 600; font-size: 14px; color: ${FUNNEL_COLORS[dataPointIndex]}; margin-bottom: 8px;">
            ${stage.stageName}
          </div>
          <div style="color: #374151;">
            Leads: <strong>${stage.count}</strong>
          </div>
          ${conversionText}
        </div>
      `;
    }
  },
  legend: {
    show: false
  },
  states: {
    hover: {
      filter: {
        type: 'darken'
      }
    },
    active: {
      filter: {
        type: 'darken'
      }
    }
  }
});

/**
 * Create funnel chart series data
 */
const createFunnelChartSeries = (funnelStages: any[]) => [{
  name: 'Leads',
  data: funnelStages.map(s => s.count) || []
}];

/**
 * Dashboard page component displaying statistics, recent leads, and upcoming follow-ups
 */
const Dashboard: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Error and modal states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [conversionReport, setConversionReport] = useState<ConversionReport | null>(null);
  const [leadsBySource, setLeadsBySource] = useState<LeadsBySource[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<LeadsByStatus[]>([]);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLeadsLoading, setRecentLeadsLoading] = useState(true);
  const [conversionLoading, setConversionLoading] = useState(true);
  const [leadsBySourceLoading, setLeadsBySourceLoading] = useState(true);
  const [leadsByStatusLoading, setLeadsByStatusLoading] = useState(true);

  /**
   * Fetch dashboard statistics from API
   */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /**
   * Fetch recent leads from API
   */
  const fetchRecentLeads = useCallback(async () => {
    setRecentLeadsLoading(true);
    try {
      const response = await getRecentLeads();
      if (response.success && response.data) {
        setRecentLeads(response.data);
      }
    } catch (error) {
      console.error('Error fetching recent leads:', error);
    } finally {
      setRecentLeadsLoading(false);
    }
  }, []);


  /**
   * Fetch conversion report data from API
   */
  const fetchConversionReport = useCallback(async () => {
    setConversionLoading(true);
    try {
      const response = await getConversionReport();
      if (response.success && response.data) {
        setConversionReport(response.data);
      }
    } catch (error) {
      console.error('Error fetching conversion report:', error);
    } finally {
      setConversionLoading(false);
    }
  }, []);

  /**
   * Fetch leads by source data from API
   */
  const fetchLeadsBySource = useCallback(async () => {
    setLeadsBySourceLoading(true);
    try {
      const response = await getLeadsBySource();
      if (response.success && response.data) {
        setLeadsBySource(response.data);
      }
    } catch (error) {
      console.error('Error fetching leads by source:', error);
    } finally {
      setLeadsBySourceLoading(false);
    }
  }, []);

  /**
   * Fetch leads by status data from API
   */
  const fetchLeadsByStatus = useCallback(async () => {
    setLeadsByStatusLoading(true);
    try {
      const response = await getLeadsByStatus();
      if (response.success && response.data) {
        // Limit to top 10 statuses and group remaining as "Others" for better performance
        const optimizedData = optimizeStatusData(response.data);
        setLeadsByStatus(optimizedData);
      }
    } catch (error) {
      console.error('Error fetching leads by status:', error);
    } finally {
      setLeadsByStatusLoading(false);
    }
  }, []);

  /**
   * Optimize status data for large datasets
   * Limits to top 10 statuses and groups remaining as "Others"
   */
  const optimizeStatusData = (data: LeadsByStatus[]): LeadsByStatus[] => {
    if (data.length <= 10) return data;

    // Sort by lead count descending
    const sorted = [...data].sort((a, b) => b.leadCount - a.leadCount);
    const top10 = sorted.slice(0, 10);

    // Calculate "Others" total
    const othersTotal = sorted.slice(10).reduce((sum, item) => sum + item.leadCount, 0);
    const othersPercentage = sorted.slice(10).reduce((sum, item) => sum + item.percentage, 0);

    if (othersTotal > 0) {
      top10.push({
        statusName: 'Others',
        leadCount: othersTotal,
        percentage: othersPercentage,
        displayOrder: 99,
        color: '#94a3b8'
      });
    }

    return top10;
  };

  /**
   * Load all dashboard data
   */
  const loadDashboardData = useCallback(() => {
    fetchStats();
    fetchRecentLeads();
    fetchConversionReport();
    fetchLeadsBySource();
    fetchLeadsByStatus();
  }, [fetchStats, fetchRecentLeads, fetchConversionReport, fetchLeadsBySource, fetchLeadsByStatus]);

  // Load data on mount and check for navigation errors
  useEffect(() => {
    loadDashboardData();

    // Check if there's an error message from navigation state
    if (location.state?.error) {
      setErrorMessage(location.state.error);
      // Clear the error from location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loadDashboardData]);

  /**
   * Handle successful lead creation
   */
  const handleLeadCreated = () => {
    console.log('Lead created successfully!');
    // Refresh dashboard data
    loadDashboardData();
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  /**
   * Get role badge variant based on role name
   */
  const getRoleBadgeVariant = (roleName: string): string => {
    switch (roleName) {
      case 'System Admin':
        return 'danger';
      case 'Company Admin':
        return 'primary';
      case 'Company Manager':
        return 'info';
      case 'Team Member':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  /**
   * Get status badge variant based on status name
   */
  const getStatusBadgeVariant = (statusName: string): string => {
    switch (statusName.toLowerCase()) {
      case 'new lead':
        return 'success';
      case 'contacted':
        return 'info';
      case 'meeting scheduled':
        return 'primary';
      case 'demo done':
        return 'warning';
      case 'proposal sent':
        return 'secondary';
      case 'follow-up':
        return 'info';
      case 'converted':
        return 'success';
      case 'lost':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  /**
   * Check if user has admin/manager role
   */
  const isAdminOrManager = user?.roleName === 'System Admin' || 
                           user?.roleName === 'Company Admin' || 
                           user?.roleName === 'Company Manager';

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div className="flex-grow-1">
          <h2 className="mb-1">
            Welcome back, {user?.fullName || 'User'}! 
            {user?.roleName && (
              <Badge 
                bg={getRoleBadgeVariant(user.roleName)} 
                className="ms-2 fs-6 fw-normal"
              >
                {user.roleName}
              </Badge>
            )}
          </h2>
          <p className="text-muted mb-0 d-none d-sm-block">
            Here's your lead management overview for today.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={loadDashboardData}
            title="Refresh Dashboard"
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowAddLeadModal(true)}
          >
            <Plus size={18} className="me-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <Link to={isAdminOrManager ? "/all-leads" : "/my-leads"} className="text-decoration-none">
            <Card className="h-100 shadow-sm border-0 stat-card" style={{ cursor: 'pointer' }}>
              <Card.Body className="py-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    {statsLoading ? (
                      <Spinner animation="border" size="sm" className="text-primary" />
                    ) : (
                      <h3 className="text-primary mb-0 fw-bold">{stats?.totalLeads ?? 0}</h3>
                    )}
                    <p className="text-muted mb-0 small mt-1">Total Leads</p>
                  </div>
                  <div className="stat-icon bg-primary bg-opacity-10 rounded-circle p-3">
                    <Users size={24} className="text-primary" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Link>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          {isAdminOrManager ? (
            <Link to="/assign-leads" className="text-decoration-none">
              <Card className="h-100 shadow-sm border-0 stat-card" style={{ cursor: 'pointer' }}>
                <Card.Body className="py-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      {statsLoading ? (
                        <Spinner animation="border" size="sm" className="text-warning" />
                      ) : (
                        <h3 className="text-warning mb-0 fw-bold">{stats?.unassignedLeads ?? 0}</h3>
                      )}
                      <p className="text-muted mb-0 small mt-1">Unassigned</p>
                    </div>
                    <div className="stat-icon bg-warning bg-opacity-10 rounded-circle p-3">
                      <Users size={24} className="text-warning" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Link>
          ) : (
            <Card className="h-100 shadow-sm border-0 stat-card">
              <Card.Body className="py-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    {statsLoading ? (
                      <Spinner animation="border" size="sm" className="text-warning" />
                    ) : (
                      <h3 className="text-warning mb-0 fw-bold">{stats?.unassignedLeads ?? 0}</h3>
                    )}
                    <p className="text-muted mb-0 small mt-1">Unassigned</p>
                  </div>
                  <div className="stat-icon bg-warning bg-opacity-10 rounded-circle p-3">
                    <Users size={24} className="text-warning" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Link to="/followups" state={{ from: 'dashboard' }} className="text-decoration-none">
            <Card className="h-100 shadow-sm border-0 stat-card" style={{ cursor: 'pointer' }}>
              <Card.Body className="py-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    {statsLoading ? (
                      <Spinner animation="border" size="sm" className="text-info" />
                    ) : (
                      <h3 className="text-info mb-0 fw-bold">{stats?.todaysFollowups ?? 0}</h3>
                    )}
                    <p className="text-muted mb-0 small mt-1">Today's Follow-ups</p>
                  </div>
                  <div className="stat-icon bg-info bg-opacity-10 rounded-circle p-3">
                    <Calendar size={24} className="text-info" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Link>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="h-100 shadow-sm border-0 stat-card">
            <Card.Body className="py-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  {statsLoading ? (
                    <Spinner animation="border" size="sm" className="text-success" />
                  ) : (
                    <h3 className="text-success mb-0 fw-bold">{stats?.conversionRate ?? 0}%</h3>
                  )}
                  <p className="text-muted mb-0 small mt-1">Conversion Rate</p>
                </div>
                <div className="stat-icon bg-success bg-opacity-10 rounded-circle p-3">
                  <TrendingUp size={24} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Analytics Charts Row */}
      <Row className="g-3 mb-4">
        {/* Sales Conversion Funnel */}
        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="mb-0 fw-semibold">
                <TrendingUp size={20} className="me-2 text-success" />
                Sales Conversion Funnel
              </h5>
            </Card.Header>
            <Card.Body className="py-4">
              {conversionLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-2 mb-0">Loading funnel data...</p>
                </div>
              ) : conversionReport?.funnelStages && conversionReport.funnelStages.length > 0 ? (
                <div style={{ width: '100%', minHeight: '300px' }}>
                  <Chart
                    options={createFunnelChartOptions(conversionReport.funnelStages)}
                    series={createFunnelChartSeries(conversionReport.funnelStages)}
                    type="bar"
                    height={300}
                  />
                </div>
              ) : (
                <div className="text-center py-5">
                  <TrendingUp size={48} className="text-muted mb-3" />
                  <p className="text-muted mb-0">No funnel data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Leads by Source */}
        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="mb-0 fw-semibold">
                <PieChartIcon size={20} className="me-2 text-info" />
                Leads by Source
              </h5>
            </Card.Header>
            <Card.Body className="py-4">
              {leadsBySourceLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-2 mb-0">Loading source data...</p>
                </div>
              ) : leadsBySource.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={leadsBySource as any[]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="leadCount"
                      nameKey="sourceName"
                      label={({ payload }) => `${payload?.sourceName}: ${payload?.percentage}%`}
                      labelLine={false}
                    >
                      {leadsBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5">
                  <PieChartIcon size={48} className="text-muted mb-3" />
                  <p className="text-muted mb-0">No source data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Leads by Status */}
        <Col xs={12} lg={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="mb-0 fw-semibold">
                <BarChart3 size={20} className="me-2 text-warning" />
                Leads by Status
              </h5>
            </Card.Header>
            <Card.Body className="py-4">
              {leadsByStatusLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-2 mb-0">Loading status data...</p>
                </div>
              ) : leadsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={leadsByStatus}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="category"
                      dataKey="statusName"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="leadCount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5">
                  <BarChart3 size={48} className="text-muted mb-3" />
                  <p className="text-muted mb-0">No status data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Leads Table */}
      <Row className="g-3 mb-4">
        <Col xs={12}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 fw-semibold">Recent Leads</h5>
              <Link to="/my-leads" className="text-decoration-none small">
                View All <ArrowRight size={14} className="ms-1" />
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {recentLeadsLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-2 mb-0">Loading recent leads...</p>
                </div>
              ) : recentLeads.length === 0 ? (
                <div className="text-center py-5">
                  <Users size={48} className="text-muted mb-3" />
                  <p className="text-muted mb-0">No leads yet. Add your first lead!</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View (xs/sm screens) */}
                  <div className="d-block d-md-none">
                    <div className="row g-3 p-3">
                      {recentLeads.map((lead) => (
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
                                <Badge bg={getStatusBadgeVariant(lead.leadStatusName)} className="ms-2 flex-shrink-0">
                                  {lead.leadStatusName}
                                </Badge>
                              </div>
                              <div className="row g-2 text-sm">
                                <div className="col-12">
                                  <small className="text-muted d-block"><i className="bi bi-calendar me-1"></i>Lead Date</small>
                                  <span>{formatDate(lead.leadDate)}</span>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Table View (md+ screens) */}
                  <div className="d-none d-md-block">
                    <Table responsive hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="border-0 py-3 px-3">Client Name</th>
                          <th className="border-0 py-3">Company</th>
                          <th className="border-0 py-3">Lead Date</th>
                          <th className="border-0 py-3 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentLeads.map((lead) => (
                          <tr key={lead.leadId}>
                            <td className="py-3 px-3">
                              <span className="fw-medium">{lead.clientName}</span>
                            </td>
                            <td className="py-3 text-muted">
                              {lead.companyName || '-'}
                            </td>
                            <td className="py-3 text-muted">
                              {formatDate(lead.leadDate)}
                            </td>
                            <td className="py-3 px-3">
                              <Badge bg={getStatusBadgeVariant(lead.leadStatusName)} className="fw-normal">
                                {lead.leadStatusName}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>


      {/* Floating Action Button */}
      <Button
        variant="primary"
        className="fab-button shadow-lg"
        onClick={() => setShowAddLeadModal(true)}
        title="Add New Lead"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <Plus size={24} />
      </Button>

      {/* Add Lead Modal */}
      <AddLeadModal
        show={showAddLeadModal}
        onHide={() => setShowAddLeadModal(false)}
        onSuccess={handleLeadCreated}
      />

      {/* Custom styles for dashboard */}
      <style>{`
        .stat-card:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease-in-out;
        }
        
        .quick-nav-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease-in-out;
        }
        
        .fab-button:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease-in-out;
        }
        
        @media (max-width: 768px) {
          .fab-button {
            bottom: 16px !important;
            right: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
