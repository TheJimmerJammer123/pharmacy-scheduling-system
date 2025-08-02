# 📄 Document Ingestion System

## Overview

The Document Ingestion System is a comprehensive, well-organized solution for uploading and processing various document types (Excel, PDF, CSV) into the pharmacy scheduling system. It provides both manual upload capabilities and automated processing pipelines.

## 🏗️ Architecture

### Core Components

1. **Document Upload Service** (`/functions/v1/document-upload`)
   - Handles file uploads and validation
   - Supports multiple file types (Excel, PDF, CSV)
   - File size validation (max 50MB)
   - Base64 encoding for secure transmission

2. **File Processing Pipeline**
   - **Excel Processing** (`/functions/v1/process-excel`)
   - **PDF Processing** (`/functions/v1/process-pdf`) - Future
   - **CSV Processing** (`/functions/v1/process-csv`) - Future

3. **Database Schema**
   - `document_imports` - Track uploads and processing status
   - `import_history` - Detailed import records
   - `data_mappings` - Column mapping configurations
   - `processing_templates` - Processing templates for different file types

4. **Frontend Interface**
   - Drag-and-drop file upload
   - Real-time progress tracking
   - Import history and status monitoring

## 📊 Database Schema

### document_imports
```sql
CREATE TABLE document_imports (
    id UUID PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('excel', 'pdf', 'csv')),
    file_size INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    message TEXT,
    content TEXT, -- Base64 encoded file content
    metadata JSONB DEFAULT '{}',
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### import_history
```sql
CREATE TABLE import_history (
    id UUID PRIMARY KEY,
    import_id UUID REFERENCES document_imports(id),
    table_name TEXT NOT NULL,
    records_imported INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### data_mappings
```sql
CREATE TABLE data_mappings (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    file_type TEXT NOT NULL,
    sheet_name TEXT,
    target_table TEXT NOT NULL,
    column_mappings JSONB NOT NULL,
    transformation_rules JSONB DEFAULT '{}',
    validation_rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 Processing Workflow

### 1. File Upload
```
User uploads file → Frontend converts to base64 → POST to /document-upload
```

### 2. Validation & Storage
```
Validate file type/size → Create import record → Store base64 content
```

### 3. Processing Trigger
```
Determine file type → Trigger appropriate processor → Update status to 'processing'
```

### 4. Data Extraction
```
Parse file content → Extract data from sheets → Map to database schema
```

### 5. Database Import
```
Transform data → Insert into target tables → Record import history
```

### 6. Completion
```
Update status to 'completed' → Store metadata → Clean up temporary content
```

## 📋 Supported File Types

### Excel Files (.xlsx, .xls)
- **Multi-tabbed support**: Process multiple sheets in single file
- **Automatic mapping**: Map sheet names to database tables
- **Data validation**: Validate required columns and data types
- **Transformation**: Apply business rules and data cleaning

**Expected Sheet Structure:**
- **Stores**: store_number, address, city, state, zip_code, phone
- **Employees**: name, phone, email, status, priority
- **Schedules**: store_number, date, employee_name, shift_time, role

### CSV Files (.csv)
- **Single table import**: Import data to specified table
- **Header detection**: Automatic column mapping
- **Data type inference**: Detect and convert data types

### PDF Files (.pdf)
- **Text extraction**: Extract text content from PDFs
- **Table detection**: Identify and extract tabular data
- **OCR support**: Future enhancement for scanned documents

## 🎯 Data Mapping

### Default Mappings

#### Excel → Database Tables
```json
{
  "excel_stores": {
    "sheet_name": "Stores",
    "target_table": "stores",
    "column_mappings": {
      "store_number": "store_number",
      "address": "address",
      "city": "city",
      "state": "state",
      "zip_code": "zip_code",
      "phone": "phone"
    }
  },
  "excel_contacts": {
    "sheet_name": "Employees",
    "target_table": "contacts",
    "column_mappings": {
      "name": "name",
      "phone": "phone",
      "email": "email",
      "status": "status",
      "priority": "priority"
    }
  },
  "excel_schedules": {
    "sheet_name": "Schedules",
    "target_table": "store_schedules",
    "column_mappings": {
      "store_number": "store_number",
      "date": "date",
      "employee_name": "employee_name",
      "shift_time": "shift_time",
      "role": "role"
    }
  }
}
```

## 🔧 Configuration

### Processing Templates
```json
{
  "excel_pharmacy_data": {
    "sheets": ["Stores", "Employees", "Schedules"],
    "validation": {
      "required_columns": {
        "Stores": ["store_number", "address", "city", "state", "zip_code", "phone"],
        "Employees": ["name", "phone", "email"],
        "Schedules": ["store_number", "date", "employee_name", "shift_time"]
      }
    },
    "transformations": {
      "date_format": "YYYY-MM-DD",
      "phone_format": "standard"
    }
  }
}
```

## 🚀 Usage

### Frontend Upload
```typescript
// Upload file using the DocumentUpload component
<DocumentUpload />

// Or programmatically
const response = await fetch('/functions/v1/document-upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    file_name: 'pharmacy_data.xlsx',
    file_type: 'excel',
    file_size: file.size,
    content: base64Content,
    metadata: {
      description: 'Pharmacy schedule data',
      tags: ['pharmacy', 'schedule'],
      priority: 'high'
    }
  })
})
```

### Check Import Status
```typescript
// Query import status
const { data: imports } = await supabase
  .from('document_imports')
  .select('*')
  .order('created_at', { ascending: false })

