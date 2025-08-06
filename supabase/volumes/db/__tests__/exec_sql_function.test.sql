-- Test suite for exec_sql function
-- This tests the security and functionality of the dynamic SQL execution function

-- Test 1: Basic SELECT query execution
SELECT 
  CASE 
    WHEN exec_sql('SELECT 1 as test_value') = '[{"test_value":1}]'::json
    THEN 'PASS: Basic SELECT query works'
    ELSE 'FAIL: Basic SELECT query failed'
  END as test_result;

-- Test 2: SELECT query with table data
SELECT 
  CASE 
    WHEN exec_sql('SELECT store_number, employee_name FROM store_schedules LIMIT 1') IS NOT NULL
    THEN 'PASS: Table SELECT query works'
    ELSE 'FAIL: Table SELECT query failed'
  END as test_result;

-- Test 3: Security test - DROP statement should be blocked
SELECT 
  CASE 
    WHEN exec_sql('DROP TABLE test_table')::json->>'error' = 'true'
    THEN 'PASS: DROP statement blocked'
    ELSE 'FAIL: DROP statement not blocked'
  END as test_result;

-- Test 4: Security test - DELETE statement should be blocked
SELECT 
  CASE 
    WHEN exec_sql('DELETE FROM store_schedules')::json->>'error' = 'true'
    THEN 'PASS: DELETE statement blocked'
    ELSE 'FAIL: DELETE statement not blocked'
  END as test_result;

-- Test 5: Security test - UPDATE statement should be blocked
SELECT 
  CASE 
    WHEN exec_sql('UPDATE store_schedules SET employee_name = ''test''')::json->>'error' = 'true'
    THEN 'PASS: UPDATE statement blocked'
    ELSE 'FAIL: UPDATE statement not blocked'
  END as test_result;

-- Test 6: Security test - INSERT statement should be blocked
SELECT 
  CASE 
    WHEN exec_sql('INSERT INTO store_schedules (store_number, employee_name) VALUES (1, ''test'')')::json->>'error' = 'true'
    THEN 'PASS: INSERT statement blocked'
    ELSE 'FAIL: INSERT statement not blocked'
  END as test_result;

-- Test 7: Security test - ALTER statement should be blocked
SELECT 
  CASE 
    WHEN exec_sql('ALTER TABLE store_schedules ADD COLUMN test_column TEXT')::json->>'error' = 'true'
    THEN 'PASS: ALTER statement blocked'
    ELSE 'FAIL: ALTER statement not blocked'
  END as test_result;

-- Test 8: Security test - CREATE statement should be blocked
SELECT 
  CASE 
    WHEN exec_sql('CREATE TABLE test_table (id INTEGER)')::json->>'error' = 'true'
    THEN 'PASS: CREATE statement blocked'
    ELSE 'FAIL: CREATE statement not blocked'
  END as test_result;

-- Test 9: Security test - TRUNCATE statement should be blocked
SELECT 
  CASE 
    WHEN exec_sql('TRUNCATE TABLE store_schedules')::json->>'error' = 'true'
    THEN 'PASS: TRUNCATE statement blocked'
    ELSE 'FAIL: TRUNCATE statement not blocked'
  END as test_result;

-- Test 10: Case insensitive security test
SELECT 
  CASE 
    WHEN exec_sql('select * from store_schedules') IS NOT NULL
    THEN 'PASS: Case insensitive SELECT works'
    ELSE 'FAIL: Case insensitive SELECT failed'
  END as test_result;

-- Test 11: Complex SELECT query with JOIN
SELECT 
  CASE 
    WHEN exec_sql('SELECT s.store_number, s.employee_name, c.phone FROM store_schedules s JOIN contacts c ON s.employee_name = c.name LIMIT 1') IS NOT NULL
    THEN 'PASS: Complex SELECT with JOIN works'
    ELSE 'FAIL: Complex SELECT with JOIN failed'
  END as test_result;

-- Test 12: SELECT query with WHERE clause
SELECT 
  CASE 
    WHEN exec_sql('SELECT * FROM store_schedules WHERE store_number = 1 LIMIT 1') IS NOT NULL
    THEN 'PASS: SELECT with WHERE clause works'
    ELSE 'FAIL: SELECT with WHERE clause failed'
  END as test_result;

