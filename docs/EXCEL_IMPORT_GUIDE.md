# 📊 Excel Import Guide for Pharmacy Scheduling System

## Overview

This guide explains how to import Excel files containing pharmacy scheduling data into our Supabase database. The system is specifically designed to handle shift detail reports from pharmacy management systems.

## 📋 Supported Excel File Structure

### Expected File Format
- **File Type**: `.xlsx` or `.xls`
- **Maximum Size**: 50MB
- **Encoding**: UTF-8

### Required Sheets
The system expects Excel files with the following sheet structure:

#### 1. "Shift Detail" Sheet (Primary)
**Required Columns:**
- `Employee ID` - Unique employee identifier
- `First Name` - Employee first name
- `Last Name` - Employee last name
- `Role` - Employee role (Pharmacist, Technician, Clerk, etc.)
- `Employee Type` - Full Time, Part Time, etc.
- `Scheduled Date` - Date of the shift
- `Start Time` - Shift start time
- `End Time` - Shift end time
- `Scheduled Hours` - Total hours scheduled
- `Scheduled Site` - Store location (format: "79 - Syracuse (Electronics Pkwy)")

**Optional Columns:**
- `Notes` - Additional shift notes
- `Published` - Whether schedule is published
- `Qualifications` - Employee qualifications
- `Efficiency` - Performance metrics
- `Tags` - Employee tags
- `Meal Break Start Time` - Break start time
- `Meal Break End Time` - Break end time
- `Driving Hours` - Hours spent driving

#### 2. "Employee Hours Summary" Sheet (Optional)
- `Employee ID`
- `First Name`
- `Last Name`
- `Role`
- `Employee Type`
- `Total Scheduled Hours`
- `Total Driving Hours`

#### 3. "Employee Shifts By Site" Sheet (Optional)
- `Employee ID`
- `First Name`
- `Last Name`
- `Role`
- `Employee Type`
- `Site Number`
- `Site Name`
- `Shifts at Site`

## 🗄️ Database Mapping

### 1. Contacts Table (Employees)
```typescript
{
  name: "First Name + Last Name",
  phone: "Employee ID" (used as unique identifier),
  email: null (to be filled later),
  status: "active",
  priority: "medium",
  notes: "Role - Employee Type"
}
```

### 2. Stores Table (Pharmacy Locations)
```typescript
{
  store_number: "Extracted from Scheduled Site",
  address: "Extracted from Scheduled Site",
  city: "Extracted from Scheduled Site",
  state: "NY" (default),
  zip_code: "" (to be filled later),
  phone: "" (to be filled later),
  is_active: true
}
```

### 3. Store Schedules Table (Shift Data)
```typescript
{
  store_number: "Extracted from Scheduled Site",
  date: "Scheduled Date",
  employee_name: "First Name + Last Name",
  employee_id: "Employee ID",
  role: "Role",
  employee_type: "Employee Type",
  shift_time: "Start Time - End Time",
  scheduled_hours: "Scheduled Hours"
}
```

## 🚀 Import Process

### 1. File Upload
```bash
# Via Frontend
1. Navigate to Document Upload page
2. Drag & drop Excel file or click to select
3. File is automatically converted to base64
4. Upload request sent to /functions/v1/document-upload
```

### 2. Processing Pipeline
```typescript
// 1. File validation
- Check file type (.xlsx, .xls)
- Validate file size (max 50MB)
- Create import record in database

// 2. Excel processing
- Parse Excel file using xlsx library
- Extract data from "Shift Detail" sheet
- Identify column headers and map to database fields

// 3. Data extraction
- Extract unique employees (deduplicate by Employee ID)
- Extract unique stores (parse site names)
- Extract all schedule records

// 4. Database import (in order)
- Import stores first (referenced by schedules)
- Import employees (contacts table)
- Import schedules (store_schedules table)
```

### 3. Batch Processing
- **Batch Size**: 100 records per batch
- **Error Handling**: Continues processing on batch errors
- **Progress Tracking**: Real-time progress updates
- **Conflict Resolution**: Uses upsert for stores and employees

## 📊 Expected Import Results

### Sample Output
```json
{
  "success": true,
  "import_id": "test-import-1234567890",
  "message": "Excel file processed successfully",
  "results": {
    "sheets_processed": 1,
    "total_records": 10804,
    "details": {
      "stores": {
        "successCount": 15,
        "errorCount": 0,
        "errors": []
      },
      "employees": {
        "successCount": 1027,
        "errorCount": 0,
        "errors": []
      },
      "schedules": {
        "successCount": 10804,
        "errorCount": 0,
        "errors": []
      }
    },
    "summary": {
      "employees_imported": 1027,
      "schedules_imported": 10804,
      "stores_imported": 15,
      "errors": []
    }
  }
}
```

## 🔧 Testing the Import

### 1. Manual Test Script
```bash
# Run the test script
node test-excel-import.js
```

### 2. Frontend Testing
```bash
# 1. Start the frontend
docker compose up -d frontend

# 2. Navigate to upload page
# 3. Upload the Excel file
# 4. Monitor progress in real-time
```

### 3. API Testing
```bash
# Test the import API directly
curl -X POST http://localhost:8002/functions/v1/process-excel \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_API_KEY" \
  -d '{
    "import_id": "test-123",
    "file_name": "test.xlsx",
    "file_type": "excel",
    "content": "BASE64_CONTENT"
  }'
```

## ⚠️ Common Issues & Solutions

### 1. Missing Required Columns
**Error**: "Required employee columns not found"
**Solution**: Ensure Excel file has "Employee ID", "First Name", "Last Name" columns

### 2. Invalid Site Name Format
**Error**: "Scheduled site column not found"
**Solution**: Site names must follow format: "79 - Syracuse (Electronics Pkwy)"

### 3. Large File Processing
**Error**: "File too large"
**Solution**: Split large files or increase memory limits

### 4. Date Format Issues
**Error**: Invalid date format
**Solution**: Ensure dates are in YYYY-MM-DD format or Excel date format

## 📈 Performance Optimization

### 1. Batch Processing
- Processes records in batches of 100
- Continues on individual batch failures
- Provides detailed error reporting

### 2. Memory Management
- Uses streaming for large files
- Cleans up temporary data
- Optimizes Excel parsing settings

### 3. Database Optimization
- Uses upsert for deduplication
- Creates proper indexes
- Implements transaction safety

## 🔄 Regular Import Workflow

### 1. Weekly Schedule Import
```bash
# Expected workflow:
1. Export schedule from pharmacy system
2. Upload via frontend interface
3. Monitor import progress
4. Verify data in database
5. Send confirmation SMS to employees
```

### 2. Data Validation
```sql
-- Check import results
SELECT COUNT(*) FROM contacts WHERE created_at > NOW() - INTERVAL '1 hour';
SELECT COUNT(*) FROM store_schedules WHERE created_at > NOW() - INTERVAL '1 hour';
SELECT COUNT(*) FROM stores WHERE created_at > NOW() - INTERVAL '1 hour';
```

### 3. Error Recovery
```sql
-- Clean up failed imports
DELETE FROM store_schedules WHERE created_at > NOW() - INTERVAL '1 hour' AND store_id IS NULL;
DELETE FROM contacts WHERE created_at > NOW() - INTERVAL '1 hour' AND phone IS NULL;
```

## 📞 Support

For issues with Excel imports:
1. Check the import logs in Supabase dashboard
2. Verify Excel file format matches requirements
3. Test with sample data first
4. Contact development team for complex issues

---

**Last Updated**: 2025-08-06  
**Version**: 1.0.0  
**Compatible with**: Pharmacy Scheduling System v1.1.0 