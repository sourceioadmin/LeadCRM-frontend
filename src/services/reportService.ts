import api from './api';
import {
  ConversionReport,
  ConversionReportRequest,
  WinLossReport,
  WinLossReportRequest,
  LeadsBySource,
  LeadsByStatus,
  LeadsByUrgency,
  TeamPerformance,
  AdditionalAnalyticsRequest
} from '../types/Reports';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

/** Raw funnel stage from API (may use PascalCase) */
interface RawFunnelStage {
  stageName?: string;
  StageName?: string;
  count?: number;
  Count?: number;
  conversionRate?: number;
  ConversionRate?: number;
}

/** Normalize funnel stages to camelCase (API may return PascalCase) */
function normalizeFunnelStages(raw: RawFunnelStage[] | undefined): ConversionReport['funnelStages'] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((s) => ({
    stageName: s.stageName ?? s.StageName ?? '',
    count: s.count ?? s.Count ?? 0,
    conversionRate: s.conversionRate ?? s.ConversionRate ?? 0,
  }));
}

/**
 * Get conversion funnel report with metrics.
 * Backend uses "Lost exit at stage" semantics: Lost leads are counted only up to the stage they were in when lost, and excluded from later stages. No client-side override.
 * Normalizes API response to camelCase for frontend use.
 */
export const getConversionReport = async (params?: ConversionReportRequest): Promise<ApiResponse<ConversionReport>> => {
  // Build query parameters
  const queryParams = new URLSearchParams();

  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
  if (params?.leadSourceId) queryParams.append('leadSourceId', params.leadSourceId.toString());
  if (params?.assignedUserId) queryParams.append('assignedUserId', params.assignedUserId.toString());

  const queryString = queryParams.toString();
  const url = `/reports/conversion${queryString ? `?${queryString}` : ''}`;

  const response = await api.get<ApiResponse<ConversionReport>>(url);
  const body = response.data;
  if (body?.data) {
    const data = body.data as ConversionReport & { FunnelStages?: RawFunnelStage[]; TotalLostLeads?: number };
    const rawStages = data.FunnelStages ?? data.funnelStages;
    const totalLostLeads = data.totalLostLeads ?? data.TotalLostLeads ?? 0;
    // Use API funnel stages as-is: backend applies "Lost exit at stage" (Lost counted only up to stage when lost)
    const funnelStages = normalizeFunnelStages(Array.isArray(rawStages) ? rawStages : undefined);
    body.data = {
      ...data,
      totalLostLeads,
      funnelStages,
    };
  }
  return body;
};

/**
 * Get win/loss report with breakdown and trends
 * @param params - Query parameters for filtering the report
 */
export const getWinLossReport = async (params?: WinLossReportRequest): Promise<ApiResponse<WinLossReport>> => {
  // Build query parameters
  const queryParams = new URLSearchParams();

  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
  if (params?.leadSourceId) queryParams.append('leadSourceId', params.leadSourceId.toString());
  if (params?.leadOwnerId) queryParams.append('leadOwnerId', params.leadOwnerId.toString());

  const queryString = queryParams.toString();
  const url = `/reports/win-loss${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

/**
 * Get leads grouped by source analytics
 * @param params - Query parameters for filtering the report
 */
export const getLeadsBySource = async (params?: AdditionalAnalyticsRequest): Promise<ApiResponse<LeadsBySource[]>> => {
  // Build query parameters
  const queryParams = new URLSearchParams();

  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
  if (params?.assignedUserId) queryParams.append('assignedUserId', params.assignedUserId.toString());

  const queryString = queryParams.toString();
  const url = `/reports/leads-by-source${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

/**
 * Get leads grouped by status analytics
 * @param params - Query parameters for filtering the report
 */
export const getLeadsByStatus = async (params?: AdditionalAnalyticsRequest): Promise<ApiResponse<LeadsByStatus[]>> => {
  // Build query parameters
  const queryParams = new URLSearchParams();

  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
  if (params?.assignedUserId) queryParams.append('assignedUserId', params.assignedUserId.toString());

  const queryString = queryParams.toString();
  const url = `/reports/leads-by-status${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

/**
 * Get leads grouped by urgency level analytics
 * @param params - Query parameters for filtering the report
 */
export const getLeadsByUrgency = async (params?: AdditionalAnalyticsRequest): Promise<ApiResponse<LeadsByUrgency[]>> => {
  // Build query parameters
  const queryParams = new URLSearchParams();

  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
  if (params?.assignedUserId) queryParams.append('assignedUserId', params.assignedUserId.toString());

  const queryString = queryParams.toString();
  const url = `/reports/leads-by-urgency${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

/**
 * Get team performance analytics
 * @param params - Query parameters for filtering the report
 */
export const getTeamPerformance = async (params?: Omit<AdditionalAnalyticsRequest, 'assignedUserId'>): Promise<ApiResponse<TeamPerformance[]>> => {
  // Build query parameters
  const queryParams = new URLSearchParams();

  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const queryString = queryParams.toString();
  const url = `/reports/team-performance${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};