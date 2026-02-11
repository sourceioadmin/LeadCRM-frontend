import api from './api';
import { Lead, LeadSource, LeadStatus, Urgency, UpcomingFollowupsResponse, RescheduleFollowupRequest, AddNoteRequest } from '../types/Lead';

// Additional types for My Leads functionality
export interface PaginatedLeadResponse {
  leads: Lead[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LeadStatusDistribution {
  statusName: string;
  count: number;
  color: string;
  [key: string]: any; // Index signature for Recharts compatibility
}

export interface MyLeadsResponse {
  leads: PaginatedLeadResponse;
  statusDistribution: LeadStatusDistribution[];
}

export interface LeadSourceDistribution {
  sourceName: string;
  count: number;
  color: string;
  [key: string]: any; // Index signature for Recharts compatibility
}

export interface AllLeadsResponse {
  leads: PaginatedLeadResponse;
  sourceDistribution: LeadSourceDistribution[];
}

export interface BulkUpdateResponse {
  updatedCount: number;
  errors: string[];
}

export interface CreateLeadRequest {
  leadDate: string;
  clientName: string;
  companyName?: string;
  mobileNumber: string;
  emailAddress?: string;
  leadSourceId: number;
  referredBy?: string;
  interestedIn?: string;
  expectedBudget?: number;
  urgencyLevelId?: number;
  leadStatusId?: number;
  assignedToUserId?: number;
  followupDate?: string;
  notes?: string;
}

export interface UpdateLeadRequest {
  leadDate: string;
  clientName: string;
  companyName?: string;
  mobileNumber: string;
  emailAddress?: string;
  leadSourceId: number;
  referredBy?: string;
  interestedIn?: string;
  expectedBudget?: number;
  urgencyLevelId?: number;
  leadStatusId: number;
  assignedToUserId?: number;
  followupDate?: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Create a new lead
 */
export const createLead = async (leadData: CreateLeadRequest): Promise<ApiResponse<Lead>> => {
  const response = await api.post('/lead', leadData);
  return response.data;
};

/**
 * Get a specific lead by ID
 */
export const getLead = async (leadId: number): Promise<ApiResponse<Lead>> => {
  const response = await api.get(`/lead/${leadId}`);
  return response.data;
};

/**
 * Update an existing lead
 */
export const updateLead = async (leadId: number, leadData: UpdateLeadRequest): Promise<ApiResponse<Lead>> => {
  const response = await api.put(`/lead/${leadId}`, leadData);
  return response.data;
};

/**
 * Get all lead sources for the current user's company
 */
export const getLeadSources = async (): Promise<ApiResponse<LeadSource[]>> => {
  const response = await api.get('/lead-sources');
  return response.data;
};

/**
 * Get all lead statuses for the current user's company
 */
export const getLeadStatuses = async (): Promise<ApiResponse<LeadStatus[]>> => {
  const response = await api.get('/lead-statuses');
  return response.data;
};

/**
 * Get all urgency levels for the current user's company
 */
export const getUrgencyLevels = async (): Promise<ApiResponse<Urgency[]>> => {
  const response = await api.get('/urgency-levels');
  return response.data;
};

/**
 * Get users available for lead assignment based on current user's role
 */
export const getAssignableUsers = async (): Promise<ApiResponse<any[]>> => {
  const response = await api.get('/user/assignable');
  return response.data;
};

/**
 * Get leads assigned to current user with pagination and filters
 */
export const getMyLeads = async (params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  dateFrom?: string;
  dateTo?: string;
  leadSourceId?: number;
  leadStatusId?: number;
  urgencyLevelId?: number;
  search?: string;
}): Promise<ApiResponse<MyLeadsResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
  if (params?.leadSourceId) queryParams.append('leadSourceId', params.leadSourceId.toString());
  if (params?.leadStatusId) queryParams.append('leadStatusId', params.leadStatusId.toString());
  if (params?.urgencyLevelId) queryParams.append('urgencyLevelId', params.urgencyLevelId.toString());
  if (params?.search) queryParams.append('search', params.search);

  const response = await api.get(`/lead/my-leads?${queryParams.toString()}`);
  return response.data;
};

// Get all leads for Admin/Manager with advanced filtering and pagination
export const getAllLeads = async (params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  dateFrom?: string;
  dateTo?: string;
  followupDateFrom?: string;
  followupDateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  leadSourceId?: number;
  leadStatusId?: number;
  urgencyLevelId?: number;
  assignedToUserId?: number;
  budgetMin?: number;
  budgetMax?: number;
  search?: string;
}): Promise<ApiResponse<AllLeadsResponse>> => {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
  if (params?.followupDateFrom) queryParams.append('followupDateFrom', params.followupDateFrom);
  if (params?.followupDateTo) queryParams.append('followupDateTo', params.followupDateTo);
  if (params?.createdDateFrom) queryParams.append('createdDateFrom', params.createdDateFrom);
  if (params?.createdDateTo) queryParams.append('createdDateTo', params.createdDateTo);
  if (params?.leadSourceId) queryParams.append('leadSourceId', params.leadSourceId.toString());
  if (params?.leadStatusId) queryParams.append('leadStatusId', params.leadStatusId.toString());
  if (params?.urgencyLevelId) queryParams.append('urgencyLevelId', params.urgencyLevelId.toString());
  if (params?.assignedToUserId) queryParams.append('assignedToUserId', params.assignedToUserId.toString());
  if (params?.budgetMin) queryParams.append('budgetMin', params.budgetMin.toString());
  if (params?.budgetMax) queryParams.append('budgetMax', params.budgetMax.toString());
  if (params?.search) queryParams.append('search', params.search);

  const response = await api.get(`/lead/all?${queryParams.toString()}`);
  return response.data;
};

