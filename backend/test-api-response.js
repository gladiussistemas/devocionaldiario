require('dotenv').config();
const { supabase } = require('./src/config/database');

async function testAPIResponse() {
  const id = 17; // como-zaqueu

  // Simula a query que o controller faz
  const { data: devotional, error } = await supabase
    .from('devotionals')
    .select(`
      *,
      devotional_contents (
        id,
        language,
        title,
        closing_prayer
      )
    `)
    .eq('id', id)
    .single();

  if (error || !devotional) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('📊 Resposta da API:');
  console.log(JSON.stringify(devotional, null, 2));

  console.log('\n🔍 Verificando HTML na oração PT:');
  const ptContent = devotional.devotional_contents.find(c => c.language === 'pt');

  console.log('\nOração PT (string):');
  console.log(ptContent.closing_prayer);

  console.log('\nOração PT (JSON):');
  console.log(JSON.stringify(ptContent.closing_prayer));

  // Check if HTML is escaped
  if (ptContent.closing_prayer.includes('&lt;')) {
    console.log('\n⚠️ HTML está ESCAPADO!');
  } else if (ptContent.closing_prayer.includes('<p>')) {
    console.log('\n✅ HTML está CORRETO (não escapado)');
  }

  process.exit(0);
}

testAPIResponse().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
