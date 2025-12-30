require('dotenv').config();
const { supabase } = require('./src/config/database');

// Conteúdo correto em português
const correctPtContent = `<p>A história de Zaqueu nos convida a refletir sobre o encontro transformador com Jesus.</p><p><br></p><p>Pequeno de estatura, mas grande em desejo, Zaqueu não permitiu que suas limitações o impedissem de ver o Salvador. Ele subiu em uma figueira, expondo-se ao ridículo, porque algo em seu coração ansiava por mais do que riqueza ou poder. Muitas vezes somos assim: cheios de posses, mas vazios de significado, buscando um olhar que restaure nossa dignidade.</p><p><br></p><p>Jesus, ao passar, não apenas viu Zaqueu; ele o chamou pelo nome. Este chamado revela um Deus que nos conhece profundamente e não se intimida com nosso passado. Zaqueu era um cobrador de impostos, desprezado pela sociedade, símbolo de injustiça e exploração. Ainda assim, foi escolhido para receber Cristo em sua casa. O amor de Jesus quebra barreiras, atravessa preconceitos e alcança corações dispostos a mudar.</p><p><br></p><p>O verdadeiro milagre acontece após o encontro. Zaqueu decide devolver o que roubou e compartilhar seus bens com os pobres. A conversão genuína produz frutos visíveis. Quando Jesus entra em nossa casa, em nossa vida, tudo muda. Os valores são reorganizados, as prioridades são realinhadas e o egoísmo dá lugar à generosidade. Não se trata apenas de emoção, mas de transformação prática.</p><p><br></p><p>Ser "como Zaqueu" hoje é reconhecer nossa necessidade de Deus e ter a coragem de subir na figueira da fé, deixando o orgulho para trás. É ouvir Jesus nos chamar, descer com alegria e abrir a porta de nosso coração para ele. É permitir que sua presença transforme nossas atitudes, relacionamentos e escolhas.</p><p><br></p><p>Que possamos, como Zaqueu, experimentar a salvação que visita nossa casa quando escolhemos responder ao chamado de Cristo com arrependimento e amor.</p>`;

async function fixContent() {
  console.log('🔧 Corrigindo conteúdo PT do devocional "como-zaqueu"...\n');

  // Update the PT content
  const { error } = await supabase
    .from('devotional_contents')
    .update({
      teaching_content: correctPtContent
    })
    .eq('id', 35);  // ID do conteúdo PT

  if (error) {
    console.error('❌ Erro ao atualizar:', error);
    process.exit(1);
  }

  console.log('✅ Conteúdo PT atualizado com sucesso!\n');

  // Verify the update
  const { data, error: verifyError } = await supabase
    .from('devotional_contents')
    .select('teaching_content')
    .eq('id', 35)
    .single();

  if (verifyError) {
    console.error('❌ Erro ao verificar:', verifyError);
    process.exit(1);
  }

  console.log('🔍 Verificando conteúdo atualizado (primeiros 100 caracteres):');
  console.log(data.teaching_content.substring(0, 100));

  process.exit(0);
}

fixContent().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
