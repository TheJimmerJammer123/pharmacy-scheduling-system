-- Create exec_sql function for AI chatbot to execute dynamic queries
-- This allows the AI to run SQL queries dynamically while maintaining security

CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
    result json;
    query_lower text;
BEGIN
    -- Convert query to lowercase for security checks
    query_lower := lower(trim(query));
    
    -- Security: Only allow SELECT statements
    IF NOT query_lower LIKE 'select%' THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed';
    END IF;
    
    -- Security: Prevent dangerous operations
    IF query_lower LIKE '%drop%' OR 
       query_lower LIKE '%delete%' OR 
       query_lower LIKE '%update%' OR 
       query_lower LIKE '%insert%' OR 
       query_lower LIKE '%alter%' OR 
       query_lower LIKE '%create%' OR 
       query_lower LIKE '%truncate%' THEN
        RAISE EXCEPTION 'Dangerous operations are not allowed';
    END IF;
    
    -- Execute the query and return as JSON
    EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', query) INTO result;
    
    -- If result is null, return empty array
    IF result IS NULL THEN
        result := '[]'::json;
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error as JSON structure
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'code', SQLSTATE
        );
END;
$$;

-- Grant execute permission to authenticated and service_role users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.exec_sql(text) IS 'Executes SELECT queries dynamically for AI chatbot. Security: Only SELECT statements allowed, dangerous operations blocked.';