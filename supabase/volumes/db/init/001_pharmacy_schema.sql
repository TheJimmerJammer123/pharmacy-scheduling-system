-- Pharmacy Scheduling System Database Schema
-- This file creates the database schema for the pharmacy scheduling and SMS communication system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS store_schedules CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Stores table for pharmacy locations
CREATE TABLE stores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_number INTEGER UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    phone TEXT NOT NULL,
    pharmacy_hours TEXT,
    store_hours TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table for employees
CREATE TABLE contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    notes TEXT,
    total_messages INTEGER DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    ai_enabled BOOLEAN DEFAULT true, -- Controls AI chatbot for this contact
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for SMS communication (updated for Capcom6)
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')) DEFAULT 'pending',
    capcom6_message_id TEXT, -- Capcom6 specific message ID
    ai_generated BOOLEAN DEFAULT false,
    requires_acknowledgment BOOLEAN DEFAULT false,
    acknowledgment_code TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledgment_message_id UUID REFERENCES messages(id),
    metadata JSONB, -- Store additional Capcom6 metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store schedules table for employee scheduling
CREATE TABLE store_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    store_number INTEGER NOT NULL,
    date DATE NOT NULL,
    employee_name TEXT NOT NULL,
    employee_id TEXT,
    role TEXT,
    employee_type TEXT,
    shift_time TEXT NOT NULL,
    scheduled_hours DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
    location TEXT,
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_store_schedules_store_id ON store_schedules(store_id);
CREATE INDEX idx_store_schedules_date ON store_schedules(date);
CREATE INDEX idx_appointments_contact_id ON appointments(contact_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_schedules_updated_at BEFORE UPDATE ON store_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update contact message count
CREATE OR REPLACE FUNCTION update_contact_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE contacts 
        SET total_messages = total_messages + 1 
        WHERE id = NEW.contact_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE contacts 
        SET total_messages = total_messages - 1 
        WHERE id = OLD.contact_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for message count
CREATE TRIGGER update_message_count AFTER INSERT OR DELETE ON messages FOR EACH ROW EXECUTE FUNCTION update_contact_message_count();

-- Enable Row Level Security (RLS) for security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for authenticated users - customize as needed)
-- Allow authenticated users policies
CREATE POLICY "Allow authenticated users to view stores" ON stores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert stores" ON stores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update stores" ON stores FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete stores" ON stores FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view contacts" ON contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert contacts" ON contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update contacts" ON contacts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete contacts" ON contacts FOR DELETE USING (auth.role() = 'authenticated');

-- Allow anon users read access for API testing and frontend
CREATE POLICY "Allow anon to view stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Allow anon to view contacts" ON contacts FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to view messages" ON messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert messages" ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update messages" ON messages FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete messages" ON messages FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view store_schedules" ON store_schedules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert store_schedules" ON store_schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update store_schedules" ON store_schedules FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete store_schedules" ON store_schedules FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view appointments" ON appointments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert appointments" ON appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update appointments" ON appointments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete appointments" ON appointments FOR DELETE USING (auth.role() = 'authenticated');

-- Enable Realtime for all tables
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE contacts REPLICA IDENTITY FULL;  
ALTER TABLE stores REPLICA IDENTITY FULL;
ALTER TABLE store_schedules REPLICA IDENTITY FULL;
ALTER TABLE appointments REPLICA IDENTITY FULL;

-- Create Realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE messages, contacts, stores, store_schedules, appointments;

-- Insert sample data for testing
INSERT INTO stores (store_number, address, city, state, zip_code, phone) VALUES
(1001, '123 Main St', 'Springfield', 'IL', '62701', '217-555-0101'),
(1002, '456 Oak Ave', 'Springfield', 'IL', '62702', '217-555-0102'),
(1003, '789 Elm Blvd', 'Decatur', 'IL', '62521', '217-555-0103');

INSERT INTO contacts (name, phone, email, priority) VALUES
('John Smith', '+1234567890', 'john.smith@pharmacy.com', 'high'),
('Jane Doe', '+1234567891', 'jane.doe@pharmacy.com', 'medium'),
('Mike Johnson', '+1234567892', 'mike.johnson@pharmacy.com', 'low'),
('Sarah Wilson', '+1234567893', 'sarah.wilson@pharmacy.com', 'medium');

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Create Realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE messages, contacts, stores, store_schedules, appointments;