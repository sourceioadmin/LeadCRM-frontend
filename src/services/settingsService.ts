import api from './api';

export interface CompanySettings {
  companyName: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  logo?: string;
}

export interface CompanySettingsResponse {
  success: boolean;
  message: string;
  data: CompanySettings;
  errors?: string[];
}

export interface UpdateCompanySettingsData {
  companyName: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  logoFile?: File;
}

export interface LeadSource {
  leadSourceId: number;
  name: string;
  isActive: boolean;
  createdDate: string;
  updatedDate?: string;
}

export interface LeadSourcesResponse {
  success: boolean;
  message: string;
  data: LeadSource[];
  errors?: string[];
}

export interface CreateLeadSourceData {
  name: string;
}

export interface UpdateLeadSourceData {
  name: string;
  isActive: boolean;
}

export interface LeadStatus {
  leadStatusId: number;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdDate: string;
  updatedDate?: string;
}

export interface LeadStatusesResponse {
  success: boolean;
  message: string;
  data: LeadStatus[];
  errors?: string[];
}

export interface CreateLeadStatusData {
  name: string;
  displayOrder: number;
}

export interface UpdateLeadStatusData {
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface LeadStatusReorderData {
  statuses: Array<{
    leadStatusId: number;
    displayOrder: number;
  }>;
}

/**
 * Get company settings
 */
export const getCompanySettings = async (): Promise<CompanySettingsResponse> => {
  const response = await api.get<CompanySettingsResponse>('/settings/company');
  return response.data;
};

/**
 * Update company settings with optional logo upload
 */
export const updateCompanySettings = async (data: UpdateCompanySettingsData): Promise<CompanySettingsResponse> => {
  const formData = new FormData();

  // Add text fields
  formData.append('companyName', data.companyName);
  if (data.industry) formData.append('industry', data.industry);
  if (data.size) formData.append('size', data.size);
  if (data.website) formData.append('website', data.website);
  if (data.phone) formData.append('phone', data.phone);

  // Add file if provided
  if (data.logoFile) {
    formData.append('logoFile', data.logoFile);
  }

  const response = await api.put<CompanySettingsResponse>('/settings/company', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Get all lead sources for the current company
 */
export const getLeadSources = async (): Promise<LeadSourcesResponse> => {
  const response = await api.get<LeadSourcesResponse>('/settings/lead-sources');
  return response.data;
};

/**
 * Create a new lead source
 */
export const createLeadSource = async (data: CreateLeadSourceData): Promise<LeadSourcesResponse> => {
  const response = await api.post<LeadSourcesResponse>('/settings/lead-sources', data);
  return response.data;
};

/**
 * Update an existing lead source
 */
export const updateLeadSource = async (id: number, data: UpdateLeadSourceData): Promise<LeadSourcesResponse> => {
  const response = await api.put<LeadSourcesResponse>(`/settings/lead-sources/${id}`, data);
  return response.data;
};

/**
 * Delete a lead source (soft delete)
 */
export const deleteLeadSource = async (id: number): Promise<{ success: boolean; message: string; data: boolean; errors?: string[] }> => {
  const response = await api.delete<{ success: boolean; message: string; data: boolean; errors?: string[] }>(`/settings/lead-sources/${id}`);
  return response.data;
};

export interface SeedDataResponse {
  success: boolean;
  message: string;
  data: {
    companyId: number;
    status: string;
    leadSources: number;
    leadStatuses: number;
    urgencyLevels: number;
  };
  errors?: string[];
}

/**
 * Seed default lookup data for the current company (lead sources, statuses, urgency levels)
 */
export const seedCompanyData = async (): Promise<SeedDataResponse> => {
  const response = await api.post<SeedDataResponse>('/datamigration/seed-my-company');
  return response.data;
};

/**
 * Get all lead statuses for the current company
 */
export const getLeadStatuses = async (): Promise<LeadStatusesResponse> => {
  const response = await api.get<LeadStatusesResponse>('/settings/lead-statuses');
  return response.data;
};

/**
 * Create a new lead status
 */
export const createLeadStatus = async (data: CreateLeadStatusData): Promise<LeadStatusesResponse> => {
  const response = await api.post<LeadStatusesResponse>('/settings/lead-statuses', data);
  return response.data;
};

/**
 * Update an existing lead status
 */
export const updateLeadStatus = async (id: number, data: UpdateLeadStatusData): Promise<LeadStatusesResponse> => {
  const response = await api.put<LeadStatusesResponse>(`/settings/lead-statuses/${id}`, data);
  return response.data;
};

/**
 * Delete a lead status (soft delete)
 */
export const deleteLeadStatus = async (id: number): Promise<{ success: boolean; message: string; data: boolean; errors?: string[] }> => {
  const response = await api.delete<{ success: boolean; message: string; data: boolean; errors?: string[] }>(`/settings/lead-statuses/${id}`);
  return response.data;
};

/**
 * Reorder lead statuses
 */
export const reorderLeadStatuses = async (data: LeadStatusReorderData): Promise<{ success: boolean; message: string; data: boolean; errors?: string[] }> => {
  const response = await api.put<{ success: boolean; message: string; data: boolean; errors?: string[] }>('/settings/lead-statuses/reorder', data);
  return response.data;
};

// Email Settings interfaces and API calls
export interface EmailSettings {
  emailSettingsId: number;
  companyId: number;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  fromEmail: string;
  fromName: string;
  enableSsl: boolean;
  isActive: boolean;
  createdDate: string;
  updatedDate?: string;
}

export interface EmailSettingsResponse {
  success: boolean;
  message: string;
  data: EmailSettings;
  errors?: string[];
}

export interface UpdateEmailSettingsData {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword?: string; // Optional - only if password is being updated
  fromEmail: string;
  fromName: string;
  enableSsl: boolean;
  isActive: boolean;
}

export interface TestEmailResponse {
  success: boolean;
  message: string;
  data: boolean;
  errors?: string[];
}

/**
 * Get email settings for the current company
 */
export const getEmailSettings = async (): Promise<EmailSettingsResponse> => {
  const response = await api.get<EmailSettingsResponse>('/settings/email');
  return response.data;
};

/**
 * Update email settings for the current company
 */
export const updateEmailSettings = async (data: UpdateEmailSettingsData): Promise<EmailSettingsResponse> => {
  const response = await api.put<EmailSettingsResponse>('/settings/email', data);
  return response.data;
};

/**
 * Test email settings by sending a test email to the current user
 */
export const testEmailSettings = async (): Promise<TestEmailResponse> => {
  const response = await api.post<TestEmailResponse>('/settings/email/test');
  return response.data;
};
