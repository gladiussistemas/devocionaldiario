-- Themes/Categories Table
CREATE TABLE IF NOT EXISTS themes (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Theme translations
CREATE TABLE IF NOT EXISTS theme_translations (
  id SERIAL PRIMARY KEY,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  UNIQUE(theme_id, language)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_themes_slug ON themes(slug);
CREATE INDEX IF NOT EXISTS idx_theme_translations_lookup ON theme_translations(theme_id, language);

-- Add updated_at trigger
CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON themes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
