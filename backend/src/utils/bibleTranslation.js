/**
 * Bible Books Translation Map (Portuguese to English)
 * Maps book keys to their names in both languages
 */

const bibleBookNames = {
  // Old Testament
  genesis: { pt: 'Gênesis', en: 'Genesis' },
  exodus: { pt: 'Êxodo', en: 'Exodus' },
  leviticus: { pt: 'Levítico', en: 'Leviticus' },
  numbers: { pt: 'Números', en: 'Numbers' },
  deuteronomy: { pt: 'Deuteronômio', en: 'Deuteronomy' },
  joshua: { pt: 'Josué', en: 'Joshua' },
  judges: { pt: 'Juízes', en: 'Judges' },
  ruth: { pt: 'Rute', en: 'Ruth' },
  '1samuel': { pt: '1 Samuel', en: '1 Samuel' },
  '2samuel': { pt: '2 Samuel', en: '2 Samuel' },
  '1kings': { pt: '1 Reis', en: '1 Kings' },
  '2kings': { pt: '2 Reis', en: '2 Kings' },
  '1chronicles': { pt: '1 Crônicas', en: '1 Chronicles' },
  '2chronicles': { pt: '2 Crônicas', en: '2 Chronicles' },
  ezra: { pt: 'Esdras', en: 'Ezra' },
  nehemiah: { pt: 'Neemias', en: 'Nehemiah' },
  esther: { pt: 'Ester', en: 'Esther' },
  job: { pt: 'Jó', en: 'Job' },
  psalms: { pt: 'Salmos', en: 'Psalms' },
  proverbs: { pt: 'Provérbios', en: 'Proverbs' },
  ecclesiastes: { pt: 'Eclesiastes', en: 'Ecclesiastes' },
  songofsolomon: { pt: 'Cânticos', en: 'Song of Solomon' },
  isaiah: { pt: 'Isaías', en: 'Isaiah' },
  jeremiah: { pt: 'Jeremias', en: 'Jeremiah' },
  lamentations: { pt: 'Lamentações', en: 'Lamentations' },
  ezekiel: { pt: 'Ezequiel', en: 'Ezekiel' },
  daniel: { pt: 'Daniel', en: 'Daniel' },
  hosea: { pt: 'Oséias', en: 'Hosea' },
  joel: { pt: 'Joel', en: 'Joel' },
  amos: { pt: 'Amós', en: 'Amos' },
  obadiah: { pt: 'Obadias', en: 'Obadiah' },
  jonah: { pt: 'Jonas', en: 'Jonah' },
  micah: { pt: 'Miquéias', en: 'Micah' },
  nahum: { pt: 'Naum', en: 'Nahum' },
  habakkuk: { pt: 'Habacuque', en: 'Habakkuk' },
  zephaniah: { pt: 'Sofonias', en: 'Zephaniah' },
  haggai: { pt: 'Ageu', en: 'Haggai' },
  zechariah: { pt: 'Zacarias', en: 'Zechariah' },
  malachi: { pt: 'Malaquias', en: 'Malachi' },

  // New Testament
  matthew: { pt: 'Mateus', en: 'Matthew' },
  mark: { pt: 'Marcos', en: 'Mark' },
  luke: { pt: 'Lucas', en: 'Luke' },
  john: { pt: 'João', en: 'John' },
  acts: { pt: 'Atos', en: 'Acts' },
  romans: { pt: 'Romanos', en: 'Romans' },
  '1corinthians': { pt: '1 Coríntios', en: '1 Corinthians' },
  '2corinthians': { pt: '2 Coríntios', en: '2 Corinthians' },
  galatians: { pt: 'Gálatas', en: 'Galatians' },
  ephesians: { pt: 'Efésios', en: 'Ephesians' },
  philippians: { pt: 'Filipenses', en: 'Philippians' },
  colossians: { pt: 'Colossenses', en: 'Colossians' },
  '1thessalonians': { pt: '1 Tessalonicenses', en: '1 Thessalonians' },
  '2thessalonians': { pt: '2 Tessalonicenses', en: '2 Thessalonians' },
  '1timothy': { pt: '1 Timóteo', en: '1 Timothy' },
  '2timothy': { pt: '2 Timóteo', en: '2 Timothy' },
  titus: { pt: 'Tito', en: 'Titus' },
  philemon: { pt: 'Filemom', en: 'Philemon' },
  hebrews: { pt: 'Hebreus', en: 'Hebrews' },
  james: { pt: 'Tiago', en: 'James' },
  '1peter': { pt: '1 Pedro', en: '1 Peter' },
  '2peter': { pt: '2 Pedro', en: '2 Peter' },
  '1john': { pt: '1 João', en: '1 John' },
  '2john': { pt: '2 João', en: '2 John' },
  '3john': { pt: '3 João', en: '3 John' },
  jude: { pt: 'Judas', en: 'Jude' },
  revelation: { pt: 'Apocalipse', en: 'Revelation' },
};

/**
 * Format reference text in specified language
 * @param {string} bookKey - Book key (e.g., 'genesis', 'john')
 * @param {number} chapter - Chapter number
 * @param {number} verseStart - Start verse number
 * @param {number} verseEnd - End verse number (optional)
 * @param {string} language - 'pt' or 'en'
 * @returns {string} Formatted reference (e.g., "Genesis 1:1" or "Gênesis 1:1")
 */
function formatReference(bookKey, chapter, verseStart, verseEnd, language = 'pt') {
  const bookName = bibleBookNames[bookKey]?.[language] || bookKey;

  if (verseEnd && verseEnd !== verseStart) {
    return `${bookName} ${chapter}:${verseStart}-${verseEnd}`;
  }

  return `${bookName} ${chapter}:${verseStart}`;
}

/**
 * Get book name in specified language
 * @param {string} bookKey - Book key
 * @param {string} language - 'pt' or 'en'
 * @returns {string} Book name
 */
function getBookName(bookKey, language = 'pt') {
  return bibleBookNames[bookKey]?.[language] || bookKey;
}

module.exports = {
  bibleBookNames,
  formatReference,
  getBookName,
};
