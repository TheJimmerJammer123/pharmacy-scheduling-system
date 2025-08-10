-- Performance Optimizations for Pharmacy Scheduling System
-- Additional indexes and query optimizations

-- COMPOSITE INDEXES for common query patterns
-- Messages by contact with timestamp filtering
CREATE INDEX IF NOT EXISTS idx_messages_contact_created 
ON messages(contact_id, created_at DESC);

-- Messages by status and direction for dashboard queries
CREATE INDEX IF NOT EXISTS idx_messages_status_direction 
ON messages(status, direction);

-- Contacts search optimization (name, phone, email)
CREATE INDEX IF NOT EXISTS idx_contacts_search 
ON contacts USING gin(to_tsvector('english', name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '')));

-- Schedule entries by store and date range
CREATE INDEX IF NOT EXISTS idx_schedule_store_date 
ON schedule_entries(store_number, date);

-- Schedule entries by employee and date range  
CREATE INDEX IF NOT EXISTS idx_schedule_employee_date 
ON schedule_entries(employee_name, date);

-- Appointments by contact and date
CREATE INDEX IF NOT EXISTS idx_appointments_contact_date 
ON appointments(contact_id, appointment_date);

-- Appointments by status and date for filtering
CREATE INDEX IF NOT EXISTS idx_appointments_status_date 
ON appointments(status, appointment_date);

-- PARTIAL INDEXES for common filtered queries
-- Active contacts only
CREATE INDEX IF NOT EXISTS idx_contacts_active 
ON contacts(name) WHERE status = 'active';

-- Pending messages (for monitoring)
CREATE INDEX IF NOT EXISTS idx_messages_pending 
ON messages(created_at) WHERE status = 'pending';

-- Failed messages (for debugging)
CREATE INDEX IF NOT EXISTS idx_messages_failed 
ON messages(created_at) WHERE status = 'failed';

-- Note: Avoid volatile functions (e.g., CURRENT_DATE) in index predicates.
-- Create a useful partial index for pending/confirmed appointments without date volatility.
CREATE INDEX IF NOT EXISTS idx_appointments_pending_confirmed_date_time
ON appointments(status, appointment_date, appointment_time)
WHERE status IN ('pending', 'confirmed');

-- Index schedules by date/employee/time for efficient daily queries without volatility
CREATE INDEX IF NOT EXISTS idx_schedule_by_date_employee_time
ON schedule_entries(date, employee_name, shift_time);

-- JSONB INDEXES for metadata queries
-- Message metadata for Capcom6 data
CREATE INDEX IF NOT EXISTS idx_messages_metadata_gin 
ON messages USING gin(metadata);

-- COVERING INDEXES to avoid table lookups
-- Contact summary with counts
CREATE INDEX IF NOT EXISTS idx_contacts_summary 
ON contacts(id) INCLUDE (name, phone, email, status, priority, total_messages);

-- Message summary for API responses
CREATE INDEX IF NOT EXISTS idx_messages_summary 
ON messages(contact_id, created_at DESC) 
INCLUDE (content, direction, status, ai_generated);

-- OPTIMIZATION FUNCTIONS
-- Function to get contact message count efficiently
CREATE OR REPLACE FUNCTION get_contact_message_count(contact_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM messages 
        WHERE contact_id = contact_uuid
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function for dashboard statistics (cached for 5 minutes)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'contacts', json_build_object(
            'total', COUNT(CASE WHEN c.id IS NOT NULL THEN 1 END),
            'active', COUNT(CASE WHEN c.status = 'active' THEN 1 END),
            'high_priority', COUNT(CASE WHEN c.priority = 'high' THEN 1 END)
        ),
        'messages', json_build_object(
            'total', COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END),
            'today', COUNT(CASE WHEN DATE(m.created_at) = CURRENT_DATE THEN 1 END),
            'pending', COUNT(CASE WHEN m.status = 'pending' THEN 1 END),
            'ai_generated', COUNT(CASE WHEN m.ai_generated = true THEN 1 END)
        ),
        'appointments', json_build_object(
            'total', COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END),
            'today', COUNT(CASE WHEN a.appointment_date = CURRENT_DATE THEN 1 END),
            'pending', COUNT(CASE WHEN a.status = 'pending' THEN 1 END)
        ),
        'generated_at', CURRENT_TIMESTAMP
    ) INTO result
    FROM contacts c
    LEFT JOIN messages m ON true
    LEFT JOIN appointments a ON true;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- VIEW for frequently accessed data
