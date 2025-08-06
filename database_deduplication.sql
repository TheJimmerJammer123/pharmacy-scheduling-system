-- Database Deduplication Script for store_schedules table
-- This script removes duplicate schedule records while keeping the most recent ones

-- Step 1: Identify duplicates (for verification)
SELECT 
    employee_name,
    date,
    store_number,
    shift_time,
    COUNT(*) as duplicate_count
FROM store_schedules 
GROUP BY employee_name, date, store_number, shift_time
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, employee_name, date;

-- Step 2: Create a temporary table with deduplicated records
-- (keeps the record with the latest created_at timestamp for each duplicate group)
CREATE TEMP TABLE deduplicated_schedules AS
SELECT DISTINCT ON (employee_name, date, store_number, shift_time) *
FROM store_schedules
ORDER BY employee_name, date, store_number, shift_time, created_at DESC;

-- Step 3: Check counts before cleanup
SELECT 
    'Original count' as description,
    COUNT(*) as record_count
FROM store_schedules
UNION ALL
SELECT 
    'Deduplicated count' as description,
    COUNT(*) as record_count
FROM deduplicated_schedules;

-- Step 4: Backup current data (optional, recommended)
-- CREATE TABLE store_schedules_backup AS SELECT * FROM store_schedules;

-- Step 5: Delete all records from original table
-- DELETE FROM store_schedules;

-- Step 6: Insert deduplicated records back
-- INSERT INTO store_schedules SELECT * FROM deduplicated_schedules;

-- Step 7: Verify final count
-- SELECT COUNT(*) as final_count FROM store_schedules;

-- Step 8: Clean up temporary table
-- DROP TABLE deduplicated_schedules;

-- NOTE: Steps 4-8 are commented out for safety
-- Uncomment and run them after reviewing the duplicate identification results
-- Always create a backup before running deletion operations!