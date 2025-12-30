/**
 * Bible book name translations
 * Maps English book names to Portuguese
 */

const bookTranslations = {
  // Old Testament
  'genesis': 'Gênesis',
  'exodus': 'Êxodo',
  'leviticus': 'Levítico',
  'numbers': 'Números',
  'deuteronomy': 'Deuteronômio',
  'joshua': 'Josué',
  'judges': 'Juízes',
  'ruth': 'Rute',
  '1 samuel': '1 Samuel',
  '2 samuel': '2 Samuel',
  '1 kings': '1 Reis',
  '2 kings': '2 Reis',
  '1 chronicles': '1 Crônicas',
  '2 chronicles': '2 Crônicas',
  'ezra': 'Esdras',
  'nehemiah': 'Neemias',
  'esther': 'Ester',
  'job': 'Jó',
  'psalms': 'Salmos',
  'proverbs': 'Provérbios',
  'ecclesiastes': 'Eclesiastes',
  'song of solomon': 'Cantares',
  'isaiah': 'Isaías',
  'jeremiah': 'Jeremias',
  'lamentations': 'Lamentações',
  'ezekiel': 'Ezequiel',
  'daniel': 'Daniel',
  'hosea': 'Oséias',
  'joel': 'Joel',
  'amos': 'Amós',
  'obadiah': 'Obadias',
  'jonah': 'Jonas',
  'micah': 'Miquéias',
  'nahum': 'Naum',
  'habakkuk': 'Habacuque',
  'zephaniah': 'Sofonias',
  'haggai': 'Ageu',
  'zechariah': 'Zacarias',
  'malachi': 'Malaquias',

  // New Testament
  'matthew': 'Mateus',
  'mark': 'Marcos',
  'luke': 'Lucas',
  'john': 'João',
  'acts': 'Atos',
  'romans': 'Romanos',
  '1 corinthians': '1 Coríntios',
  '2 corinthians': '2 Coríntios',
  'galatians': 'Gálatas',
  'ephesians': 'Efésios',
  'philippians': 'Filipenses',
  'colossians': 'Colossenses',
  '1 thessalonians': '1 Tessalonicenses',
  '2 thessalonians': '2 Tessalonicenses',
  '1 timothy': '1 Timóteo',
  '2 timothy': '2 Timóteo',
  'titus': 'Tito',
  'philemon': 'Filemom',
  'hebrews': 'Hebreus',
  'james': 'Tiago',
  '1 peter': '1 Pedro',
  '2 peter': '2 Pedro',
  '1 john': '1 João',
  '2 john': '2 João',
  '3 john': '3 João',
  'jude': 'Judas',
  'revelation': 'Apocalipse',
};

/**
 * Translate Bible book name from English to Portuguese
 * @param {string} englishName - Book name in English
 * @param {string} language - Target language ('pt' or 'en')
 * @returns {string} Translated book name or original if language is 'en' or not found
 */
export function translateBookName(englishName, language = 'pt') {
  if (language !== 'pt') {
    return englishName; // Return as-is for English or other languages
  }

  const normalized = englishName.toLowerCase().trim();
  return bookTranslations[normalized] || englishName;
}

/**
 * Format a biblical reference with proper translation
 * @param {Object} ref - Biblical reference object {book, chapter, verse_start, verse_end}
 * @param {string} language - Target language ('pt' or 'en')
 * @returns {string} Formatted reference (e.g., "Romanos 3:21-26" or "Romans 3:21-26")
 */
export function formatBiblicalReference(ref, language = 'pt') {
  const bookName = translateBookName(ref.book, language);
  const verses = ref.verse_end ? `${ref.verse_start}-${ref.verse_end}` : ref.verse_start;
  return `${bookName} ${ref.chapter}:${verses}`;
}
