-- Pharmacy Scheduling System Database Schema
-- Clean, simplified schema for the new Node.js + PostgreSQL architecture

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS store_schedules CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table for authentication
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'employee')) DEFAULT 'employee',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    ai_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for SMS communication
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')) DEFAULT 'pending',
    capcom6_message_id TEXT,
    ai_generated BOOLEAN DEFAULT false,
    requires_acknowledgment BOOLEAN DEFAULT false,
    acknowledgment_code TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledgment_message_id UUID REFERENCES messages(id),
    metadata JSONB,
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
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_store_schedules_store_id ON store_schedules(store_id);
CREATE INDEX idx_store_schedules_date ON store_schedules(date);
CREATE INDEX idx_appointments_contact_id ON appointments(contact_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Function to update the updated_at timestamp
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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update contact message count
CREATE OR REPLACE FUNCTION update_contact_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE contacts SET total_messages = total_messages + 1 WHERE id = NEW.contact_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE contacts SET total_messages = total_messages - 1 WHERE id = OLD.contact_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for message count updates
CREATE TRIGGER update_message_count AFTER INSERT OR DELETE ON messages FOR EACH ROW EXECUTE FUNCTION update_contact_message_count();

-- Insert default admin user (password: admin123 - change in production!)
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@pharmacy.com', crypt('admin123', gen_salt('bf')), 'admin');

-- Insert sample store data
INSERT INTO stores (store_number, address, city, state, zip_code, phone, pharmacy_hours, store_hours) VALUES 
(1001, '123 Main St', 'Anytown', 'CA', '90210', '555-0101', '9:00 AM - 6:00 PM', '8:00 AM - 9:00 PM'),
(1002, '456 Oak Ave', 'Somewhere', 'CA', '90211', '555-0102', '9:00 AM - 6:00 PM', '8:00 AM - 9:00 PM');

-- Insert sample contacts
INSERT INTO contacts (name, phone, email, status, priority) VALUES 
('John Doe', '+15551234567', 'john.doe@pharmacy.com', 'active', 'high'),
('Jane Smith', '+15551234568', 'jane.smith@pharmacy.com', 'active', 'medium'),
('Bob Johnson', '+15551234569', 'bob.johnson@pharmacy.com', 'active', 'low');
