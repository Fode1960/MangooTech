-- Fix RLS policies for shops table to allow authenticated users to create shops

-- Enable RLS (déjà fait mais on le garde pour référence)
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to read all shops
CREATE POLICY "Allow authenticated users to read shops" ON shops
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 2: Allow authenticated users to create their own shops
CREATE POLICY "Allow authenticated users to create shops" ON shops
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow users to update their own shops
CREATE POLICY "Allow users to update their own shops" ON shops
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Allow users to delete their own shops (optionnel)
CREATE POLICY "Allow users to delete their own shops" ON shops
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant permissions to authenticated role
GRANT ALL ON shops TO authenticated;

-- Grant permissions to anon role (lecture seule)
GRANT SELECT ON shops TO anon;