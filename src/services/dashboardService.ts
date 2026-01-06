import api from './api';

/**
 * Dashboard Statistics DTO
 */
export interface DashboardStats {
  /** Total number of leads based on user's role and company */
  totalLeads: number;
  /** Number of leads not assigned to any user */
  unassignedLeads: number;
  /** Number of leads with follow-up scheduled for today */
  todaysFollowups: number;
  /** Conversion rate percentage (Converted leads / Total leads * 100) */
  conversionRate: number;
}

/**
 * Recent Lead DTO for dashboard display
 */
export interface RecentLead {
  /** Unique identifier for the lead */
  leadId: number;
  /** Name of the client/prospect */
  clientName: string;
  /** Company name (if provided) */
  companyName?: string;
  /** Date when the lead was created/received */
  leadDate: string;
  /** Current status of the lead */
  leadStatusName: string;
}

/**
 * Upcoming Follow-up DTO for dashboard display
 */
export interface UpcomingFollowup {
  /** Unique identifier for the lead */
  leadId: number;
  /** Name of the client/prospect */
  clientName: string;
  /** Scheduled follow-up date */
  followupDate: string;
  /** Current status of the lead */
  leadStatusName: string;
  /** Indicates if the follow-up is overdue */
  isOverdue: boolean;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Get dashboard statistics including total leads, unassigned leads, today's follow-ups, and conversion rate
 */
export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

/**
 * Get recent leads (last 5 created leads)
 */
export const getRecentLeads = async (): Promise<ApiResponse<RecentLead[]>> => {
  const response = await api.get('/dashboard/recent-leads');
  return response.data;
};

/**
 * Get upcoming follow-ups for the next 2 days
 */
export const getUpcomingFollowups = async (): Promise<ApiResponse<UpcomingFollowup[]>> => {
  const response = await api.get('/dashboard/upcoming-followups');
  return response.data;
};