// Bulk update lead statuses
export const bulkUpdateStatus = async (leadIds: number[], newStatusId: number): Promise<ApiResponse<BulkUpdateResponse>> => {
  const response = await api.put('/lead/bulk-update-status', {
    leadIds,
    newStatusId
  });
  return response.data;
};

// Export leads to CSV
export const exportLeads = async (params?: {
  format?: string;
  dateFrom?: string;
  dateTo?: string;
  followupDateFrom?: string;
  followupDateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  leadSourceId?: number;
  leadStatusId?: number;
  urgencyLevelId?: number;
  assignedToUserId?: number;
  budgetMin?: number;
  budgetMax?: number;
  search?: string;
}): Promise<Blob> => {
  const queryParams = new URLSearchParams();

  if (params?.format) queryParams.append('format', params.format);
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
  if (params?.followupDateFrom) queryParams.append('followupDateFrom', params.followupDateFrom);
  if (params?.followupDateTo) queryParams.append('followupDateTo', params.followupDateTo);
  if (params?.createdDateFrom) queryParams.append('createdDateFrom', params.createdDateFrom);
  if (params?.createdDateTo) queryParams.append('createdDateTo', params.createdDateTo);
  if (params?.leadSourceId) queryParams.append('leadSourceId', params.leadSourceId.toString());
  if (params?.leadStatusId) queryParams.append('leadStatusId', params.leadStatusId.toString());
  if (params?.urgencyLevelId) queryParams.append('urgencyLevelId', params.urgencyLevelId.toString());
  if (params?.assignedToUserId) queryParams.append('assignedToUserId', params.assignedToUserId.toString());
  if (params?.budgetMin) queryParams.append('budgetMin', params.budgetMin.toString());
  if (params?.budgetMax) queryParams.append('budgetMax', params.budgetMax.toString());
  if (params?.search) queryParams.append('search', params.search);

  const response = await api.get(`/lead/export?${queryParams.toString()}`, {
    responseType: 'blob'
  });
  return response.data;
};

