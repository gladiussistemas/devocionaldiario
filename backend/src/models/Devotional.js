const { supabase, handleResponse, paginate } = require('../config/database');

class Devotional {
  /**
   * Get all devotionals with filters
   */
  static async findAll(filters = {}, page = 1, limit = 10) {
    const {
      language = 'pt',
      author,
      theme,
      startDate,
      endDate,
      isPublished = true,
    } = filters;

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
        created_at,
        updated_at,
        authors (
          id,
          slug,
          author_translations!inner (
            name
          )
        ),
        themes (
          id,
          slug,
          theme_translations!inner (
            name
          )
        ),
        devotional_contents!inner (
          language,
          title
        )
      `)
      .eq('devotional_contents.language', language);

    if (isPublished !== undefined) {
      query = query.eq('is_published', isPublished);
    }

    if (author) {
      query = query.eq('authors.slug', author);
    }

    if (theme) {
      query = query.eq('themes.slug', theme);
    }

    if (startDate) {
      query = query.gte('publish_date', startDate);
    }

    if (endDate) {
      query = query.lte('publish_date', endDate);
    }

    query = query.order('publish_date', { ascending: false });

    const paginatedQuery = paginate(query, page, limit);
    const { data, error, count } = await paginatedQuery;

    if (error) throw new Error(error.message);

    return {
      devotionals: data,
      total: count,
      page,
      limit,
    };
  }

  /**
   * Find devotional by slug with full details
   */
  static async findBySlug(slug, language = 'pt') {
    const { data, error } = await supabase
      .from('devotionals')
      .select(`
        id,
        slug,
        publish_date,
        day_number,
        estimated_duration_minutes,
        tags,
        is_published,
        created_at,
        updated_at,
        authors (
          id,
          slug,
          author_translations!inner (
            name,
            bio
          )
        ),
        themes (
          id,
          slug,
          theme_translations!inner (
            name,
            description
          )
        ),
        devotional_contents!inner (
          language,
          title,
          quote_author,
          quote_text,
          opening_inspiration,
          teaching_content,
          reflection_questions,
          action_step,
          closing_prayer
        ),
        biblical_references (
          id,
          book,
          chapter,
          verse_start,
          verse_end,
          reference_text,
          scripture_text,
          sort_order
        )
      `)
      .eq('slug', slug)
      .eq('devotional_contents.language', language)
      .eq('authors.author_translations.language', language)
      .eq('themes.theme_translations.language', language)
      .single();

    if (error || !data) {
      throw new Error('Devotional not found');
    }

    // Format response
    return this._formatDevotional(data);
  }

  /**
   * Get today's devotional
   */
  static async findToday(language = 'pt') {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('devotionals')
      .select(`
        id,
        slug,
        publish_date,
        day_number,
        estimated_duration_minutes,
        tags,
        is_published,
        created_at,
        updated_at,
        authors (
          id,
          slug,
          author_translations!inner (
            name,
            bio
          )
        ),
        themes (
          id,
          slug,
          theme_translations!inner (
            name,
            description
          )
        ),
        devotional_contents!inner (
          language,
          title,
          quote_author,
          quote_text,
          opening_inspiration,
          teaching_content,
          reflection_questions,
          action_step,
          closing_prayer
        ),
        biblical_references (
          id,
          book,
          chapter,
          verse_start,
          verse_end,
          reference_text,
          scripture_text,
          sort_order
        )
      `)
      .eq('publish_date', today)
      .eq('is_published', true)
      .eq('devotional_contents.language', language)
      .eq('authors.author_translations.language', language)
      .eq('themes.theme_translations.language', language)
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error('No devotional found for today');
    }

    return this._formatDevotional(data);
  }

  /**
   * Get random devotional
   */
  static async findRandom(language = 'pt', themeSlug = null) {
    // First, get count of published devotionals
    let countQuery = supabase
      .from('devotionals')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true);

    if (themeSlug) {
      countQuery = countQuery.eq('themes.slug', themeSlug);
    }

    const { count } = await countQuery;

    if (!count || count === 0) {
      throw new Error('No devotionals found');
    }

    // Get a random offset
    const randomOffset = Math.floor(Math.random() * count);

    // Fetch the devotional
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
        created_at,
        updated_at,
        authors (
          id,
          slug,
          author_translations!inner (
            name,
            bio
          )
        ),
        themes (
          id,
          slug,
          theme_translations!inner (
            name,
            description
          )
        ),
        devotional_contents!inner (
          language,
          title,
          quote_author,
          quote_text,
          opening_inspiration,
          teaching_content,
          reflection_questions,
          action_step,
          closing_prayer
        ),
        biblical_references (
          id,
          book,
          chapter,
          verse_start,
          verse_end,
          reference_text,
          scripture_text,
          sort_order
        )
      `)
      .eq('is_published', true)
      .eq('devotional_contents.language', language)
      .eq('authors.author_translations.language', language)
      .eq('themes.theme_translations.language', language)
      .range(randomOffset, randomOffset)
      .limit(1)
      .single();

