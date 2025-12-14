-- Migration: Add GlowUp compatibility fields
-- Date: 2025-12-14
-- Description: Adds scripture_reference, opening_inspiration, and action_step to devotional_contents

-- Add new fields to devotional_contents table
ALTER TABLE devotional_contents
ADD COLUMN IF NOT EXISTS scripture_reference TEXT,
ADD COLUMN IF NOT EXISTS opening_inspiration TEXT,
ADD COLUMN IF NOT EXISTS action_step TEXT;

-- Add comment for documentation
COMMENT ON COLUMN devotional_contents.scripture_reference IS 'Formatted scripture reference (e.g., "Filipenses 4:6-7") for GlowUp app';
COMMENT ON COLUMN devotional_contents.opening_inspiration IS 'Inspiring opening phrase to capture attention';
COMMENT ON COLUMN devotional_contents.action_step IS 'Practical action step for daily application';
