const deepl = require('deepl-node');
const { formatReference } = require('../utils/bibleTranslation');

class TranslationService {
  constructor() {
    const authKey = process.env.DEEPL_API_KEY;

    if (!authKey) {
      console.warn('⚠️  DEEPL_API_KEY not configured. Translation features will be disabled.');
      this.translator = null;
    } else {
      this.translator = new deepl.Translator(authKey);
    }
  }

  /**
   * Check if translation service is available
   */
  isAvailable() {
    return this.translator !== null;
  }

  /**
   * Translate a single text from Portuguese to English
   * @param {string} text - Text to translate
   * @returns {Promise<string>} Translated text
   */
  async translateText(text) {
    if (!this.translator) {
      throw new Error('Translation service not available. Please configure DEEPL_API_KEY.');
    }

    if (!text || text.trim() === '') {
      return '';
    }

    try {
      const result = await this.translator.translateText(
        text,
        'pt',
        'en-US',
        { tagHandling: 'html' }
      );
      return result.text;
    } catch (error) {
      console.error('DeepL translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Translate an array of texts in a single request (more efficient)
   * @param {string[]} texts - Array of texts to translate
   * @returns {Promise<string[]>} Array of translated texts
   */
  async translateTexts(texts) {
    if (!this.translator) {
      throw new Error('Translation service not available. Please configure DEEPL_API_KEY.');
    }

    // Filter out empty texts but keep track of their positions
    const textMap = texts.map((text, index) => ({ text, index, isEmpty: !text || text.trim() === '' }));
    const nonEmptyTexts = textMap.filter(item => !item.isEmpty).map(item => item.text);

    if (nonEmptyTexts.length === 0) {
      return texts.map(() => '');
    }

    try {
      const results = await this.translator.translateText(
        nonEmptyTexts,
        'pt',
        'en-US',
        { tagHandling: 'html' }
      );

      // Reconstruct array with translations in correct positions
      const translations = [];
      let resultIndex = 0;

      for (const item of textMap) {
        if (item.isEmpty) {
          translations.push('');
        } else {
          translations.push(Array.isArray(results) ? results[resultIndex].text : results.text);
          resultIndex++;
        }
      }

      return translations;
    } catch (error) {
      console.error('DeepL translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Translate devotional content from Portuguese to English
   * @param {Object} content - Devotional content in Portuguese
   * @returns {Promise<Object>} Translated content in English
   */
  async translateDevotionalContent(content) {
    if (!this.translator) {
      throw new Error('Translation service not available. Please configure DEEPL_API_KEY.');
    }

    console.log('🔤 Traduzindo conteúdo:', {
      title: content.title?.substring(0, 50),
      teaching_content: content.teaching_content?.substring(0, 100),
      closing_prayer: content.closing_prayer?.substring(0, 100),
    });

    // Collect all texts to translate (only fields used in GlowUp app)
    const textsToTranslate = [
      content.title || '',
      content.quote_author || '',
      content.quote_text || '',
      content.teaching_content || '',
      content.closing_prayer || '',
    ];

    // Translate all texts in a single batch request
    const translated = await this.translateTexts(textsToTranslate);

    console.log('✅ Tradução concluída:', {
      title: translated[0]?.substring(0, 50),
      teaching_content: translated[3]?.substring(0, 100),
      closing_prayer: translated[4]?.substring(0, 100),
    });

    // Handle reflection_questions array
    let translatedQuestions = [];
    if (content.reflection_questions && Array.isArray(content.reflection_questions) && content.reflection_questions.length > 0) {
      translatedQuestions = await this.translateTexts(content.reflection_questions);
    }

    return {
      title: translated[0],
      quote_author: translated[1],
      quote_text: translated[2],
      teaching_content: translated[3],
      closing_prayer: translated[4],
      reflection_questions: translatedQuestions,
    };
  }

  /**
   * Translate biblical references
   * @param {Array} references - Array of biblical references
   * @returns {Array} References with translated reference_text and scripture_text
   */
  translateBiblicalReferences(references) {
    if (!references || !Array.isArray(references)) {
      return [];
    }

    return references.map(ref => {
      // Generate English reference text
      const referenceTextEn = formatReference(
        ref.book,
        ref.chapter,
        ref.verse_start,
        ref.verse_end,
        'en'
      );

      return {
        ...ref,
        reference_text_en: referenceTextEn,
      };
    });
  }

  /**
   * Translate complete devotional (content + references)
   * @param {Object} devotional - Devotional data with PT content
   * @returns {Promise<Object>} Object with translated EN content and references
   */
  async translateDevotional(devotional) {
    if (!this.translator) {
      throw new Error('Translation service not available. Please configure DEEPL_API_KEY.');
    }

    // Translate main content
    const translatedContent = await this.translateDevotionalContent(devotional.content);

    // Translate biblical references
    const translatedReferences = this.translateBiblicalReferences(devotional.biblical_references || []);

    // Translate scripture texts if present
    const referencesWithScripture = await Promise.all(
      translatedReferences.map(async (ref) => {
        if (ref.scripture_text?.pt) {
          const scriptureTextEn = await this.translateText(ref.scripture_text.pt);
          return {
            ...ref,
            scripture_text_en: scriptureTextEn,
          };
        }
        return ref;
      })
    );

    return {
      content: translatedContent,
      biblical_references: referencesWithScripture,
    };
  }
}

// Export singleton instance
module.exports = new TranslationService();
