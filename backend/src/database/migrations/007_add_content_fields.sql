-- Migration 007: Add new fields to devotional_contents and rename existing fields
-- This migration aligns the API with the GlowUp app structure

-- Step 1: Rename existing columns
ALTER TABLE devotional_contents
  RENAME COLUMN content TO teaching_content;

ALTER TABLE devotional_contents
  RENAME COLUMN prayer TO closing_prayer;

-- Step 2: Add new fields for complete devotional structure
ALTER TABLE devotional_contents
  ADD COLUMN quote_author TEXT,
  ADD COLUMN quote_text TEXT,
  ADD COLUMN opening_inspiration TEXT,
  ADD COLUMN action_step TEXT,
  ADD COLUMN reflection_questions JSONB DEFAULT '[]'::jsonb;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN devotional_contents.quote_author IS 'Author of the daily quote/inspiration';
COMMENT ON COLUMN devotional_contents.quote_text IS 'Inspirational quote text';
COMMENT ON COLUMN devotional_contents.opening_inspiration IS 'Opening text to introduce the devotional';
COMMENT ON COLUMN devotional_contents.teaching_content IS 'Main devotional teaching content';
COMMENT ON COLUMN devotional_contents.reflection_questions IS 'Array of reflection questions (JSON)';
COMMENT ON COLUMN devotional_contents.action_step IS 'Practical action step for the reader';
COMMENT ON COLUMN devotional_contents.closing_prayer IS 'Closing prayer text';

-- Step 4: Update full-text search indexes with new field names
DROP INDEX IF EXISTS idx_devotional_contents_search_pt;
DROP INDEX IF EXISTS idx_devotional_contents_search_en;

CREATE INDEX idx_devotional_contents_search_pt
  ON devotional_contents USING gin(
    to_tsvector('portuguese',
      COALESCE(title, '') || ' ' ||
      COALESCE(quote_text, '') || ' ' ||
      COALESCE(opening_inspiration, '') || ' ' ||
      COALESCE(teaching_content, '') || ' ' ||
      COALESCE(action_step, '') || ' ' ||
      COALESCE(closing_prayer, '')
    )
  )
  WHERE language = 'pt';

CREATE INDEX idx_devotional_contents_search_en
  ON devotional_contents USING gin(
    to_tsvector('english',
      COALESCE(title, '') || ' ' ||
      COALESCE(quote_text, '') || ' ' ||
      COALESCE(opening_inspiration, '') || ' ' ||
      COALESCE(teaching_content, '') || ' ' ||
      COALESCE(action_step, '') || ' ' ||
      COALESCE(closing_prayer, '')
    )
  )
  WHERE language = 'en';