// Monitor real-time updates
const subscription = supabase
  .channel('document_imports')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'document_imports'
  }, (payload) => {
    console.log('Import status updated:', payload)
  })
  .subscribe()
```

## 🔍 Monitoring & Troubleshooting

### Import Status Tracking
- **pending**: File uploaded, waiting for processing
- **processing**: Currently being processed
- **completed**: Successfully imported
- **failed**: Processing failed

### Error Handling
- File validation errors
- Processing errors
- Database import errors
- Network/timeout errors

### Logging
- Import progress tracking
- Error details storage
- Processing time metrics
- Data validation results

## 🔮 Future Enhancements

### Planned Features
1. **PDF Processing**: Text extraction and table detection
2. **CSV Processing**: Enhanced CSV import with validation
3. **Batch Processing**: Process multiple files simultaneously
4. **Scheduled Imports**: Automated file processing
5. **Data Validation**: Enhanced validation rules
6. **Rollback Capability**: Undo imports if needed
7. **Data Transformation**: Advanced data cleaning and transformation
8. **API Integration**: External system integration
9. **Audit Trail**: Complete import history and tracking
10. **Performance Optimization**: Large file handling improvements

### Advanced Features
- **Machine Learning**: Intelligent data mapping
- **OCR Integration**: Scanned document processing
- **Data Quality Scoring**: Assess import data quality
- **Conflict Resolution**: Handle duplicate data scenarios
- **Incremental Updates**: Update existing records
- **Data Lineage**: Track data source and transformations

## 🛠️ Development

### Adding New File Types
1. Create processing function (`/functions/v1/process-{type}`)
2. Add file type validation
3. Implement data extraction logic
4. Create data mapping configurations
5. Add frontend support

### Custom Data Mappings
1. Add mapping to `data_mappings` table
2. Configure column mappings
3. Set transformation rules
4. Test with sample data

### Performance Optimization
- Implement streaming for large files
- Add caching for repeated imports
- Optimize database operations
- Add parallel processing capabilities

## 📚 API Reference

### POST /functions/v1/document-upload
Upload a document for processing.

**Request Body:**
```json
{
  "file_name": "string",
  "file_type": "excel|pdf|csv",
  "file_size": "number",
  "content": "base64_string",
  "metadata": {
    "description": "string",
    "tags": ["string"],
    "priority": "low|medium|high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "import_id": "uuid",
  "message": "string",
  "status": "pending",
  "processing_endpoint": "string"
}
```

### GET /rest/v1/document_imports
Query import history and status.

**Query Parameters:**
- `status`: Filter by status
- `file_type`: Filter by file type
- `order`: Sort order (created_at.desc)

## 🔒 Security Considerations

- File size limits (50MB max)
- File type validation
- Base64 encoding for secure transmission
- Row-level security policies
- Input sanitization
- Error message sanitization
- Access control via Supabase RLS

## 📈 Performance Metrics

- Upload success rate
- Processing time per file type
- Import success rate
- Error frequency by file type
- Average file size processed
- Concurrent processing capacity 