// Get unassigned leads for Admin/Manager with filtering and pagination
export const getUnassignedLeads = async (params?: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  dateFrom?: string;
  dateTo?: string;
  leadSourceId?: number;
  leadStatusId?: number;
  urgencyLevelId?: number;
  interestedIn?: string;
  search?: string;
}): Promise<ApiResponse<PaginatedLeadResponse>> => {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
  if (params?.leadSourceId) queryParams.append('leadSourceId', params.leadSourceId.toString());
  if (params?.leadStatusId) queryParams.append('leadStatusId', params.leadStatusId.toString());
  if (params?.urgencyLevelId) queryParams.append('urgencyLevelId', params.urgencyLevelId.toString());
  if (params?.interestedIn) queryParams.append('interestedIn', params.interestedIn);
  if (params?.search) queryParams.append('search', params.search);

  const response = await api.get(`/lead/unassigned?${queryParams.toString()}`);
  return response.data;
};

// Bulk assign leads to a specific user
export const bulkAssignLeads = async (leadIds: number[], targetUserId: number): Promise<ApiResponse<BulkUpdateResponse>> => {
  const response = await api.put('/lead/bulk-assign', {
    leadIds,
    targetUserId
  });
  return response.data;
};

/**
 * Get upcoming follow-ups for the current user
 */
export const getUpcomingFollowups = async (): Promise<ApiResponse<UpcomingFollowupsResponse>> => {
  const response = await api.get('/lead/upcoming-followups');
  return response.data;
};

/**
 * Reschedule a followup date for a specific lead
 */
export const rescheduleFollowup = async (leadId: number, request: RescheduleFollowupRequest): Promise<ApiResponse<Lead>> => {
  const response = await api.put(`/lead/${leadId}/reschedule-followup`, request);
  return response.data;
};

/**
 * Add a note to a specific lead
 */
export const addNote = async (leadId: number, request: AddNoteRequest): Promise<ApiResponse<Lead>> => {
  const response = await api.put(`/lead/${leadId}/add-note`, request);
  return response.data;
};

// -----------------------------
// Lead Import (Excel)
// -----------------------------

export interface LeadImportRejectedDuplicate {
  name?: string;
  clientName?: string;
  phone?: string;
  mobileNumber?: string;
}

/**
 * Shape intentionally flexible: backend is the source of truth.
 * Frontend must only render backend-provided counts/lists (no duplicate logic here).
 */
export interface LeadImportResult {
  fileName?: string;
  importedAt?: string;

  // counts (backend-dependent naming)
  totalLeadsInFile?: number;
  totalLeads?: number;
  totalCount?: number;

  successfullyImportedLeads?: number;
  importedLeadsCount?: number;
  importedCount?: number;

  // duplicates/rejections (backend-dependent naming)
  rejectedDuplicates?: LeadImportRejectedDuplicate[];
  duplicateRejectedLeads?: LeadImportRejectedDuplicate[];
  duplicates?: LeadImportRejectedDuplicate[];
}

export interface ImportLeadsFromExcelOptions {
  /**
   * Upload progress only (0-100). Server-side processing progress is not measurable without
   * a dedicated backend progress endpoint/stream.
   */
  onUploadProgress?: (percent: number) => void;
}

const getLeadImportEndpoint = (): string => {
  const envEndpoint = import.meta.env.VITE_LEAD_IMPORT_ENDPOINT as string | undefined;
  return envEndpoint?.trim() ? envEndpoint.trim() : '/lead/import-excel';
};

/**
 * Upload an Excel file for backend-driven lead import.
 */
export const importLeadsFromExcel = async (
  file: File,
  options?: ImportLeadsFromExcelOptions
): Promise<ApiResponse<LeadImportResult>> => {
  const formData = new FormData();
  formData.append('file', file);

  const tryPost = async (endpoint: string) => {
    const response = await api.post<ApiResponse<LeadImportResult>>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (evt) => {
        if (!options?.onUploadProgress) return;
        const total = evt.total ?? 0;
        if (!total) return;
        const percent = Math.max(0, Math.min(100, Math.round((evt.loaded * 100) / total)));
        options.onUploadProgress(percent);
      },
    });
    return response.data;
  };

  const primaryEndpoint = getLeadImportEndpoint();

  // Compatibility fallback for potential older route naming.
  try {
    return await tryPost(primaryEndpoint);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404 && primaryEndpoint !== '/lead/import') {
      return await tryPost('/lead/import');
    }
    throw err;
  }
};
