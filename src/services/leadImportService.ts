import api from './api';
import type { ApiResponse } from './leadService';

export type LeadImportStatus =
  | 'Queued'
  | 'Processing'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | string;

export interface StartLeadImportResult {
  leadImportId: number;
  status: LeadImportStatus;
}

export interface LeadImportProgress {
  status: LeadImportStatus;
  // Backend DTO names (primary)
  processedRecords?: number;
  totalRecords?: number;
  percent?: number;

  // Legacy/alternate names (fallback)
  processed?: number;
  total?: number;

  // optional counts (backend-provided; frontend should only render)
  totalLeadsInFile?: number; // legacy
  importedCount?: number; // legacy
  rejectedDuplicatesCount?: number; // legacy

  insertedCount?: number;
  duplicateRejectedCount?: number;
}

export interface LeadImportRejectedRow {
  rowNumber?: number;
  clientName?: string;
  name?: string;
  mobileNumber?: string;
  phone?: string;
  reason?: string;
}

export interface LeadImportDetails {
  leadImportId?: number;
  fileName?: string;
  // Backend DTO names (primary)
  importStartedAtUtc?: string;
  importCompletedAtUtc?: string;

  // Legacy/alternate names (fallback)
  createdDate?: string;
  status?: LeadImportStatus;

  // Backend DTO names (primary)
  totalRecords?: number;
  processedRecords?: number;
  insertedCount?: number;
  duplicateRejectedCount?: number;
  errorMessage?: string;

  // Legacy/alternate names (fallback)
  totalLeadsInFile?: number;
  importedCount?: number;
  rejectedDuplicatesCount?: number;

  rejectedRows?: LeadImportRejectedRow[];
}

export interface LeadImportListItem {
  leadImportId: number;
  fileName?: string;
  // Backend DTO names (primary)
  importStartedAtUtc?: string;
  importCompletedAtUtc?: string;

  // Legacy/alternate names (fallback)
  createdDate?: string;
  status?: LeadImportStatus;

  // Backend DTO names (primary)
  totalRecords?: number;
  insertedCount?: number;
  duplicateRejectedCount?: number;

  // Legacy/alternate names (fallback)
  totalLeadsInFile?: number;
  importedCount?: number;
  rejectedDuplicatesCount?: number;
}

const unwrapApiResponse = <T,>(payload: any): { success?: boolean; message?: string; data?: T } => {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return payload as ApiResponse<T>;
  }
  // Fallback: backend might return raw data object
  return { success: true, data: payload as T };
};

const normalizeStatus = (status?: string): string => (status ?? '').toString().trim().toLowerCase();

export const isTerminalStatus = (status?: LeadImportStatus): boolean => {
  const s = normalizeStatus(status as string);
  return s === 'completed' || s === 'failed' || s === 'cancelled';
};

export const isRunningStatus = (status?: LeadImportStatus): boolean => {
  const s = normalizeStatus(status as string);
  return s === 'queued' || s === 'processing';
};

const getFileNameFromContentDisposition = (headers: any, fallback: string): string => {
  const header = (headers?.['content-disposition'] || headers?.['Content-Disposition']) as string | undefined;
  if (!header) return fallback;

  // Handles:
  // - Content-Disposition: attachment; filename="file.xlsx"
  // - Content-Disposition: attachment; filename*=UTF-8''file.xlsx
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(header);
  if (!match?.[1]) return fallback;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const guessExtensionFromContentType = (contentType?: string): 'csv' | 'xlsx' => {
  const ct = (contentType ?? '').toString().toLowerCase();
  if (ct.includes('text/csv') || ct.includes('application/csv')) return 'csv';
  return 'xlsx';
};

export const downloadLeadImportTemplate = async (): Promise<{ blob: Blob; fileName: string }> => {
  const response = await api.get('/lead-imports/template', { responseType: 'blob' });
  let fileName = `lead_import_template_${new Date().toISOString().split('T')[0]}.xlsx`;
  fileName = getFileNameFromContentDisposition(response.headers, fileName);

  return { blob: response.data as Blob, fileName };
};

export const downloadLeadImportRejectedRows = async (
  leadImportId: number
): Promise<{ blob: Blob; fileName: string }> => {
  // Backend endpoint: returns a downloadable file containing rejected rows for the import.
  const response = await api.get(`/lead-imports/${leadImportId}/rejected-rows/excel`, { responseType: 'blob' });

  const ext = guessExtensionFromContentType(response.headers?.['content-type'] || response.headers?.['Content-Type']);
  let fileName = `lead_import_${leadImportId}_rejected_rows_${new Date().toISOString().split('T')[0]}.${ext}`;
  fileName = getFileNameFromContentDisposition(response.headers, fileName);

  return { blob: response.data as Blob, fileName };
};

export const startLeadImport = async (
  file: File,
  options?: { onUploadProgress?: (percent: number) => void }
): Promise<{ success: boolean; message?: string; data?: StartLeadImportResult }> => {
  const formData = new FormData();
  // Backend expects multipart/form-data with field name: "file"
  formData.append('file', file);

  const response = await api.post('/lead-imports', formData, {
    // Let the browser/axios set the multipart boundary automatically.
    onUploadProgress: (evt) => {
      if (!options?.onUploadProgress) return;
      const total = evt.total ?? 0;
      if (!total) return;
      const percent = Math.max(0, Math.min(100, Math.round((evt.loaded * 100) / total)));
      options.onUploadProgress(percent);
    },
  });

  const unwrapped = unwrapApiResponse<StartLeadImportResult>(response.data);
  return {
    success: unwrapped.success !== false,
    message: unwrapped.message,
    data: unwrapped.data,
  };
};

export const getLeadImportProgress = async (
  leadImportId: number
): Promise<{ success: boolean; message?: string; data?: LeadImportProgress }> => {
  const response = await api.get(`/lead-imports/${leadImportId}/progress`);
  const unwrapped = unwrapApiResponse<LeadImportProgress>(response.data);
  return {
    success: unwrapped.success !== false,
    message: unwrapped.message,
    data: unwrapped.data,
  };
};

export const getLeadImportDetails = async (
  leadImportId: number
): Promise<{ success: boolean; message?: string; data?: LeadImportDetails }> => {
  const response = await api.get(`/lead-imports/${leadImportId}`);
  const unwrapped = unwrapApiResponse<LeadImportDetails>(response.data);
  return {
    success: unwrapped.success !== false,
    message: unwrapped.message,
    data: unwrapped.data,
  };
};

export const getLeadImportHistory = async (): Promise<{ success: boolean; message?: string; data?: LeadImportListItem[] }> => {
  const response = await api.get('/lead-imports');
  const unwrapped = unwrapApiResponse<LeadImportListItem[]>(response.data);
  return {
    success: unwrapped.success !== false,
    message: unwrapped.message,
    data: unwrapped.data,
  };
};

