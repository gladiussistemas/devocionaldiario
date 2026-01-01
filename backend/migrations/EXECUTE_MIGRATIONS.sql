-- ============================================
-- MIGRATIONS - Integração GlowUp App
-- Execute este arquivo completo no SQL Editor do Supabase
-- Data: 13 de dezembro de 2025
-- ============================================

-- ============================================
-- MIGRATION 006: Add fields to devotionals
-- ============================================

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

-- ============================================
-- MIGRATION 007: Add fields to devotional_contents
-- ============================================

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

-- ============================================
-- MIGRATION 008: Add scripture_text to biblical_references
-- ============================================

-- Step 1: Add scripture_text field (JSONB for multi-version support)
ALTER TABLE biblical_references
  ADD COLUMN scripture_text JSONB DEFAULT '{}'::jsonb;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN biblical_references.scripture_text IS 'Full Bible passage text (JSONB format, can store multiple versions/translations)';

-- Example structure:
-- {
--   "pt": "O Senhor é o meu pastor...",
--   "en": "The Lord is my shepherd...",
--   "versions": {
--     "nvi": "...",
--     "acf": "..."
--   }
-- }

-- ============================================
-- MIGRATIONS COMPLETED SUCCESSFULLY! ✅
-- ============================================
