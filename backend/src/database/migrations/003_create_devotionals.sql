-- Devotionals Table (core data)
CREATE TABLE IF NOT EXISTS devotionals (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(150) UNIQUE NOT NULL,
  author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL,
  theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL,
  publication_date DATE NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devotional content (multi-language support)
CREATE TABLE IF NOT EXISTS devotional_contents (
  id SERIAL PRIMARY KEY,
  devotional_id INTEGER NOT NULL REFERENCES devotionals(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  prayer TEXT NOT NULL,
  UNIQUE(devotional_id, language)
);

-- Biblical references (can be multiple per devotional)
CREATE TABLE IF NOT EXISTS biblical_references (
  id SERIAL PRIMARY KEY,
  devotional_id INTEGER NOT NULL REFERENCES devotionals(id) ON DELETE CASCADE,
  book VARCHAR(50) NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER,
  verse_end INTEGER,
  reference_text VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_devotionals_slug ON devotionals(slug);
CREATE INDEX IF NOT EXISTS idx_devotionals_publication_date ON devotionals(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_devotionals_author_id ON devotionals(author_id);
CREATE INDEX IF NOT EXISTS idx_devotionals_theme_id ON devotionals(theme_id);
CREATE INDEX IF NOT EXISTS idx_devotionals_is_published ON devotionals(is_published);
CREATE INDEX IF NOT EXISTS idx_devotionals_published_date ON devotionals(is_published, publication_date DESC);

CREATE INDEX IF NOT EXISTS idx_devotional_contents_lookup ON devotional_contents(devotional_id, language);
CREATE INDEX IF NOT EXISTS idx_biblical_references_devotional ON biblical_references(devotional_id);

-- Full-text search indexes (Portuguese and English)
CREATE INDEX IF NOT EXISTS idx_devotional_contents_search_pt
  ON devotional_contents USING gin(to_tsvector('portuguese', title || ' ' || content || ' ' || prayer))
  WHERE language = 'pt';

CREATE INDEX IF NOT EXISTS idx_devotional_contents_search_en
  ON devotional_contents USING gin(to_tsvector('english', title || ' ' || content || ' ' || prayer))
  WHERE language = 'en';

-- Add updated_at trigger
CREATE TRIGGER update_devotionals_updated_at BEFORE UPDATE ON devotionals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
