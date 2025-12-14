-- Migration 006: Add new fields to devotionals table and rename publication_date to publish_date
-- This migration aligns the API with the GlowUp app structure

-- Step 1: Rename publication_date to publish_date
ALTER TABLE devotionals
  RENAME COLUMN publication_date TO publish_date;

-- Step 2: Add new fields
ALTER TABLE devotionals
  ADD COLUMN day_number INTEGER,
  ADD COLUMN estimated_duration_minutes INTEGER DEFAULT 10,
  ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Step 3: Add comments for documentation
COMMENT ON COLUMN devotionals.day_number IS 'Day number within a theme/plan (e.g., Day 1 of 30)';
COMMENT ON COLUMN devotionals.estimated_duration_minutes IS 'Estimated reading time in minutes';
COMMENT ON COLUMN devotionals.tags IS 'Array of tags/keywords for categorization';
COMMENT ON COLUMN devotionals.publish_date IS 'Date when devotional should be published/displayed';

-- Step 4: Update existing indexes
DROP INDEX IF EXISTS idx_devotionals_publication_date;
DROP INDEX IF EXISTS idx_devotionals_published_date;

CREATE INDEX idx_devotionals_publish_date ON devotionals(publish_date DESC);
CREATE INDEX idx_devotionals_published_date ON devotionals(is_published, publish_date DESC);
CREATE INDEX idx_devotionals_tags ON devotionals USING gin(tags);
