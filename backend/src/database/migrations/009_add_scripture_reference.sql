-- Migration 009: Add scripture_reference field to devotional_contents
-- This field stores the formatted biblical reference (e.g., "Filipenses 4:6-7")
-- It can be used as an alternative to concatenating from biblical_references table

-- Add scripture_reference column
ALTER TABLE devotional_contents
  ADD COLUMN IF NOT EXISTS scripture_reference TEXT;

-- Add comment for documentation
COMMENT ON COLUMN devotional_contents.scripture_reference IS 'Formatted biblical reference text (e.g., "Filipenses 4:6-7")';

-- Optional: Update existing records to populate scripture_reference from first biblical_reference
-- This is commented out by default - uncomment if you want to migrate existing data
/*
UPDATE devotional_contents dc
SET scripture_reference = (
  SELECT
    br.book || ' ' || br.chapter || ':' || br.verse_start ||
    CASE
      WHEN br.verse_end IS NOT NULL THEN '-' || br.verse_end
      ELSE ''
    END
  FROM biblical_references br
  WHERE br.devotional_id = dc.devotional_id
  ORDER BY br.sort_order ASC
  LIMIT 1
)
WHERE dc.scripture_reference IS NULL;
*/
