/**
 * Date utility functions for handling dates in local timezone
 * 
 * These functions ensure dates are handled consistently across the application,
 * avoiding timezone conversion issues that can occur when using toISOString().
 */

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 * @param {Date} date - The date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateForInput = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a date string (YYYY-MM-DD) as a local date, avoiding timezone issues
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Date object in local timezone
 */
export const parseDateString = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

/**
 * Format a date string for display
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (dateString, options = { month: 'short', day: 'numeric' }) => {
  if (!dateString) return null;
  const date = parseDateString(dateString);
  return date.toLocaleDateString('en-US', options);
};

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayString = () => {
  return formatDateForInput(new Date());
};
