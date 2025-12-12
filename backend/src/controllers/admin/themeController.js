const Theme = require('../../models/Theme');

/**
 * Get all themes (admin view with all data)
 */
async function getAll(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;

    // Get themes with all languages
    const { data: themes, error } = await require('../../config/database').supabase
      .from('themes')
      .select(`
        id,
        slug,
        created_at,
        updated_at,
        theme_translations (language, name, description)
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw new Error(error.message);

    // Add devotionals count
    const themesWithCount = await Promise.all(
      themes.map(async (theme) => {
        const count = await Theme.countDevotionals(theme.id);
        return { ...theme, devotionals_count: count };
      })
    );

    res.json({ themes: themesWithCount });
  } catch (error) {
    next(error);
  }
}

/**
 * Get theme by ID
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const theme = await Theme.findById(parseInt(id));
    const devotionalsCount = await Theme.countDevotionals(parseInt(id));

    res.json({
      theme: {
        ...theme,
        devotionals_count: devotionalsCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new theme
 */
async function create(req, res, next) {
  try {
    const { slug, translations } = req.body;

    if (!slug || !translations || translations.length === 0) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Slug and translations are required',
          status: 400,
        },
      });
    }

    const theme = await Theme.create({ slug, translations });

    res.status(201).json({ theme });
  } catch (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_SLUG',
          message: 'A theme with this slug already exists',
          status: 409,
        },
      });
    }
    next(error);
  }
}

/**
 * Update theme
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { slug, translations } = req.body;

    const theme = await Theme.update(parseInt(id), { slug, translations });

    res.json({ theme });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete theme
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    // Check if theme has devotionals
    const count = await Theme.countDevotionals(parseInt(id));
    if (count > 0) {
      return res.status(400).json({
        error: {
          code: 'THEME_HAS_DEVOTIONALS',
          message: `Cannot delete theme with ${count} devotional(s)`,
          status: 400,
        },
      });
    }

    await Theme.delete(parseInt(id));

    res.json({ success: true, message: 'Theme deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
