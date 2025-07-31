import { DateString } from '@/types';

/**
 * Converts a Date or date string to YYYY-MM-DD format
 * @param date - Date object or ISO date string
 * @returns Formatted date string
 */
export function toDateOnlyString(date: Date | string): DateString {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10) as DateString;
}

/**
 * Formats a date string for display
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string for display
 */
export function formatDateForDisplay(dateString: DateString): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

/**
 * Checks if a date is today
 * @param date - Date object
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Checks if a date is in the current month
 * @param date - Date object
 * @param currentMonth - Current month (0-based)
 * @returns True if the date is in the current month
 */
export function isCurrentMonth(date: Date, currentMonth: number): boolean {
  return date.getMonth() === currentMonth;
}

/**
 * Gets the start and end dates for a calendar month view
 * @param year - Year
 * @param month - Month (0-based)
 * @returns Object with start and end dates
 */
export function getCalendarBounds(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  return { firstDay, lastDay, startDate };
}

/**
 * Generates calendar days for a month view (6 weeks)
 * @param year - Year
 * @param month - Month (0-based)
 * @returns Array of Date objects for calendar display
 */
export function generateCalendarDays(year: number, month: number): Date[] {
  const { startDate } = getCalendarBounds(year, month);
  const days: Date[] = [];
  const current = new Date(startDate);
  
  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 7; day++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }
  
  return days;
}

/**
 * Converts date to local date string avoiding timezone issues
 * @param date - Date object
 * @returns Local date string in YYYY-MM-DD format
 */
export function toLocalDateString(date: Date): DateString {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as DateString;
} 