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

/**
 * Get conversion funnel report with metrics
 * @param params - Query parameters for filtering the report
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

  const response = await api.get(url);
  return response.data;
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