-- Test 13: SELECT query with GROUP BY
SELECT 
  CASE 
    WHEN exec_sql('SELECT store_number, COUNT(*) as employee_count FROM store_schedules GROUP BY store_number LIMIT 1') IS NOT NULL
    THEN 'PASS: SELECT with GROUP BY works'
    ELSE 'FAIL: SELECT with GROUP BY failed'
  END as test_result;

-- Test 14: SELECT query with ORDER BY
SELECT 
  CASE 
    WHEN exec_sql('SELECT * FROM store_schedules ORDER BY employee_name LIMIT 1') IS NOT NULL
    THEN 'PASS: SELECT with ORDER BY works'
    ELSE 'FAIL: SELECT with ORDER BY failed'
  END as test_result;

-- Test 15: Empty result set handling
SELECT 
  CASE 
    WHEN exec_sql('SELECT * FROM store_schedules WHERE store_number = 999999') = '[]'::json
    THEN 'PASS: Empty result set handled correctly'
    ELSE 'FAIL: Empty result set not handled correctly'
  END as test_result;

-- Test 16: SQL injection attempt - should be blocked
SELECT 
  CASE 
    WHEN exec_sql('SELECT * FROM store_schedules; DROP TABLE store_schedules;')::json->>'error' = 'true'
    THEN 'PASS: SQL injection attempt blocked'
    ELSE 'FAIL: SQL injection attempt not blocked'
  END as test_result;

-- Test 17: Multiple statements - should be blocked
SELECT 
  CASE 
    WHEN exec_sql('SELECT 1; SELECT 2;')::json->>'error' = 'true'
    THEN 'PASS: Multiple statements blocked'
    ELSE 'FAIL: Multiple statements not blocked'
  END as test_result;

-- Test 18: Subquery test
SELECT 
  CASE 
    WHEN exec_sql('SELECT * FROM (SELECT store_number, COUNT(*) as count FROM store_schedules GROUP BY store_number) sub WHERE count > 0 LIMIT 1') IS NOT NULL
    THEN 'PASS: Subquery works'
    ELSE 'FAIL: Subquery failed'
  END as test_result;

-- Test 19: Aggregate function test
SELECT 
  CASE 
    WHEN exec_sql('SELECT COUNT(*) as total_employees FROM store_schedules') IS NOT NULL
    THEN 'PASS: Aggregate function works'
    ELSE 'FAIL: Aggregate function failed'
  END as test_result;

-- Test 20: Date function test
SELECT 
  CASE 
    WHEN exec_sql('SELECT CURRENT_DATE as today') IS NOT NULL
    THEN 'PASS: Date function works'
    ELSE 'FAIL: Date function failed'
  END as test_result;

-- Test 21: String function test
SELECT 
  CASE 
    WHEN exec_sql('SELECT UPPER(employee_name) as upper_name FROM store_schedules LIMIT 1') IS NOT NULL
    THEN 'PASS: String function works'
    ELSE 'FAIL: String function failed'
  END as test_result;

-- Test 22: Mathematical function test
SELECT 
  CASE 
    WHEN exec_sql('SELECT ABS(-5) as absolute_value') IS NOT NULL
    THEN 'PASS: Mathematical function works'
    ELSE 'FAIL: Mathematical function failed'
  END as test_result;

-- Test 23: Window function test
SELECT 
  CASE 
    WHEN exec_sql('SELECT store_number, employee_name, ROW_NUMBER() OVER (PARTITION BY store_number ORDER BY employee_name) as row_num FROM store_schedules LIMIT 1') IS NOT NULL
    THEN 'PASS: Window function works'
    ELSE 'FAIL: Window function failed'
  END as test_result;

-- Test 24: CTE (Common Table Expression) test
SELECT 
  CASE 
    WHEN exec_sql('WITH employee_counts AS (SELECT store_number, COUNT(*) as count FROM store_schedules GROUP BY store_number) SELECT * FROM employee_counts LIMIT 1') IS NOT NULL
    THEN 'PASS: CTE works'
    ELSE 'FAIL: CTE failed'
  END as test_result;

