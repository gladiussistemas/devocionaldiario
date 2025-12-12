const { supabase, handleResponse, paginate } = require('../config/database');

class Author {
  /**
   * Get all authors with translations
   */
  static async findAll(language = 'pt', page = 1, limit = 50) {
    const query = supabase
      .from('authors')
      .select(`
        id,
        slug,
        created_at,
        updated_at,
        author_translations!inner (
          language,
          name,
          bio
        )
      `)
      .eq('author_translations.language', language)
      .order('created_at', { ascending: false });

    const paginatedQuery = paginate(query, page, limit);
    const { data, error } = await paginatedQuery;

    return handleResponse({ data, error });
  }

  /**
   * Find author by slug with translation
   */
  static async findBySlug(slug, language = 'pt') {
    const { data, error } = await supabase
      .from('authors')
      .select(`
        id,
        slug,
        created_at,
        updated_at,
        author_translations!inner (
          language,
          name,
          bio
        )
      `)
      .eq('slug', slug)
      .eq('author_translations.language', language)
      .single();

    if (error || !data) {
      throw new Error('Author not found');
    }

    // Flatten the structure
    return {
      id: data.id,
      slug: data.slug,
      name: data.author_translations[0].name,
      bio: data.author_translations[0].bio,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Find author by ID (all languages)
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('authors')
      .select(`
        id,
        slug,
        created_at,
        updated_at,
        author_translations (
          language,
          name,
          bio
        )
      `)
      .eq('id', id)
      .single();

    return handleResponse({ data, error });
  }

  /**
   * Create new author with translations
   */
  static async create(authorData) {
    const { slug, translations } = authorData;

    // Insert author
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .insert({ slug })
      .select()
      .single();

    if (authorError) throw new Error(authorError.message);

    // Insert translations
    const translationsData = translations.map(t => ({
      author_id: author.id,
      language: t.language,
      name: t.name,
      bio: t.bio || null,
    }));

    const { error: transError } = await supabase
      .from('author_translations')
      .insert(translationsData);

    if (transError) throw new Error(transError.message);

    return await this.findById(author.id);
  }

  /**
   * Update author
   */
  static async update(id, authorData) {
    const { slug, translations } = authorData;

    // Update author if slug changed
    if (slug) {
      const { error: authorError } = await supabase
        .from('authors')
        .update({ slug, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (authorError) throw new Error(authorError.message);
    }

    // Update translations
    if (translations && translations.length > 0) {
      for (const trans of translations) {
        const { error: transError } = await supabase
          .from('author_translations')
          .upsert({
            author_id: id,
            language: trans.language,
            name: trans.name,
            bio: trans.bio || null,
          }, {
            onConflict: 'author_id,language'
          });

        if (transError) throw new Error(transError.message);
      }
    }

    return await this.findById(id);
  }

  /**
   * Delete author
   */
  static async delete(id) {
    const { error } = await supabase
      .from('authors')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  /**
   * Count devotionals by author
   */
  static async countDevotionals(authorId) {
    const { count, error } = await supabase
      .from('devotionals')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', authorId)
      .eq('is_published', true);

    if (error) throw new Error(error.message);
    return count;
  }
}

module.exports = Author;
