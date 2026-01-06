import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Form, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { Filter, TrendingUp, Calendar, Users, Trophy, X, RefreshCw, Target, BarChart3 } from 'lucide-react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { getWinLossReport } from '../services/reportService';
import { getLeadSources, getAssignableUsers } from '../services/leadService';
import { WinLossReport as WinLossReportType } from '../types/Reports';
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
  leadOwnerId: string;
}

// Chart colors
const CHART_COLORS = {
  won: '#22c55e',    // Green
  lost: '#ef4444',   // Red
  pending: '#f59e0b', // Amber
  primary: '#6366f1',
  secondary: '#8b5cf6',
};

const WinLossReport: React.FC = () => {
  const { user } = useAuth();

  // State management
  const [reportData, setReportData] = useState<WinLossReportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    leadSourceId: '',
    leadOwnerId: '',
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
          getAssignableUsers()
        ]);

        if (leadSourcesResponse.success && leadSourcesResponse.data) {
          setLeadSources(leadSourcesResponse.data);
        }

        if (usersResponse.success && usersResponse.data) {
          // Map the assignable users response to the User interface
          setUsers(usersResponse.data.map((u: any) => ({
            userId: u.userId,
            fullName: u.fullName,
            email: u.email || '',
            roleName: u.roleName || ''
          })));
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
        ...(filters.leadOwnerId && { leadOwnerId: parseInt(filters.leadOwnerId) }),
      };

      const response = await getWinLossReport(params);

      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        setError(response.message || 'Failed to load win/loss report');
      }
    } catch (err) {
      console.error('Error loading win/loss report:', err);
      setError('An error occurred while loading the win/loss report');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load report on component mount
  useEffect(() => {
    loadReportData();
  }, []);

  // Handle filter changes
  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    loadReportData();
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      leadSourceId: '',
      leadOwnerId: '',
    });
    setTimeout(() => loadReportData(), 0);
  };

  // Win/Loss Pie Chart Configuration
  const pieChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 350,
      animations: {
        enabled: true,
        speed: 800,
      }
    },
    colors: reportData?.pieChartData.map(d => d.color) || [CHART_COLORS.won, CHART_COLORS.lost, CHART_COLORS.pending],
    labels: reportData?.pieChartData.map(d => d.label) || ['Won', 'Lost', 'Pending'],
    dataLabels: {
      enabled: true,
      formatter: function (val: number, opts: { seriesIndex: number }) {
        const label = reportData?.pieChartData[opts.seriesIndex]?.label || '';
        return `${label}: ${val.toFixed(1)}%`;
      },
      style: {
        fontSize: '12px',
        fontWeight: 600,
      }
    },
    legend: {
      position: 'bottom',
      fontSize: '14px',
      markers: {
        size: 12,
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontWeight: 600,
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              formatter: function (val: string) {
                return val;
              }
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontWeight: 600,
              formatter: function (w: { globals: { seriesTotals: number[] } }) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0).toString();
              }
            }
          }
        }
      }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (val: number) {
          return `${val} leads`;
        }
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 300
        },
        legend: {
          position: 'bottom',
          fontSize: '12px'
        },
        dataLabels: {
          style: {
            fontSize: '10px'
          }
        },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                name: {
                  fontSize: '14px'
                },
                value: {
                  fontSize: '18px'
                },
                total: {
                  fontSize: '12px'
                }
              }
            }
          }
        }
      }
    }, {
      breakpoint: 480,
      options: {
        chart: {
          height: 250
        },
        legend: {
          position: 'bottom',
          fontSize: '11px'
        },
        dataLabels: {
          enabled: false
        }
      }
    }]
  };

  const pieChartSeries = reportData?.pieChartData.map(d => d.value) || [];