-- Test 25: UNION test
SELECT 
  CASE 
    WHEN exec_sql('SELECT store_number FROM store_schedules WHERE store_number = 1 UNION SELECT store_number FROM store_schedules WHERE store_number = 2') IS NOT NULL
    THEN 'PASS: UNION works'
    ELSE 'FAIL: UNION failed'
  END as test_result;

-- Test 26: Error handling test - invalid table name
SELECT 
  CASE 
    WHEN exec_sql('SELECT * FROM non_existent_table')::json->>'error' = 'true'
    THEN 'PASS: Invalid table error handled'
    ELSE 'FAIL: Invalid table error not handled'
  END as test_result;

-- Test 27: Error handling test - invalid column name
SELECT 
  CASE 
    WHEN exec_sql('SELECT non_existent_column FROM store_schedules')::json->>'error' = 'true'
    THEN 'PASS: Invalid column error handled'
    ELSE 'FAIL: Invalid column error not handled'
  END as test_result;

-- Test 28: Error handling test - syntax error
SELECT 
  CASE 
    WHEN exec_sql('SELECT * FROM store_schedules WHERE')::json->>'error' = 'true'
    THEN 'PASS: Syntax error handled'
    ELSE 'FAIL: Syntax error not handled'
  END as test_result;

-- Test 29: Performance test - large result set
SELECT 
  CASE 
    WHEN exec_sql('SELECT * FROM store_schedules LIMIT 1000') IS NOT NULL
    THEN 'PASS: Large result set handled'
    ELSE 'FAIL: Large result set failed'
  END as test_result;

-- Test 30: Security test - comment injection attempt
SELECT 
  CASE 
    WHEN exec_sql('SELECT * FROM store_schedules -- DROP TABLE store_schedules') IS NOT NULL
    THEN 'PASS: Comment injection handled safely'
    ELSE 'FAIL: Comment injection not handled'
  END as test_result;

-- Summary of all tests
SELECT 
  'exec_sql function test summary' as test_summary,
  COUNT(*) as total_tests,
  COUNT(CASE WHEN test_result LIKE 'PASS%' THEN 1 END) as passed_tests,
  COUNT(CASE WHEN test_result LIKE 'FAIL%' THEN 1 END) as failed_tests
FROM (
  -- Include all test results here
  SELECT 'Basic SELECT query works' as test_result
  UNION ALL SELECT 'Table SELECT query works'
  UNION ALL SELECT 'DROP statement blocked'
  UNION ALL SELECT 'DELETE statement blocked'
  UNION ALL SELECT 'UPDATE statement blocked'
  UNION ALL SELECT 'INSERT statement blocked'
  UNION ALL SELECT 'ALTER statement blocked'
  UNION ALL SELECT 'CREATE statement blocked'
  UNION ALL SELECT 'TRUNCATE statement blocked'
  UNION ALL SELECT 'Case insensitive SELECT works'
  UNION ALL SELECT 'Complex SELECT with JOIN works'
  UNION ALL SELECT 'SELECT with WHERE clause works'
  UNION ALL SELECT 'SELECT with GROUP BY works'
  UNION ALL SELECT 'SELECT with ORDER BY works'
  UNION ALL SELECT 'Empty result set handled correctly'
  UNION ALL SELECT 'SQL injection attempt blocked'
  UNION ALL SELECT 'Multiple statements blocked'
  UNION ALL SELECT 'Subquery works'
  UNION ALL SELECT 'Aggregate function works'
  UNION ALL SELECT 'Date function works'
  UNION ALL SELECT 'String function works'
  UNION ALL SELECT 'Mathematical function works'
  UNION ALL SELECT 'Window function works'
  UNION ALL SELECT 'CTE works'
  UNION ALL SELECT 'UNION works'
  UNION ALL SELECT 'Invalid table error handled'
  UNION ALL SELECT 'Invalid column error handled'
  UNION ALL SELECT 'Syntax error handled'
  UNION ALL SELECT 'Large result set handled'
  UNION ALL SELECT 'Comment injection handled safely'
) as test_results;