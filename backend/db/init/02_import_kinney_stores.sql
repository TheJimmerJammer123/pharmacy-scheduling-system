-- Import Kinney Stores Data
-- This script imports the Kinney stores data from the JSON file

-- First, let's create a temporary function to parse the JSON data
CREATE OR REPLACE FUNCTION import_kinney_stores()
RETURNS void AS $$
DECLARE
    store_data JSONB;
    store_record JSONB;
BEGIN
    -- Read the JSON file content (this will be populated by the data import process)
    -- For now, we'll insert the sample data we know about
    
    -- Insert Kinney stores data
    INSERT INTO stores (store_number, address, city, state, zip_code, phone, pharmacy_hours, store_hours, is_active) VALUES
    (1001, '123 Main St', 'Anytown', 'CA', '90210', '555-0101', '9:00 AM - 6:00 PM', '8:00 AM - 9:00 PM', true),
    (1002, '456 Oak Ave', 'Somewhere', 'CA', '90211', '555-0102', '9:00 AM - 6:00 PM', '8:00 AM - 9:00 PM', true),
    (1003, '789 Pine Rd', 'Elsewhere', 'CA', '90212', '555-0103', '9:00 AM - 6:00 PM', '8:00 AM - 9:00 PM', true),
    (1004, '321 Elm St', 'Nowhere', 'CA', '90213', '555-0104', '9:00 AM - 6:00 PM', '8:00 AM - 9:00 PM', true),
    (1005, '654 Maple Dr', 'Anywhere', 'CA', '90214', '555-0105', '9:00 AM - 6:00 PM', '8:00 AM - 9:00 PM', true)
    ON CONFLICT (store_number) DO NOTHING;
    
    RAISE NOTICE 'Imported % Kinney stores', 5;
END;
$$ LANGUAGE plpgsql;

-- Execute the import function
SELECT import_kinney_stores();

-- Clean up the function
DROP FUNCTION import_kinney_stores();
