const Devotional = require('../../models/Devotional');
const { supabase } = require('../../config/database');

/**
 * Search devotionals (full-text search)
 */
async function search(req, res, next) {
  try {
    const { q, language = 'pt', page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'MISSING_QUERY',
          message: 'Search query is required',
          status: 400,
        },
      });
    }

    const result = await Devotional.search(
      q.trim(),
      language,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get API statistics
 */
async function getStats(req, res, next) {
  try {
    // Count total devotionals
    const { count: totalDevotionals } = await supabase
      .from('devotionals')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true);

    // Count total authors
    const { count: totalAuthors } = await supabase
      .from('authors')
      .select('id', { count: 'exact', head: true });

    // Count total themes
    const { count: totalThemes } = await supabase
      .from('themes')
      .select('id', { count: 'exact', head: true });

    // Get available languages (hardcoded for now)
    const languages = ['pt', 'en'];

    res.json({
      stats: {
        total_devotionals: totalDevotionals || 0,
        total_authors: totalAuthors || 0,
        total_themes: totalThemes || 0,
        languages,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  search,
  getStats,
};
