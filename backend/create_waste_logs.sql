-- Run this in the Supabase SQL Editor

-- 1. Create table if missing
CREATE TABLE IF NOT EXISTS waste_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ingredient_id UUID REFERENCES ingredients(id),
    amount NUMERIC,
    reason TEXT
);

-- 2. Grant permissions explicitly (Just in case)
GRANT ALL ON waste_logs TO anon, authenticated, service_role;

-- 3. Force Supabase API to refresh its schema cache
NOTIFY pgrst, 'reload schema';
