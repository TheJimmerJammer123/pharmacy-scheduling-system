-- Create supavisor schema in _supabase database
\c _supabase
create schema if not exists _supavisor;
alter schema _supavisor owner to postgres;
\c postgres
