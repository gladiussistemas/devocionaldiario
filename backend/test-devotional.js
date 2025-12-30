require('dotenv').config();
const { supabase } = require('./src/config/database');

async function testDevotional() {
  const slug = 'como-zaqueu';

  console.log('🔍 Buscando devocional:', slug);

  const { data, error } = await supabase
    .from('devotionals')
    .select(`
      *,
      devotional_contents (
        id,
        language,
        title,
        teaching_content,
        closing_prayer
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('\n📊 Devocional encontrado:');
  console.log('ID:', data.id);
  console.log('Slug:', data.slug);
  console.log('\n📚 Conteúdos:');

  data.devotional_contents.forEach(content => {
    console.log(`\n--- ${content.language.toUpperCase()} ---`);
    console.log('ID:', content.id);
    console.log('Título:', content.title);
    console.log('\nEnsinamento completo:');
    console.log(content.teaching_content);
    console.log('\nOração completa:');
    console.log(content.closing_prayer);
  });

  process.exit(0);
}

testDevotional().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
