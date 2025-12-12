const Theme = require('../../models/Theme');

/**
 * Get all themes
 */
async function getAll(req, res, next) {
  try {
    const { language = 'pt', page = 1, limit = 50 } = req.query;

    const themes = await Theme.findAll(
      language,
      parseInt(page),
      parseInt(limit)
    );

    // Flatten structure and add devotionals count for each theme
    const themesWithCount = await Promise.all(
      themes.map(async (theme) => {
        const count = await Theme.countDevotionals(theme.id);
        return {
          id: theme.id,
          slug: theme.slug,
          name: theme.theme_translations?.[0]?.name || '',
          description: theme.theme_translations?.[0]?.description || '',
          created_at: theme.created_at,
          updated_at: theme.updated_at,
          devotionals_count: count,
        };
      })
    );

    res.json({ themes: themesWithCount });
  } catch (error) {
    next(error);
  }
}

/**
 * Get theme by slug
 */
async function getBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const { language = 'pt' } = req.query;

    const theme = await Theme.findBySlug(slug, language);
    const devotionalsCount = await Theme.countDevotionals(theme.id);

    res.json({
      theme: {
        ...theme,
        devotionals_count: devotionalsCount,
      },
    });
  } catch (error) {
    if (error.message === 'Theme not found') {
      return res.status(404).json({
        error: {
          code: 'THEME_NOT_FOUND',
          message: 'Theme not found',
          status: 404,
        },
      });
    }
    next(error);
  }
}

module.exports = {
  getAll,
  getBySlug,
};
