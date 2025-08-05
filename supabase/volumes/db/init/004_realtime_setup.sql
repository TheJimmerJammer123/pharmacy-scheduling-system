-- Create realtime database user
CREATE USER supabase_realtime WITH LOGIN CREATEDB CREATEROLE REPLICATION BYPASSRLS;
ALTER USER supabase_realtime PASSWORD 'pharm2024secure';

-- Create _realtime schema
CREATE SCHEMA IF NOT EXISTS _realtime;

-- Grant permissions to realtime user
GRANT ALL ON SCHEMA _realtime TO supabase_realtime;
GRANT ALL ON SCHEMA public TO supabase_realtime;
GRANT ALL ON SCHEMA storage TO supabase_realtime;

-- Grant usage on existing schemas
GRANT USAGE ON SCHEMA _realtime TO supabase_realtime;
GRANT USAGE ON SCHEMA public TO supabase_realtime;

-- Create required realtime tables (based on official Supabase realtime schema)
CREATE TABLE IF NOT EXISTS _realtime.tenants (
    id bigserial PRIMARY KEY,
    name text NOT NULL,
    external_id text NOT NULL UNIQUE,
    jwt_secret text NOT NULL,
    max_concurrent_users integer DEFAULT 200,
    max_events_per_second integer DEFAULT 100,
    max_bytes_per_second integer DEFAULT 100000,
    max_channels_per_client integer DEFAULT 100,
    max_joins_per_second integer DEFAULT 100,
    inserted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS _realtime.extensions (
    id bigserial PRIMARY KEY,
    tenant_external_id text NOT NULL REFERENCES _realtime.tenants(external_id) ON DELETE CASCADE,
    type text NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    inserted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create realtime.messages table for broadcast functionality
CREATE SCHEMA IF NOT EXISTS realtime;
GRANT USAGE ON SCHEMA realtime TO authenticated, anon, service_role;

CREATE TABLE IF NOT EXISTS realtime.messages (
    id bigserial PRIMARY KEY,
    topic text NOT NULL,
    event text,
    payload jsonb,
    private boolean DEFAULT false,
    inserted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Grant permissions on realtime schema
GRANT ALL ON SCHEMA realtime TO supabase_realtime;
GRANT ALL ON TABLE realtime.messages TO supabase_realtime;
GRANT SELECT, INSERT ON TABLE realtime.messages TO authenticated, anon, service_role;

-- Create broadcast function
CREATE OR REPLACE FUNCTION realtime.topic()
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT current_setting('realtime.topic'::text, true);
$$;

-- Grant execute permission on realtime functions
GRANT EXECUTE ON FUNCTION realtime.topic() TO authenticated, anon, service_role;

-- Insert default tenant for self-hosted setup
INSERT INTO _realtime.tenants (name, external_id, jwt_secret) 
VALUES ('pharmacy-scheduling', 'pharmacy-scheduling', 'fMvZdFHAkEW6HoWkKfj8IukvHEcn53344UcCMgLyD3o=')
ON CONFLICT (external_id) DO NOTHING;

-- Insert default extension
INSERT INTO _realtime.extensions (tenant_external_id, type, settings)
VALUES ('pharmacy-scheduling', 'postgres_cdc_rls', jsonb_build_object(
    'db_name', 'postgres',
    'db_host', 'db',
    'db_user', 'supabase_realtime',
    'db_password', 'pharm2024secure',
    'db_port', '5432',
    'region', 'local',
    'poll_interval_ms', 100,
    'poll_max_record_bytes', 1048576
))
ON CONFLICT DO NOTHING;

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS public.stores;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS public.schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS public.document_imports;

-- Grant subscription permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO supabase_realtime;
GRANT SELECT ON ALL TABLES IN SCHEMA storage TO supabase_realtime;