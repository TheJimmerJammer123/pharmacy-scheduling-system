-- Create _supabase database for internal operations
-- Using postgres as the owner since that's the default superuser
CREATE DATABASE _supabase WITH OWNER postgres;

-- Create auth schema and grant permissions
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;

-- Create storage schema and grant permissions
CREATE SCHEMA IF NOT EXISTS storage;
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;

-- Create realtime schema and grant permissions
CREATE SCHEMA IF NOT EXISTS _realtime;
GRANT USAGE ON SCHEMA _realtime TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA _realtime TO supabase_realtime;

-- Create functions schema and grant permissions
CREATE SCHEMA IF NOT EXISTS _supabase_functions;
GRANT USAGE ON SCHEMA _supabase_functions TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA _supabase_functions TO supabase_functions_admin;

-- Grant function creation permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON FUNCTIONS TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA _realtime GRANT ALL ON FUNCTIONS TO supabase_realtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON FUNCTIONS TO supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA _supabase_functions GRANT ALL ON FUNCTIONS TO supabase_functions_admin;

-- Grant table creation permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA _realtime GRANT ALL ON TABLES TO supabase_realtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON TABLES TO supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA _supabase_functions GRANT ALL ON TABLES TO supabase_functions_admin;
