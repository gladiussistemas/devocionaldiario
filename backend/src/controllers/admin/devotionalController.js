const Devotional = require('../../models/Devotional');
const translationService = require('../../services/translationService');

/**
 * Get all devotionals (including drafts)
 */
async function getAll(req, res, next) {
  try {
    const {
      language = 'pt',
      author,
      theme,
      status, // 'published' or 'draft'
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {
      language,
      author,
      theme,
    };

    // Admin can see drafts too
    if (status === 'draft') {
      filters.isPublished = false;
    } else if (status === 'published') {
      filters.isPublished = true;
    }
    // If no status filter, show all

    const result = await Devotional.findAll(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    // Flatten structure for frontend
    const flattenedDevotionals = result.devotionals.map(dev => ({
      id: dev.id,
      slug: dev.slug,
      publish_date: dev.publish_date,
      day_number: dev.day_number,
      estimated_duration_minutes: dev.estimated_duration_minutes,
      tags: dev.tags || [],
      is_published: dev.is_published,
      created_at: dev.created_at,
      updated_at: dev.updated_at,
      title: dev.devotional_contents?.[0]?.title || '',
      author: {
        id: dev.authors?.id,
        slug: dev.authors?.slug,
        name: dev.authors?.author_translations?.[0]?.name || '',
      },
      theme: {
        id: dev.themes?.id,
        slug: dev.themes?.slug,
        name: dev.themes?.theme_translations?.[0]?.name || '',
      },
    }));

    res.json({
      ...result,
      devotionals: flattenedDevotionals,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get devotional by ID (for editing)
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    // Get devotional with all languages
    const { data: devotional, error } = await require('../../config/database').supabase
      .from('devotionals')
      .select(`
        *,
        authors (
          id,
          slug,
          author_translations (language, name, bio)
        ),
        themes (
          id,
          slug,
          theme_translations (language, name, description)
        ),
        devotional_contents (language, title, content, prayer),
        biblical_references (id, book, chapter, verse_start, verse_end, reference_text, sort_order)
      `)
      .eq('id', id)
      .single();

    if (error || !devotional) {
      return res.status(404).json({
        error: {
          code: 'DEVOTIONAL_NOT_FOUND',
          message: 'Devotional not found',
          status: 404,
        },
      });
    }

    res.json({ devotional });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new devotional
 */
async function create(req, res, next) {
  try {
    const devotionalData = req.body;
    console.log('📝 Criando devocional:', JSON.stringify(devotionalData, null, 2));

    // Validate required fields
    if (!devotionalData.slug || !devotionalData.publish_date) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Slug and publish_date are required',
          status: 400,
        },
      });
    }

    if (!devotionalData.contents || devotionalData.contents.length === 0) {
      return res.status(400).json({
        error: {
          code: 'MISSING_CONTENT',
          message: 'At least one language content is required',
          status: 400,
        },
      });
    }

    const devotional = await Devotional.create(devotionalData);

    res.status(201).json({ devotional });
  } catch (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_SLUG',
          message: 'A devotional with this slug already exists',
          status: 409,
        },
      });
    }
    next(error);
  }
}

/**
 * Update devotional
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const devotionalData = req.body;

    const devotional = await Devotional.update(parseInt(id), devotionalData);

    res.json({ devotional });
  } catch (error) {
    if (error.message === 'Devotional not found') {
      return res.status(404).json({
        error: {
          code: 'DEVOTIONAL_NOT_FOUND',
          message: 'Devotional not found',
          status: 404,
        },
      });
    }
    next(error);
  }
}

/**
 * Delete devotional
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    await Devotional.delete(parseInt(id));

    res.json({ success: true, message: 'Devotional deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Publish/unpublish devotional
 */
async function togglePublish(req, res, next) {
  try {
    const { id } = req.params;
    const { is_published } = req.body;

    // Direct update without calling the full update method
    const { error } = await require('../../config/database').supabase
      .from('devotionals')
      .update({
        is_published,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id));

    if (error) throw new Error(error.message);

    res.json({
      success: true,
      message: `Devotional ${is_published ? 'published' : 'unpublished'} successfully`,
      is_published
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Translate devotional content from PT to EN
 */
async function translate(req, res, next) {
  try {
    const { content, biblical_references } = req.body;

    // Check if translation service is available
    if (!translationService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Translation service not available. Please configure DEEPL_API_KEY in environment variables.',
        },
      });
    }

    // Translate the devotional
    const translated = await translationService.translateDevotional({
      content,
      biblical_references: biblical_references || [],
    });

    res.json({
      success: true,
      data: translated,
    });
  } catch (error) {
    console.error('Translation error:', error);
    next(error);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  togglePublish,
  translate,
};
