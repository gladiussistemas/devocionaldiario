-- Additional composite indexes for performance optimization

-- Devotionals: commonly queried with multiple filters
CREATE INDEX IF NOT EXISTS idx_devotionals_author_published
  ON devotionals(author_id, is_published, publication_date DESC);

CREATE INDEX IF NOT EXISTS idx_devotionals_theme_published
  ON devotionals(theme_id, is_published, publication_date DESC);

-- For "today's devotional" queries
CREATE INDEX IF NOT EXISTS idx_devotionals_date_published
  ON devotionals(publication_date, is_published)
  WHERE is_published = true;

-- Devotional contents: for search and filtering
CREATE INDEX IF NOT EXISTS idx_devotional_contents_devotional_lang
  ON devotional_contents(devotional_id, language);

-- Biblical references: for sorting
CREATE INDEX IF NOT EXISTS idx_biblical_references_sort
  ON biblical_references(devotional_id, sort_order);

-- Author translations: for multilingual queries
CREATE INDEX IF NOT EXISTS idx_author_translations_language
  ON author_translations(language);

-- Theme translations: for multilingual queries
CREATE INDEX IF NOT EXISTS idx_theme_translations_language
  ON theme_translations(language);

-- API requests: for rate limiting and analytics
CREATE INDEX IF NOT EXISTS idx_api_requests_recent
  ON api_requests(ip_address, request_time DESC);

-- Sessions: for cleanup queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_active
  ON admin_sessions(user_id, expires_at);

-- Create a view for easy devotional retrieval with all data
CREATE OR REPLACE VIEW devotionals_full AS
SELECT
  d.id,
  d.slug,
  d.publication_date,
  d.is_published,
  d.created_at,
  d.updated_at,
  d.author_id,
  d.theme_id,
  -- Will need to join in queries for specific language
  a.slug as author_slug,
  t.slug as theme_slug
FROM devotionals d
LEFT JOIN authors a ON d.author_id = a.id
LEFT JOIN themes t ON d.theme_id = t.id;

-- Statistics view
CREATE OR REPLACE VIEW api_stats AS
SELECT
  DATE(request_time) as date,
  COUNT(*) as total_requests,
  COUNT(DISTINCT ip_address) as unique_visitors,
  COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as successful_requests,
  COUNT(*) FILTER (WHERE status_code >= 400) as error_requests
FROM api_requests
GROUP BY DATE(request_time)
ORDER BY date DESC;
