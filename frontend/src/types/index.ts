// Barrel exports for all types
export * from './store';

// Utility types for better type safety
export type DateString = string & { readonly __brand: unique symbol };
export type PhoneNumber = string & { readonly __brand: unique symbol };
export type EmailAddress = string & { readonly __brand: unique symbol };

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form states
export type FormState = 'idle' | 'loading' | 'submitting' | 'success' | 'error';

// Calendar utility types
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasSchedules: boolean;
}

// Panel layout types
export interface PanelSizes {
  horizontal: [number, number];
  vertical: [number, number];
} 