// Win/Loss by Lead Source Bar Chart Configuration
const leadSourceBarChartOptions: ApexOptions = {
  chart: {
    type: 'bar',
    height: 350,
    stacked: false,
    toolbar: {
      show: false
    }
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      borderRadius: 4,
    }
  },
  colors: [CHART_COLORS.won, CHART_COLORS.lost],  // ← Add this line
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 2,
    colors: ['transparent']
  },
  xaxis: {
    categories: reportData?.byLeadSource.slice(0, 6).map(s =>
      s.categoryName.length > 12 ? s.categoryName.substring(0, 12) + '...' : s.categoryName
    ) || [],
    labels: {
      style: {
        fontSize: '11px'
      },
      rotate: -45,
      rotateAlways: false,
    }
  },
  yaxis: {
    title: {
      text: 'Number of Leads'
    }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
  },
  tooltip: {
    y: {
      formatter: function (val: number) {
        return `${val} leads`;
      }
    }
  },
  grid: {
    borderColor: '#e5e7eb',
    strokeDashArray: 4,
  },
  responsive: [{
    breakpoint: 768,
    options: {
      chart: {
        height: 300
      },
      plotOptions: {
        bar: {
          columnWidth: '70%'
        }
      },
      xaxis: {
        labels: {
          style: {
            fontSize: '10px'
          },
          rotate: -45
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '11px'
          }
        }
      },
      legend: {
        fontSize: '12px'
      }
    }
  }, {
    breakpoint: 480,
    options: {
      chart: {
        height: 250
      },
      plotOptions: {
        bar: {
          columnWidth: '80%'
        }
      },
      xaxis: {
        labels: {
          style: {
            fontSize: '9px'
          },
          rotate: 0
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
      legend: {
        fontSize: '11px',
        position: 'bottom',
        horizontalAlign: 'center'
      }
    }
  }]
};

  const leadSourceBarChartSeries = [
    {
      name: 'Won',
      data: reportData?.byLeadSource.slice(0, 6).map(s => s.wonLeads) || [],
      // Remove color from here
    },
    {
      name: 'Lost',
      data: reportData?.byLeadSource.slice(0, 6).map(s => s.lostLeads) || [],
      // Remove color from here
    }
  ];

  // Win/Loss by Urgency Level Bar Chart Configuration
  const urgencyBarChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: false,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      }
    },
    colors: [CHART_COLORS.won, CHART_COLORS.lost],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: reportData?.byUrgencyLevel.map(s => s.categoryName) || [],  // This will show "Not Set", "Immediate", etc.
      labels: {
        style: {
          fontSize: '11px'
        },
        rotate: -45,
        rotateAlways: false,
      }
    },
    yaxis: {
      title: {
        text: 'Number of Leads'
      },
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return `${val} leads`;
        }
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 300
        },
        plotOptions: {
          bar: {
            columnWidth: '70%'
          }
        },
        xaxis: {
          labels: {
            style: {
              fontSize: '10px'
            },
            rotate: -45
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '11px'
            }
          }
        },
        legend: {
          fontSize: '12px'
        }
      }
    }, {
      breakpoint: 480,
      options: {
        chart: {
          height: 250
        },
        plotOptions: {
          bar: {
            columnWidth: '80%'
          }
        },
        xaxis: {
          labels: {
            style: {
              fontSize: '9px'
            },
            rotate: 0
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '10px'
            }
          }
        },
        legend: {
          fontSize: '11px',
          position: 'bottom',
          horizontalAlign: 'center'
        }
      }
    }]
  };

  const urgencyBarChartSeries = [
    {
      name: 'Won',
      data: reportData?.byUrgencyLevel.map(s => s.wonLeads) || []
    },
    {
      name: 'Lost',
      data: reportData?.byUrgencyLevel.map(s => s.lostLeads) || []
    }
  ];


  // Trends Line Chart Configuration
  const trendsChartOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    stroke: {
      width: [3, 3],
      curve: 'smooth',
    },
    colors: [CHART_COLORS.won, CHART_COLORS.lost],
    markers: {
      size: 6,
      strokeWidth: 2,
      strokeColors: [CHART_COLORS.won, CHART_COLORS.lost],
      hover: {
        size: 8
      }
    },
    xaxis: {
      categories: reportData?.trends.map(t => t.period) || [],
      labels: {
        style: {
          fontSize: '11px'
        },
        rotate: -45,
        rotateAlways: false,
      }
    },
    yaxis: {
      title: {
        text: 'Number of Leads'
      },
      min: 0,
      tickAmount: 5,
      labels: {
        formatter: function (value) {
          return Math.floor(value).toString();
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (val: number) {
          return `${val} leads`;
        }
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 300
        },
        stroke: {
          width: [2, 2]
        },
        markers: {
          size: 4,
          hover: {
            size: 6
          }
        },
        xaxis: {
          labels: {
            style: {
              fontSize: '10px'
            },
            rotate: -45
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '11px'
            }
          },
          title: {
            style: {
              fontSize: '12px'
            }
          }
        },
        legend: {
          fontSize: '12px'
        }
      }
    }, {
      breakpoint: 480,
      options: {
        chart: {
          height: 250
        },
        stroke: {
          width: [2, 2]
        },
        markers: {
          size: 3,
          hover: {
            size: 5
          }
        },
        xaxis: {
          labels: {
            style: {
              fontSize: '9px'
            },
            rotate: 0
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '10px'
            }
          },
          title: {
            style: {
              fontSize: '11px'
            }
          }
        },
        legend: {
          fontSize: '11px',
          position: 'bottom',
          horizontalAlign: 'center'
        }
      }
    }]
  };

  const trendsChartSeries = [
    {
      name: 'Won',
      data: reportData?.trends.map(t => t.wonLeads) || []
    },
    {
      name: 'Lost',
      data: reportData?.trends.map(t => t.lostLeads) || []
    }
  ];

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <BarChart3 className="me-2" size={28} />
            Win vs Lost Report
          </h2>
          <p className="text-muted mb-0">Analyze your win/loss ratios and identify patterns</p>
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
            <Col xs={12} sm={6} md={3}>
              <Form.Group>
                <Form.Label className="fw-medium">Date From</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Form.Group>
                <Form.Label className="fw-medium">Date To</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={3}>
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
            <Col xs={12} sm={6} md={3}>
              <Form.Group>
                <Form.Label className="fw-medium">Lead Owner</Form.Label>
                <Form.Select
                  value={filters.leadOwnerId}
                  onChange={(e) => handleFilterChange('leadOwnerId', e.target.value)}
                >
                  <option value="">All Owners</option>
                  {users.map(u => (
                    <option key={u.userId} value={u.userId.toString()}>
                      {u.fullName}
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
                  <>
                    <Spinner size="sm" className="me-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <TrendingUp className="me-2" size={16} />
                    Apply Filters
                  </>
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
          <p className="mt-3 text-muted">Loading win/loss report...</p>
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
        <>
          {/* Key Metrics Cards */}
          <Row className="mb-4 g-3">
            <Col xs={12} sm={6} md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                      <Trophy size={28} style={{ color: CHART_COLORS.won }} />
                    </div>
                  </div>
                  <h6 className="text-muted mb-2">Win Rate</h6>
                  <h2 style={{ color: CHART_COLORS.won }} className="mb-2">{reportData.winRate}%</h2>
                  <small className="text-muted">
                    {reportData.totalWonLeads} of {reportData.totalLeads} leads won
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                      <X size={28} style={{ color: CHART_COLORS.lost }} />
                    </div>
                  </div>
                  <h6 className="text-muted mb-2">Loss Rate</h6>
                  <h2 style={{ color: CHART_COLORS.lost }} className="mb-2">{reportData.lossRate}%</h2>
                  <small className="text-muted">
                    {reportData.totalLostLeads} of {reportData.totalLeads} leads lost
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                      <Target size={28} style={{ color: CHART_COLORS.primary }} />
                    </div>
                  </div>
                  <h6 className="text-muted mb-2">Total Won</h6>
                  <h2 style={{ color: CHART_COLORS.primary }} className="mb-2">{reportData.totalWonLeads}</h2>
                  <small className="text-muted">successfully converted</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6} lg={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                      <Users size={28} style={{ color: CHART_COLORS.pending }} />
                    </div>
                  </div>
                  <h6 className="text-muted mb-2">Total Lost</h6>
                  <h2 style={{ color: CHART_COLORS.pending }} className="mb-2">{reportData.totalLostLeads}</h2>
                  <small className="text-muted">deals not converted</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            {/* Win/Loss Pie Chart */}
            <Col xs={12} lg={5}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="mb-0">
                    <Target className="me-2" size={20} />
                    Win/Loss Distribution
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ width: '100%', minHeight: '350px' }}>
                    <Chart
                      options={pieChartOptions}
                      series={pieChartSeries}
                      type="donut"
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Win/Loss by Lead Source Bar Chart */}
            <Col xs={12} lg={7}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="mb-0">
                    <BarChart3 className="me-2" size={20} />
                    Win/Loss by Lead Source
                  </h5>
                </Card.Header>
                <Card.Body>
                  {reportData.byLeadSource.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No lead source data available</p>
                    </div>
                  ) : (
                    <>
                      {/* ADD THESE CONSOLE LOGS HERE */}
                      {console.log('=== LEAD SOURCE CHART DEBUG ===')}
                      {console.log('Chart Options:', leadSourceBarChartOptions)}
                      {console.log('Stacked value:', leadSourceBarChartOptions.chart?.stacked)}
                      {console.log('Chart Series:', leadSourceBarChartSeries)}
                      {console.log('Report Data:', reportData.byLeadSource)}
                      {console.log('================================')}

                      <div style={{ width: '100%', minHeight: '300px' }}>
                        <Chart
                          key="lead-source-grouped-chart"
                          options={leadSourceBarChartOptions}
                          series={leadSourceBarChartSeries}
                          type="bar"
                        />
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            {/* Win/Loss by Urgency Level Bar Chart */}
            <Col xs={12} lg={5}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="mb-0">
                    <Calendar className="me-2" size={20} />
                    Win/Loss by Urgency Level
                  </h5>
                </Card.Header>
                <Card.Body>
                  {reportData.byUrgencyLevel.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No urgency level data available</p>
                    </div>
                  ) : (
                    <div style={{ width: '100%', minHeight: '300px' }}>
                      <Chart
                        options={urgencyBarChartOptions}
                        series={urgencyBarChartSeries}
                        type="bar"
                      />
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Trends Over Time Line Chart */}
            <Col xs={12} lg={7}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="mb-0">
                    <TrendingUp className="me-2" size={20} />
                    Win/Loss Trends Over Time
                  </h5>
                </Card.Header>
                <Card.Body>
                  {reportData.trends.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No trend data available</p>
                    </div>
                  ) : (
                    <>
                      {/* Debug logging */}
                      {console.log('=== TRENDS DEBUG ===')}
                      {console.log('Trends data:', reportData.trends)}
                      {console.log('Trends series:', trendsChartSeries)}
                      {console.log('==================')}

                      <div style={{ width: '100%', minHeight: '300px' }}>
                        <Chart
                          options={trendsChartOptions}
                          series={trendsChartSeries}
                          type="line"
                        />
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Detailed Tables */}
          <Row className="g-4">
            {/* By Lead Source Table */}
            <Col xs={12} lg={6}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="mb-0">
                    <Target className="me-2" size={20} />
                    Breakdown by Lead Source
                  </h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Lead Source</th>
                        <th className="text-center">Total</th>
                        <th className="text-center">Win Rate</th>
                        <th className="text-center">Loss Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.byLeadSource.map((source) => (
                        <tr key={source.categoryName}>
                          <td>
                            <span className="fw-medium">{source.categoryName}</span>
                          </td>
                          <td className="text-center">
                            <Badge bg="secondary" className="px-2 py-1">{source.totalLeads}</Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg={source.winRate >= 50 ? 'success' : source.winRate >= 25 ? 'warning' : 'danger'}>
                              {source.winRate}%
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg={source.lossRate <= 25 ? 'success' : source.lossRate <= 50 ? 'warning' : 'danger'}>
                              {source.lossRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {reportData.byLeadSource.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-4">
                            No lead source data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* By Urgency Level Table */}
            <Col xs={12} lg={6}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="mb-0">
                    <Calendar className="me-2" size={20} />
                    Breakdown by Urgency Level
                  </h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Urgency Level</th>
                        <th className="text-center">Total</th>
                        <th className="text-center">Win Rate</th>
                        <th className="text-center">Loss Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.byUrgencyLevel.map((urgency) => (
                        <tr key={urgency.categoryName}>
                          <td>
                            <span className="fw-medium">{urgency.categoryName}</span>
                          </td>
                          <td className="text-center">
                            <Badge bg="secondary" className="px-2 py-1">{urgency.totalLeads}</Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg={urgency.winRate >= 50 ? 'success' : urgency.winRate >= 25 ? 'warning' : 'danger'}>
                              {urgency.winRate}%
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg={urgency.lossRate <= 25 ? 'success' : urgency.lossRate <= 50 ? 'warning' : 'danger'}>
                              {urgency.lossRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {reportData.byUrgencyLevel.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-muted py-4">
                            No urgency level data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
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

export default WinLossReport;
