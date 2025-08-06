-- NOTE: change to your own passwords for production environments
\set pgpass `echo "$POSTGRES_PASSWORD"`

-- Create missing users that are referenced in other scripts
DO
$$
BEGIN
    -- Create supabase_admin if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
        CREATE USER supabase_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;
    
    -- Create supabase_auth_admin if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        CREATE USER supabase_auth_admin NOINHERIT LOGIN NOREPLICATION;
    END IF;
    
    -- Create supabase_storage_admin if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
        CREATE USER supabase_storage_admin NOINHERIT LOGIN NOREPLICATION;
    END IF;
    
    -- Create supabase_realtime if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime') THEN
        CREATE USER supabase_realtime NOINHERIT LOGIN NOREPLICATION;
    END IF;
    
    -- Create supabase_functions_admin if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_functions_admin') THEN
        CREATE USER supabase_functions_admin NOINHERIT LOGIN NOREPLICATION;
    END IF;
    
    -- Create authenticator if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE USER authenticator NOINHERIT LOGIN NOREPLICATION;
    END IF;
    
    -- Create pgbouncer if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pgbouncer') THEN
        CREATE USER pgbouncer NOINHERIT LOGIN NOREPLICATION;
    END IF;
END
$$;

-- Set passwords for all users
ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_functions_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_realtime WITH PASSWORD :'pgpass';
ALTER USER supabase_admin WITH PASSWORD :'pgpass';

-- Grant necessary permissions
GRANT supabase_admin TO authenticator;
GRANT supabase_admin TO supabase_auth_admin;
GRANT supabase_admin TO supabase_storage_admin;
GRANT supabase_admin TO supabase_realtime;
GRANT supabase_admin TO supabase_functions_admin;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, supabase_admin;
