-- Fix schedule_entries table issue
-- The backend expects schedule_entries but schema has store_schedules
-- Create schedule_entries table as an alias/view or separate table

-- Create schedule_entries table to match backend expectations
CREATE TABLE IF NOT EXISTS schedule_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_number INTEGER NOT NULL,
    date DATE NOT NULL,
    employee_name TEXT NOT NULL,
    shift_time TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add foreign key to stores table if store exists
    CONSTRAINT fk_schedule_entries_store 
        FOREIGN KEY (store_number) 
        REFERENCES stores(store_number) 
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedule_entries_store_number ON schedule_entries(store_number);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_date ON schedule_entries(date);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_employee ON schedule_entries(employee_name);

-- Add trigger for updated_at
CREATE TRIGGER update_schedule_entries_updated_at 
    BEFORE UPDATE ON schedule_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO schedule_entries (store_number, date, employee_name, shift_time, notes) VALUES 
(1001, CURRENT_DATE, 'John Doe', '9:00 AM - 5:00 PM', 'Regular shift'),
(1001, CURRENT_DATE + INTERVAL '1 day', 'Jane Smith', '10:00 AM - 6:00 PM', 'Cover evening shift'),
(1002, CURRENT_DATE, 'Bob Johnson', '8:00 AM - 4:00 PM', 'Opening shift'),
(1002, CURRENT_DATE + INTERVAL '1 day', 'Alice Williams', '12:00 PM - 8:00 PM', 'Afternoon shift')
ON CONFLICT DO NOTHING;

-- Create a view to unify both schedule tables if needed
CREATE OR REPLACE VIEW unified_schedules AS
SELECT 
    id,
    store_number,
    date,
    employee_name,
    shift_time,
    notes,
    created_at,
    updated_at,
    'schedule_entries' as source_table
FROM schedule_entries
UNION ALL
SELECT 
    id,
    store_number,
    date,
    employee_name,
    shift_time,
    notes,
    created_at,
    updated_at,
    'store_schedules' as source_table
FROM store_schedules;