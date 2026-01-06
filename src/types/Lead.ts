export interface Lead {
  leadId: number;
  companyId: number;
  leadDate: string;
  clientName: string;
  companyName?: string;
  mobileNumber: string;
  emailAddress?: string;
  address?: string;
  city?: string;
  leadSourceId: number;
  leadSourceName?: string; // Added for display
  referredBy?: string;
  interestedIn?: string;
  expectedBudget?: number;
  urgencyLevelId?: number;
  urgencyLevelName?: string; // Added for display
  leadStatusId: number;
  leadStatusName?: string; // Added for display
  previousLeadStatusId?: number;
  previousLeadStatusName?: string; // Added for display
  assignedToUserId?: number;
  assignedToUserName?: string; // Added for display
  followupDate?: string;
  notes?: string;
  createdDate: string;
  createdByUserId: number;
  createdByUserName?: string; // Added for display
  updatedDate?: string;
  updatedByUserId?: number;
  updatedByUserName?: string; // Added for display
  statusUpdateDate?: string;
}

export interface LeadSource {
  leadSourceId: number;
  companyId: number;
  name: string;
  isActive: boolean;
  createdDate: string;
  updatedDate?: string;
}

export interface LeadStatus {
  leadStatusId: number;
  companyId: number;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdDate: string;
  updatedDate?: string;
}

export interface Urgency {
  urgencyLevelId: number;
  companyId: number;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdDate: string;
  updatedDate?: string;
}

export interface UpcomingFollowupsResponse {
  followups: Lead[];
  overdueCount: number;
  upcomingCount: number;
}

export interface RescheduleFollowupRequest {
  newFollowupDate: string;
}

export interface AddNoteRequest {
  note: string;
}