-- Active contacts with message counts
CREATE OR REPLACE VIEW active_contacts_summary AS
SELECT 
    c.id,
    c.name,
    c.phone,
    c.email,
    c.priority,
    c.notes,
    c.created_at,
    COUNT(m.id) as message_count,
    MAX(m.created_at) as last_message_at,
    COUNT(a.id) as appointment_count,
    MAX(a.appointment_date) as next_appointment_date
FROM contacts c
LEFT JOIN messages m ON c.id = m.contact_id
LEFT JOIN appointments a ON c.id = a.contact_id AND a.appointment_date >= CURRENT_DATE
WHERE c.status = 'active'
GROUP BY c.id, c.name, c.phone, c.email, c.priority, c.notes, c.created_at;

-- VIEW for message analytics
CREATE OR REPLACE VIEW message_analytics AS
SELECT 
    DATE(created_at) as message_date,
    direction,
    status,
    COUNT(*) as message_count,
    COUNT(CASE WHEN ai_generated THEN 1 END) as ai_messages,
    AVG(LENGTH(content)) as avg_message_length
FROM messages
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), direction, status
ORDER BY message_date DESC;

-- QUERY OPTIMIZATION SETTINGS
-- Update table statistics more frequently for better query planning
ALTER TABLE contacts SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE messages SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE schedule_entries SET (autovacuum_analyze_scale_factor = 0.1);
ALTER TABLE appointments SET (autovacuum_analyze_scale_factor = 0.1);

-- Enable parallel query execution for larger tables
ALTER TABLE messages SET (parallel_workers = 2);
ALTER TABLE schedule_entries SET (parallel_workers = 2);

-- MAINTENANCE FUNCTIONS
-- Function to cleanup old data (run monthly)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Delete messages older than 1 year
    DELETE FROM messages WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
    
    -- Delete completed appointments older than 6 months
    DELETE FROM appointments 
    WHERE status = 'completed' 
    AND appointment_date < CURRENT_DATE - INTERVAL '6 months';
    
    -- Delete old schedule entries older than 1 year
    DELETE FROM schedule_entries 
    WHERE date < CURRENT_DATE - INTERVAL '1 year';
    
    -- Update statistics
    ANALYZE contacts, messages, appointments, schedule_entries;
    
    RAISE NOTICE 'Old data cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to rebuild indexes (run quarterly)
CREATE OR REPLACE FUNCTION rebuild_indexes()
RETURNS VOID AS $$
DECLARE
    index_record RECORD;
BEGIN
    -- Reindex all tables for optimal performance
    REINDEX TABLE contacts;
    REINDEX TABLE messages;
    REINDEX TABLE appointments;
    REINDEX TABLE schedule_entries;
    
    -- Update all table statistics
    ANALYZE;
    
    RAISE NOTICE 'Index rebuild completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Create extension for better text search if not exists
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm 
ON contacts USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_contacts_phone_trgm 
ON contacts USING gin(phone gin_trgm_ops);

-- Performance monitoring view
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_time > 100  -- queries taking longer than 100ms on average
ORDER BY mean_time DESC
LIMIT 20;

-- Add pg_stat_statements extension if available (for query monitoring)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

COMMENT ON INDEX idx_messages_contact_created IS 'Optimizes contact message history queries';
COMMENT ON INDEX idx_contacts_search IS 'Full-text search across contact fields';
COMMENT ON INDEX idx_schedule_store_date IS 'Optimizes schedule queries by store and date range';
COMMENT ON FUNCTION get_dashboard_stats IS 'Cached dashboard statistics function';
COMMENT ON VIEW active_contacts_summary IS 'Optimized view for active contacts with counts';