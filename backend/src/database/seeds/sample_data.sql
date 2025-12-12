-- Sample data for testing

-- Insert sample authors
INSERT INTO authors (slug) VALUES
  ('charles-spurgeon'),
  ('john-piper'),
  ('timothy-keller')
ON CONFLICT (slug) DO NOTHING;

-- Insert author translations
INSERT INTO author_translations (author_id, language, name, bio) VALUES
  (1, 'pt', 'Charles Spurgeon', 'Pregador batista inglês do século XIX, conhecido como o "Príncipe dos Pregadores".'),
  (1, 'en', 'Charles Spurgeon', 'English Baptist preacher of the 19th century, known as the "Prince of Preachers".'),
  (2, 'pt', 'John Piper', 'Pastor, teólogo e autor americano, fundador do Desiring God.'),
  (2, 'en', 'John Piper', 'American pastor, theologian and author, founder of Desiring God.'),
  (3, 'pt', 'Timothy Keller', 'Pastor presbiteriano e teólogo, fundador da Redeemer Presbyterian Church em Nova York.'),
  (3, 'en', 'Timothy Keller', 'Presbyterian pastor and theologian, founder of Redeemer Presbyterian Church in New York.')
ON CONFLICT (author_id, language) DO NOTHING;

-- Insert sample themes
INSERT INTO themes (slug) VALUES
  ('fe'),
  ('esperanca'),
  ('amor'),
  ('oracao'),
  ('gratidao')
ON CONFLICT (slug) DO NOTHING;

-- Insert theme translations
INSERT INTO theme_translations (theme_id, language, name, description) VALUES
  (1, 'pt', 'Fé', 'Devocionais sobre confiança e fé em Deus.'),
  (1, 'en', 'Faith', 'Devotionals about trust and faith in God.'),
  (2, 'pt', 'Esperança', 'Mensagens de esperança e encorajamento.'),
  (2, 'en', 'Hope', 'Messages of hope and encouragement.'),
  (3, 'pt', 'Amor', 'Reflexões sobre o amor de Deus e amor ao próximo.'),
  (3, 'en', 'Love', 'Reflections on God''s love and love for others.'),
  (4, 'pt', 'Oração', 'Devocionais sobre a importância da oração.'),
  (4, 'en', 'Prayer', 'Devotionals about the importance of prayer.'),
  (5, 'pt', 'Gratidão', 'Cultivando um coração grato.'),
  (5, 'en', 'Gratitude', 'Cultivating a grateful heart.')
ON CONFLICT (theme_id, language) DO NOTHING;

-- Insert sample devotionals
INSERT INTO devotionals (slug, author_id, theme_id, publication_date, is_published) VALUES
  ('confianca-em-deus', 1, 1, '2025-12-13', true),
  ('poder-da-oracao', 2, 4, '2025-12-14', true),
  ('amor-incondicional', 3, 3, '2025-12-15', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert devotional contents (Portuguese)
INSERT INTO devotional_contents (devotional_id, language, title, content, prayer) VALUES
  (1, 'pt', 'Confiança em Deus',
   'O Senhor é o nosso pastor, e quando confiamos Nele, de nada temos falta. Em meio às tempestades da vida, Sua presença nos guia e nos protege. A fé verdadeira não é ausência de dúvidas, mas a escolha de confiar em Deus apesar delas. Hoje, reflita sobre as áreas de sua vida onde você precisa exercer mais confiança em Deus.',
   'Senhor, ajuda-me a confiar em Ti com todo o meu coração. Que eu possa descansar em Tuas promessas e encontrar paz em Tua presença. Amém.'),
  (2, 'pt', 'O Poder da Oração',
   'A oração não é apenas falar com Deus, é entrar em comunhão com Ele. Quando oramos, não estamos tentando convencer Deus a fazer nossa vontade, mas alinhando nosso coração com o Dele. Deus deseja ouvir de você, não porque Ele precisa de informação, mas porque Ele valoriza o relacionamento.',
   'Pai celestial, ensina-me a orar com sinceridade e fé. Que minhas orações sejam um reflexo do meu amor por Ti. Amém.'),
  (3, 'pt', 'Amor Incondicional',
   'O amor de Deus por nós não depende de nosso desempenho ou mérito. É um amor incondicional, dado gratuitamente. Este mesmo amor deve fluir através de nós para outros. Hoje, procure oportunidades para demonstrar o amor de Cristo a alguém que precisa.',
   'Deus de amor, preencha meu coração com Teu amor para que eu possa amar outros como Tu me amas. Amém.')
ON CONFLICT (devotional_id, language) DO NOTHING;

-- Insert devotional contents (English)
INSERT INTO devotional_contents (devotional_id, language, title, content, prayer) VALUES
  (1, 'en', 'Trust in God',
   'The Lord is our shepherd, and when we trust in Him, we lack nothing. In the midst of life''s storms, His presence guides and protects us. True faith is not the absence of doubt, but the choice to trust God despite them. Today, reflect on the areas of your life where you need to exercise more trust in God.',
   'Lord, help me to trust You with all my heart. May I rest in Your promises and find peace in Your presence. Amen.'),
  (2, 'en', 'The Power of Prayer',
   'Prayer is not just talking to God, it''s entering into communion with Him. When we pray, we''re not trying to convince God to do our will, but aligning our heart with His. God wants to hear from you, not because He needs information, but because He values the relationship.',
   'Heavenly Father, teach me to pray with sincerity and faith. May my prayers be a reflection of my love for You. Amen.'),
  (3, 'en', 'Unconditional Love',
   'God''s love for us doesn''t depend on our performance or merit. It''s an unconditional love, given freely. This same love should flow through us to others. Today, look for opportunities to demonstrate Christ''s love to someone in need.',
   'God of love, fill my heart with Your love so that I may love others as You love me. Amen.')
ON CONFLICT (devotional_id, language) DO NOTHING;

-- Insert biblical references
INSERT INTO biblical_references (devotional_id, book, chapter, verse_start, verse_end, reference_text, sort_order) VALUES
  (1, 'psalms', 23, 1, NULL, 'Salmos 23:1', 1),
  (1, 'proverbs', 3, 5, 6, 'Provérbios 3:5-6', 2),
  (2, 'matthew', 6, 6, NULL, 'Mateus 6:6', 1),
  (2, '1thessalonians', 5, 17, NULL, '1 Tessalonicenses 5:17', 2),
  (3, '1john', 4, 8, NULL, '1 João 4:8', 1),
  (3, 'john', 13, 34, NULL, 'João 13:34', 2)
ON CONFLICT DO NOTHING;
