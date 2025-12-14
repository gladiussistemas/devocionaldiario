-- Migration 008: Add scripture_text field to biblical_references
-- This allows storing the full Bible passage text

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
