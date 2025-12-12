const Devotional = require('../../models/Devotional');

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

module.exports = {
  getAll,
  getBySlug,
  getBySlugAndLanguage,
  getToday,
  getRandom,
};
