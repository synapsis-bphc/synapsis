-- Drop the existing created_at column if it exists
ALTER TABLE members DROP COLUMN IF EXISTS created_at;

-- Add the created_at column with proper timestamp and default
ALTER TABLE members ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;