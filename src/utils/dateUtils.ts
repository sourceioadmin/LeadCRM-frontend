/**
 * Centralized Date Utility Functions
 * Provides consistent date formatting across the entire application
 */

/**
 * Format a date string for display in a user-friendly format
 * @param dateString - ISO date string or null/undefined
 * @returns Formatted date string (e.g., "Dec 18, 2025") or '-' if invalid
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Format a date string for HTML date input fields
 * Uses local date methods to prevent timezone conversion issues
 * @param dateString - ISO date string or null/undefined
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 */
export const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Use local date methods to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

/**
 * Format a date string with time for display
 * @param dateString - ISO date string or null/undefined
 * @returns Formatted date-time string (e.g., "Dec 18, 2025, 02:30 PM") or '-' if invalid
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

/**
 * Get today's date formatted for HTML date input fields
 * @returns Today's date in YYYY-MM-DD format
 */
export const getTodayForInput = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date is overdue (before today)
 * @param dateString - ISO date string or null/undefined
 * @returns true if the date is before today, false otherwise
 */
export const isOverdue = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(dateString);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate < today;
  } catch {
    return false;
  }
};

/**
 * Check if a date is today
 * @param dateString - ISO date string or null/undefined
 * @returns true if the date is today, false otherwise
 */
export const isToday = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(dateString);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate.getTime() === today.getTime();
  } catch {
    return false;
  }
};

/**
 * Format a date for short display (useful for tables with limited space)
 * @param dateString - ISO date string or null/undefined
 * @returns Short formatted date string (e.g., "12/18/25") or '-' if invalid
 */
export const formatDateShort = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};
