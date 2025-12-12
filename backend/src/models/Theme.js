const { supabase, handleResponse, paginate } = require('../config/database');

class Theme {
  /**
   * Get all themes with translations
   */
  static async findAll(language = 'pt', page = 1, limit = 50) {
    const query = supabase
      .from('themes')
      .select(`
        id,
        slug,
        created_at,
        updated_at,
        theme_translations!inner (
          language,
          name,
          description
        )
      `)
      .eq('theme_translations.language', language)
      .order('created_at', { ascending: false });

    const paginatedQuery = paginate(query, page, limit);
    const { data, error } = await paginatedQuery;

    return handleResponse({ data, error });
  }

  /**
   * Find theme by slug with translation
   */
  static async findBySlug(slug, language = 'pt') {
    const { data, error } = await supabase
      .from('themes')
      .select(`
        id,
        slug,
        created_at,
        updated_at,
        theme_translations!inner (
          language,
          name,
          description
        )
      `)
      .eq('slug', slug)
      .eq('theme_translations.language', language)
      .single();

    if (error || !data) {
      throw new Error('Theme not found');
    }

    // Flatten the structure
    return {
      id: data.id,
      slug: data.slug,
      name: data.theme_translations[0].name,
      description: data.theme_translations[0].description,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Find theme by ID (all languages)
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('themes')
      .select(`
        id,
        slug,
        created_at,
        updated_at,
        theme_translations (
          language,
          name,
          description
        )
      `)
      .eq('id', id)
      .single();

    return handleResponse({ data, error });
  }

  /**
   * Create new theme with translations
   */
  static async create(themeData) {
    const { slug, translations } = themeData;

    // Insert theme
    const { data: theme, error: themeError } = await supabase
      .from('themes')
      .insert({ slug })
      .select()
      .single();

    if (themeError) throw new Error(themeError.message);

    // Insert translations
    const translationsData = translations.map(t => ({
      theme_id: theme.id,
      language: t.language,
      name: t.name,
      description: t.description || null,
    }));

    const { error: transError } = await supabase
      .from('theme_translations')
      .insert(translationsData);

    if (transError) throw new Error(transError.message);

    return await this.findById(theme.id);
  }

  /**
   * Update theme
   */
  static async update(id, themeData) {
    const { slug, translations } = themeData;

    // Update theme if slug changed
    if (slug) {
      const { error: themeError } = await supabase
        .from('themes')
        .update({ slug, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (themeError) throw new Error(themeError.message);
    }

    // Update translations
    if (translations && translations.length > 0) {
      for (const trans of translations) {
        const { error: transError } = await supabase
          .from('theme_translations')
          .upsert({
            theme_id: id,
            language: trans.language,
            name: trans.name,
            description: trans.description || null,
          }, {
            onConflict: 'theme_id,language'
          });

        if (transError) throw new Error(transError.message);
      }
    }

    return await this.findById(id);
  }

  /**
   * Delete theme
   */
  static async delete(id) {
    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  /**
   * Count devotionals by theme
   */
  static async countDevotionals(themeId) {
    const { count, error } = await supabase
      .from('devotionals')
      .select('id', { count: 'exact', head: true })
      .eq('theme_id', themeId)
      .eq('is_published', true);

    if (error) throw new Error(error.message);
    return count;
  }
}

module.exports = Theme;
