/**
 * Funnel stage data for conversion report
 */
export interface FunnelStage {
  /** Stage name (Lead Status) */
  stageName: string;
  /** Number of leads in this stage */
  count: number;
  /** Conversion rate from previous stage (percentage) */
  conversionRate: number;
}

/**
 * Top performing lead source data
 */
export interface TopLeadSource {
  /** Lead source name */
  leadSourceName: string;
  /** Total leads from this source */
  totalLeads: number;
  /** Number of converted leads from this source */
  convertedLeads: number;
  /** Conversion rate percentage */
  conversionRate: number;
}

/**
 * Conversion report response data
 */
export interface ConversionReport {
  /** Overall conversion rate percentage */
  overallConversionRate: number;
  /** Average days to conversion */
  averageDaysToConversion: number;
  /** Total number of converted leads */
  totalConvertedLeads: number;
  /** Total number of leads in the funnel */
  totalLeads: number;
  /** Funnel stages data */
  funnelStages: FunnelStage[];
  /** Top 5 performing lead sources */
  topLeadSources: TopLeadSource[];
}

/**
 * Conversion report request parameters
 */
export interface ConversionReportRequest {
  /** Start date for the report (optional) */
  dateFrom?: string;
  /** End date for the report (optional) */
  dateTo?: string;
  /** Lead source filter (optional) */
  leadSourceId?: number;
  /** Assigned user filter (optional) */
  assignedUserId?: number;
}

// ============================================
// Win/Loss Report Types
// ============================================

/**
 * Win/Loss breakdown by category (Lead Source or Urgency Level)
 */
export interface WinLossByCategory {
  /** Category name */
  categoryName: string;
  /** Total leads in this category */
  totalLeads: number;
  /** Won leads (Status = Converted) */
  wonLeads: number;
  /** Lost leads (Status = Lost) */
  lostLeads: number;
  /** Win rate percentage */
  winRate: number;
  /** Loss rate percentage */
  lossRate: number;
}

/**
 * Win/Loss trend data point (weekly or monthly)
 */
export interface WinLossTrend {
  /** Period label (e.g., "Week 1", "Jan 2024") */
  period: string;
  /** Start date of the period */
  periodStart: string;
  /** Won leads in this period */
  wonLeads: number;
  /** Lost leads in this period */
  lostLeads: number;
  /** Win rate for this period */
  winRate: number;
}

/**
 * Pie chart data point
 */
export interface PieChartData {
  /** Label for the segment */
  label: string;
  /** Value (count) */
  value: number;
  /** Percentage of total */
  percentage: number;
  /** Color code for the segment */
  color: string;
}

/**
 * Win/Loss report response data
 */
export interface WinLossReport {
  /** Total leads analyzed */
  totalLeads: number;
  /** Total won leads (Status = Converted) */
  totalWonLeads: number;
  /** Total lost leads (Status = Lost) */
  totalLostLeads: number;
  /** Total pending leads (neither Won nor Lost) */
  totalPendingLeads: number;
  /** Win rate percentage */
  winRate: number;
  /** Loss rate percentage */
  lossRate: number;
  /** Win/Loss breakdown by Lead Source */
  byLeadSource: WinLossByCategory[];
  /** Win/Loss breakdown by Urgency Level */
  byUrgencyLevel: WinLossByCategory[];
  /** Win/Loss trend over time */
  trends: WinLossTrend[];
  /** Pie chart data for win/loss distribution */
  pieChartData: PieChartData[];
}

/**
 * Win/Loss report request parameters
 */
export interface WinLossReportRequest {
  /** Start date for the report (optional) */
  dateFrom?: string;
  /** End date for the report (optional) */
  dateTo?: string;
  /** Lead source filter (optional) */
  leadSourceId?: number;
  /** Lead owner (assigned user) filter (optional) */
  leadOwnerId?: number;
}

// ============================================
// Additional Analytics Types
// ============================================

/**
 * Leads by source data point
 */
export interface LeadsBySource {
  /** Lead source name */
  sourceName: string;
  /** Number of leads from this source */
  leadCount: number;
  /** Percentage of total leads */
  percentage: number;
  /** Color for chart visualization */
  color: string;
}

/**
 * Leads by status data point
 */
export interface LeadsByStatus {
  /** Lead status name */
  statusName: string;
  /** Number of leads with this status */
  leadCount: number;
  /** Percentage of total leads */
  percentage: number;
  /** Display order for status */
  displayOrder: number;
  /** Color for chart visualization */
  color: string;
}

/**
 * Leads by urgency level data point
 */
export interface LeadsByUrgency {
  /** Urgency level name */
  urgencyName: string;
  /** Number of leads with this urgency level */
  leadCount: number;
  /** Percentage of total leads */
  percentage: number;
  /** Display order for urgency level */
  displayOrder: number;
  /** Color for chart visualization */
  color: string;
}

/**
 * Team performance data point
 */
export interface TeamPerformance {
  /** Team member full name */
  memberName: string;
  /** Team member user ID */
  userId: number;
  /** Number of leads assigned to this team member */
  leadsAssigned: number;
  /** Number of converted leads for this team member */
  convertedLeads: number;
  /** Average conversion time in days (null if no conversions) */
  averageConversionTime: number | null;
  /** Conversion rate percentage */
  conversionRate: number;
}

/**
 * Additional analytics response data
 */
export interface AdditionalAnalytics {
  /** Leads grouped by source */
  leadsBySource: LeadsBySource[];
  /** Leads grouped by status */
  leadsByStatus: LeadsByStatus[];
  /** Leads grouped by urgency level */
  leadsByUrgency: LeadsByUrgency[];
  /** Team performance data */
  teamPerformance: TeamPerformance[];
}

/**
 * Additional analytics request parameters
 */
export interface AdditionalAnalyticsRequest {
  /** Start date for the report (optional) */
  dateFrom?: string;
  /** End date for the report (optional) */
  dateTo?: string;
  /** Assigned user filter (optional) */
  assignedUserId?: number;
}