    const { data, error } = await query;

    if (error || !data) {
      throw new Error('Devotional not found');
    }

    return this._formatDevotional(data);
  }

  /**
   * Create new devotional
   */
  static async create(devotionalData) {
    const {
      slug,
      author_id,
      theme_id,
      publish_date,
      day_number,
      estimated_duration_minutes = 10,
      tags = [],
      is_published = false,
      contents,
      biblical_references = [],
    } = devotionalData;

    // Insert devotional
    const { data: devotional, error: devError } = await supabase
      .from('devotionals')
      .insert({
        slug,
        author_id,
        theme_id,
        publish_date,
        day_number,
        estimated_duration_minutes,
        tags,
        is_published,
      })
      .select()
      .single();

    if (devError) throw new Error(devError.message);

    // Insert contents for each language
    const contentsData = contents.map(c => ({
      devotional_id: devotional.id,
      language: c.language,
      title: c.title,
      quote_author: c.quote_author || null,
      quote_text: c.quote_text || null,
      opening_inspiration: c.opening_inspiration || null,
      teaching_content: c.teaching_content,
      reflection_questions: c.reflection_questions || [],
      action_step: c.action_step || null,
      closing_prayer: c.closing_prayer,
    }));

    const { error: contError } = await supabase
      .from('devotional_contents')
      .insert(contentsData);

    if (contError) throw new Error(contError.message);

    // Insert biblical references
    if (biblical_references.length > 0) {
      const refsData = biblical_references.map((ref, index) => ({
        devotional_id: devotional.id,
        book: ref.book,
        chapter: ref.chapter,
        verse_start: ref.verse_start || null,
        verse_end: ref.verse_end || null,
        reference_text: ref.reference_text,
        scripture_text: ref.scripture_text || {},
        sort_order: ref.sort_order || index,
      }));

      const { error: refError } = await supabase
        .from('biblical_references')
        .insert(refsData);

      if (refError) throw new Error(refError.message);
    }

    return await this.findBySlug(devotional.slug);
  }

  /**
   * Update devotional
   */
  static async update(id, devotionalData) {
    const {
      slug,
      author_id,
      theme_id,
      publish_date,
      day_number,
      estimated_duration_minutes,
      tags,
      is_published,
      contents,
      biblical_references,
    } = devotionalData;

    // Update main devotional data
    const updateData = {};
    if (slug !== undefined) updateData.slug = slug;
    if (author_id !== undefined) updateData.author_id = author_id;
    if (theme_id !== undefined) updateData.theme_id = theme_id;
    if (publish_date !== undefined) updateData.publish_date = publish_date;
    if (day_number !== undefined) updateData.day_number = day_number;
    if (estimated_duration_minutes !== undefined) updateData.estimated_duration_minutes = estimated_duration_minutes;
    if (tags !== undefined) updateData.tags = tags;
    if (is_published !== undefined) updateData.is_published = is_published;
    updateData.updated_at = new Date().toISOString();

    const { error: devError } = await supabase
      .from('devotionals')
      .update(updateData)
      .eq('id', id);

    if (devError) throw new Error(devError.message);

    // Update contents
    if (contents && contents.length > 0) {
      for (const content of contents) {
        const { error: contError } = await supabase
          .from('devotional_contents')
          .upsert({
            devotional_id: id,
            language: content.language,
            title: content.title,
            quote_author: content.quote_author || null,
            quote_text: content.quote_text || null,
            opening_inspiration: content.opening_inspiration || null,
            teaching_content: content.teaching_content,
            reflection_questions: content.reflection_questions || [],
            action_step: content.action_step || null,
            closing_prayer: content.closing_prayer,
          }, {
            onConflict: 'devotional_id,language'
          });

        if (contError) throw new Error(contError.message);
      }
    }

    // Update biblical references (delete and recreate)
    if (biblical_references !== undefined) {
      // Delete existing references
      await supabase
        .from('biblical_references')
        .delete()
        .eq('devotional_id', id);

      // Insert new references
      if (biblical_references.length > 0) {
        const refsData = biblical_references.map((ref, index) => ({
          devotional_id: id,
          book: ref.book,
          chapter: ref.chapter,
          verse_start: ref.verse_start || null,
          verse_end: ref.verse_end || null,
          reference_text: ref.reference_text,
          scripture_text: ref.scripture_text || {},
          sort_order: ref.sort_order || index,
        }));

        const { error: refError } = await supabase
          .from('biblical_references')
          .insert(refsData);

        if (refError) throw new Error(refError.message);
      }
    }

    // Fetch and return updated devotional
    const { data } = await supabase
      .from('devotionals')
      .select('slug')
      .eq('id', id)
      .single();

    return await this.findBySlug(data.slug);
  }

  /**
   * Delete devotional
   */
  static async delete(id) {
    const { error } = await supabase
      .from('devotionals')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  /**
   * Search devotionals (full-text search)
   */
  static async search(query, language = 'pt', page = 1, limit = 10) {
    // Note: Supabase textSearch requires the column to have a text search index
    const { data, error, count } = await supabase
      .from('devotional_contents')
      .select(`
        devotional_id,
        title,
        devotionals!inner (
          id,
          slug,
          publication_date,
          is_published,
          authors (
            slug,
            author_translations!inner (name)
          ),
          themes (
            slug,
            theme_translations!inner (name)
          )
        )
      `)
      .eq('language', language)
      .eq('devotionals.is_published', true)
      .textSearch('title', query, { type: 'websearch' })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw new Error(error.message);

    return {
      results: data,
      total: count,
      page,
      limit,
    };
  }

  /**
   * Format devotional response
   */
  static _formatDevotional(data) {
    const content = data.devotional_contents[0] || {};
    return {
      id: data.id,
      slug: data.slug,
      publish_date: data.publish_date,
      day_number: data.day_number,
      estimated_duration_minutes: data.estimated_duration_minutes,
      tags: data.tags || [],
      is_published: data.is_published,
      title: content.title,
      quote_author: content.quote_author,
      quote_text: content.quote_text,
      opening_inspiration: content.opening_inspiration,
      teaching_content: content.teaching_content,
      reflection_questions: content.reflection_questions || [],
      action_step: content.action_step,
      closing_prayer: content.closing_prayer,
      author: {
        id: data.authors?.id,
        slug: data.authors?.slug,
        name: data.authors?.author_translations[0]?.name,
        bio: data.authors?.author_translations[0]?.bio,
      },
      theme: {
        id: data.themes?.id,
        slug: data.themes?.slug,
        name: data.themes?.theme_translations[0]?.name,
        description: data.themes?.theme_translations[0]?.description,
      },
      biblical_references: (data.biblical_references || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(ref => ({
          id: ref.id,
          book: ref.book,
          chapter: ref.chapter,
          verse_start: ref.verse_start,
          verse_end: ref.verse_end,
          reference_text: ref.reference_text,
          scripture_text: ref.scripture_text || {},
        })),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

module.exports = Devotional;
