-- Add is_external column to universities table to distinguish AI-curated vs user-added
ALTER TABLE universities ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false;

-- Update existing universities to be marked as curated (not external)
UPDATE universities SET is_external = false WHERE is_external IS NULL;
