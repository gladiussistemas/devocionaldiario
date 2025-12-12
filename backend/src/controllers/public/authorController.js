const Author = require('../../models/Author');

/**
 * Get all authors
 */
async function getAll(req, res, next) {
  try {
    const { language = 'pt', page = 1, limit = 50 } = req.query;

    const authors = await Author.findAll(
      language,
      parseInt(page),
      parseInt(limit)
    );

    // Flatten structure and add devotionals count for each author
    const authorsWithCount = await Promise.all(
      authors.map(async (author) => {
        const count = await Author.countDevotionals(author.id);
        return {
          id: author.id,
          slug: author.slug,
          name: author.author_translations?.[0]?.name || '',
          bio: author.author_translations?.[0]?.bio || '',
          created_at: author.created_at,
          updated_at: author.updated_at,
          devotionals_count: count,
        };
      })
    );

    res.json({ authors: authorsWithCount });
  } catch (error) {
    next(error);
  }
}

/**
 * Get author by slug
 */
async function getBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const { language = 'pt' } = req.query;

    const author = await Author.findBySlug(slug, language);
    const devotionalsCount = await Author.countDevotionals(author.id);

    res.json({
      author: {
        ...author,
        devotionals_count: devotionalsCount,
      },
    });
  } catch (error) {
    if (error.message === 'Author not found') {
      return res.status(404).json({
        error: {
          code: 'AUTHOR_NOT_FOUND',
          message: 'Author not found',
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
