-- Excel Import Schema Enhancements
-- Adds columns needed for comprehensive Excel shift detail import

-- Enhance schedule_entries table for Excel data
ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS employee_type TEXT;
ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS scheduled_hours DECIMAL(5,2);
ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE schedule_entries ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedule_employee_id ON schedule_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedule_role ON schedule_entries(role);
CREATE INDEX IF NOT EXISTS idx_schedule_region ON schedule_entries(region);
CREATE INDEX IF NOT EXISTS idx_schedule_date_store ON schedule_entries(date, store_number);

-- Update existing stores table to use correct Kinney store numbers
-- First, backup existing test data
CREATE TABLE IF NOT EXISTS stores_backup AS SELECT * FROM stores;

-- Clear existing test stores and reset sequence
DELETE FROM stores WHERE store_number BETWEEN 1001 AND 1005;

-- The Kinney stores will be imported separately to maintain data integrity