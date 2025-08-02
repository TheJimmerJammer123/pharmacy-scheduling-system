-- Document Import Management System
-- This file creates the database schema for tracking document uploads and processing

-- Document imports table
CREATE TABLE document_imports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('excel', 'pdf', 'csv')),
    file_size INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    message TEXT,
    content TEXT, -- Base64 encoded file content (temporary storage)
    metadata JSONB DEFAULT '{}',
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Import history table for tracking processed records
CREATE TABLE import_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    import_id UUID REFERENCES document_imports(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    records_imported INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data mapping configurations
CREATE TABLE data_mappings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    file_type TEXT NOT NULL,
    sheet_name TEXT,
    target_table TEXT NOT NULL,
    column_mappings JSONB NOT NULL, -- Map Excel columns to database columns
    transformation_rules JSONB DEFAULT '{}',
    validation_rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing templates for different file types
CREATE TABLE processing_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    file_type TEXT NOT NULL,
    template_config JSONB NOT NULL, -- Processing configuration
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_document_imports_status ON document_imports(status);
CREATE INDEX idx_document_imports_file_type ON document_imports(file_type);
CREATE INDEX idx_document_imports_created_at ON document_imports(created_at);
CREATE INDEX idx_import_history_import_id ON import_history(import_id);
CREATE INDEX idx_data_mappings_file_type ON data_mappings(file_type);
CREATE INDEX idx_data_mappings_target_table ON data_mappings(target_table);

-- Create triggers for updated_at columns
CREATE TRIGGER update_document_imports_updated_at 
    BEFORE UPDATE ON document_imports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_mappings_updated_at 
    BEFORE UPDATE ON data_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_templates_updated_at 
    BEFORE UPDATE ON processing_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE document_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view document_imports" ON document_imports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert document_imports" ON document_imports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update document_imports" ON document_imports FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view import_history" ON import_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert import_history" ON import_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view data_mappings" ON data_mappings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert data_mappings" ON data_mappings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update data_mappings" ON data_mappings FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view processing_templates" ON processing_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert processing_templates" ON processing_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update processing_templates" ON processing_templates FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow anon users read access for API testing
CREATE POLICY "Allow anon to view document_imports" ON document_imports FOR SELECT USING (true);
CREATE POLICY "Allow anon to view import_history" ON import_history FOR SELECT USING (true);
CREATE POLICY "Allow anon to view data_mappings" ON data_mappings FOR SELECT USING (true);
CREATE POLICY "Allow anon to view processing_templates" ON processing_templates FOR SELECT USING (true);

-- Enable Realtime
ALTER TABLE document_imports REPLICA IDENTITY FULL;
ALTER TABLE import_history REPLICA IDENTITY FULL;
ALTER TABLE data_mappings REPLICA IDENTITY FULL;
ALTER TABLE processing_templates REPLICA IDENTITY FULL;

-- Insert default data mappings for Excel files
INSERT INTO data_mappings (name, description, file_type, sheet_name, target_table, column_mappings) VALUES
('excel_stores', 'Map Excel Stores sheet to stores table', 'excel', 'Stores', 'stores', '{
  "store_number": "store_number",
  "address": "address", 
  "city": "city",
  "state": "state",
  "zip_code": "zip_code",
  "phone": "phone"
}'),
('excel_contacts', 'Map Excel Employees sheet to contacts table', 'excel', 'Employees', 'contacts', '{
  "name": "name",
  "phone": "phone",
  "email": "email", 
  "status": "status",
  "priority": "priority"
}'),
('excel_schedules', 'Map Excel Schedules sheet to store_schedules table', 'excel', 'Schedules', 'store_schedules', '{
  "store_number": "store_number",
  "date": "date",
  "employee_name": "employee_name",
  "shift_time": "shift_time",
  "role": "role"
}');

-- Insert default processing templates
INSERT INTO processing_templates (name, description, file_type, template_config, is_default) VALUES
('excel_pharmacy_data', 'Default template for pharmacy Excel files', 'excel', '{
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
}', true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres; 