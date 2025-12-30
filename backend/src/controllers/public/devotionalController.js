const Devotional = require('../../models/Devotional');
const { translateBookName, stripHtml } = require('../../utils/bibleBookTranslations');

/**
 * Get all devotionals with filters
 */
async function getAll(req, res, next) {
  try {
    const {
      language = 'pt',
      author,
      theme,
      date,
      start_date,
      end_date,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {
      language,
      author,
      theme,
      isPublished: true, // Only published devotionals for public API
    };

    if (date) {
      filters.startDate = date;
      filters.endDate = date;
    } else {
      if (start_date) filters.startDate = start_date;
      if (end_date) filters.endDate = end_date;
    }

    const result = await Devotional.findAll(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get devotional by slug
 */
async function getBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const { language = 'pt' } = req.query;

    const devotional = await Devotional.findBySlug(slug, language);

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
 * Get devotional by slug and language (alternative endpoint)
 */
async function getBySlugAndLanguage(req, res, next) {
  try {
    const { slug, language } = req.params;

    const devotional = await Devotional.findBySlug(slug, language);

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
 * Get today's devotional
 */
async function getToday(req, res, next) {
  try {
    const { language = 'pt' } = req.query;

    const devotional = await Devotional.findToday(language);

    res.json({ devotional });
  } catch (error) {
    if (error.message === 'No devotional found for today') {
      return res.status(404).json({
        error: {
          code: 'NO_DEVOTIONAL_TODAY',
          message: 'No devotional found for today',
          status: 404,
        },
      });
    }
    next(error);
  }
}

/**
 * Get random devotional
 */
async function getRandom(req, res, next) {
  try {
    const { language = 'pt', theme } = req.query;

    const devotional = await Devotional.findRandom(language, theme);

    res.json({ devotional });
  } catch (error) {
    if (error.message === 'No devotionals found') {
      return res.status(404).json({
        error: {
          code: 'NO_DEVOTIONALS',
          message: 'No devotionals found',
          status: 404,
        },
      });
    }
    next(error);
  }
}

/**
 * Sync endpoint for GlowUp app
 * Returns devotionals formatted for GlowUp database structure
 */
async function sync(req, res, next) {
  try {
    const {
      format = 'glowup',
      language = 'pt',
      from_date,
      to_date,
      published_only = 'true',
      limit = 50,
    } = req.query;

    const { supabase } = require('../../config/database');

    // Build query
    let query = supabase
      .from('devotionals')
      .select(`
        id,
        slug,
        publish_date,
        day_number,
        estimated_duration_minutes,
        tags,
        is_published,
        theme_id,
        created_at,
        updated_at,
        devotional_contents (
          language,
          title,
          quote_author,
          quote_text,
          opening_inspiration,
          scripture_reference,
          teaching_content,
          reflection_questions,
          action_step,
          closing_prayer
        ),
        biblical_references (
          book,
          chapter,
          verse_start,
          verse_end,
          reference_text,
          sort_order
        )
      `)
      .order('publish_date', { ascending: false })
      .limit(parseInt(limit));

    // Filter by published status
    if (published_only === 'true') {
      query = query.eq('is_published', true);
    }

    // Filter by date range
    if (from_date) {
      query = query.gte('publish_date', from_date);
    }
    if (to_date) {
      query = query.lte('publish_date', to_date);
    }

    const { data: devotionals, error } = await query;

    if (error) throw error;

    // Format for GlowUp
    const formattedDevotionals = devotionals.map((dev) => {
      const content = dev.devotional_contents?.find(c => c.language === language) ||
                     dev.devotional_contents?.[0];

      // Get first biblical reference if exists
      const firstRef = dev.biblical_references?.[0];
      let scriptureReference = content?.scripture_reference;

      // If no scripture_reference in content, build from biblical_references
      if (!scriptureReference && firstRef) {
        const translatedBook = translateBookName(firstRef.book, language);
        scriptureReference = `${translatedBook} ${firstRef.chapter}:${firstRef.verse_start}${firstRef.verse_end ? `-${firstRef.verse_end}` : ''}`;
      }

      return {
        id: dev.id,
        theme_id: dev.theme_id,
        day_number: dev.day_number,
        title: content?.title || '',
        scripture_reference: scriptureReference,
        teaching_content: stripHtml(content?.teaching_content || ''),
        reflection_questions: (content?.reflection_questions || []).map(q => stripHtml(q)),
        closing_prayer: stripHtml(content?.closing_prayer || ''),
        opening_inspiration: content?.opening_inspiration ? stripHtml(content.opening_inspiration) : null,
        action_step: content?.action_step ? stripHtml(content.action_step) : null,
        estimated_duration_minutes: dev.estimated_duration_minutes,
        tags: dev.tags || [],
        publish_date: dev.publish_date,
        published: dev.is_published,
        quote_author: content?.quote_author || null,
        quote_text: content?.quote_text || null,
        created_at: dev.created_at,
        updated_at: dev.updated_at,
      };
    });

    res.json({
      success: true,
      format,
      language,
      count: formattedDevotionals.length,
      devotionals: formattedDevotionals,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getBySlug,
  getBySlugAndLanguage,
  getToday,
  getRandom,
  sync,
};
