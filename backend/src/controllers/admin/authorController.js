const Author = require('../../models/Author');

/**
 * Get all authors (admin view with all data)
 */
async function getAll(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;

    // Get authors with all languages
    const { data: authors, error } = await require('../../config/database').supabase
      .from('authors')
      .select(`
        id,
        slug,
        created_at,
        updated_at,
        author_translations (language, name, bio)
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw new Error(error.message);

    // Add devotionals count
    const authorsWithCount = await Promise.all(
      authors.map(async (author) => {
        const count = await Author.countDevotionals(author.id);
        return { ...author, devotionals_count: count };
      })
    );

    res.json({ authors: authorsWithCount });
  } catch (error) {
    next(error);
  }
}

/**
 * Get author by ID
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const author = await Author.findById(parseInt(id));
    const devotionalsCount = await Author.countDevotionals(parseInt(id));

    res.json({
      author: {
        ...author,
        devotionals_count: devotionalsCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new author
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

    const author = await Author.create({ slug, translations });

    res.status(201).json({ author });
  } catch (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_SLUG',
          message: 'An author with this slug already exists',
          status: 409,
        },
      });
    }
    next(error);
  }
}

/**
 * Update author
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { slug, translations } = req.body;

    const author = await Author.update(parseInt(id), { slug, translations });

    res.json({ author });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete author
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    // Check if author has devotionals
    const count = await Author.countDevotionals(parseInt(id));
    if (count > 0) {
      return res.status(400).json({
        error: {
          code: 'AUTHOR_HAS_DEVOTIONALS',
          message: `Cannot delete author with ${count} devotional(s)`,
          status: 400,
        },
      });
    }

    await Author.delete(parseInt(id));

    res.json({ success: true, message: 'Author deleted successfully' });
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
