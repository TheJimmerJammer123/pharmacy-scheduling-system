// Branded types for better type safety
export type StoreId = string & { readonly __brand: unique symbol };
export type StoreNumber = number & { readonly __brand: unique symbol };
export type ScheduleId = string & { readonly __brand: unique symbol };
export type DateString = string & { readonly __brand: unique symbol };
export type PhoneNumber = string & { readonly __brand: unique symbol };

export interface Store {
  id: StoreId;
  store_number: StoreNumber;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: PhoneNumber;
  pharmacy_hours: string;
  store_hours: string;
  monday_store_hours?: string;
  tuesday_store_hours?: string;
  wednesday_store_hours?: string;
  thursday_store_hours?: string;
  friday_store_hours?: string;
  saturday_store_hours?: string;
  sunday_store_hours?: string;
  monday_pharmacy_hours?: string;
  tuesday_pharmacy_hours?: string;
  wednesday_pharmacy_hours?: string;
  thursday_pharmacy_hours?: string;
  friday_pharmacy_hours?: string;
  saturday_pharmacy_hours?: string;
  sunday_pharmacy_hours?: string;
  store_features?: string[];
  pharmacy_features?: string[];
  immunizations_offered?: string[];
  has_drive_thru?: boolean;
  has_24_hour_pharmacy?: boolean;
  appointment_link?: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreSchedule {
  id: ScheduleId;
  store_number: StoreNumber;
  date: DateString;
  employee_name: string;
  employee_id?: string;
  role?: string;
  employee_type?: string;
  scheduled_hours?: number;
  shift_time: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleFormData {
  employee_name: string;
  employee_id: string;
  role: string;
  employee_type: string;
  scheduled_hours: number;
  shift_time: string;
  notes: string;
}

// Employee role types
export type EmployeeRole = 'Pharmacist' | 'Pharmacy Technician' | 'Cashier' | 'Manager';
export type EmployeeType = 'Full Time' | 'Part Time' | 'PRN' | 'Temporary'; 