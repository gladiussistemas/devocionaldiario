const { Ollama } = require('ollama');
const { supabase } = require('../config/database');

class OllamaService {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_URL || 'http://localhost:11434',
    });
    this.model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  }

  // Definir as ferramentas que o agente pode usar
  getToolDeclarations() {
    return {
      createDevotional: {
        description: 'Cria um novo devocional no banco de dados. Use esta ferramenta para salvar devocionais que você criar.',
        parameters: {
          slug: 'URL amigável (ex: fe-em-deus)',
          title_pt: 'Título em português',
          title_en: 'Título em inglês',
          teaching_content_pt: 'Conteúdo principal em português',
          teaching_content_en: 'Conteúdo principal em inglês',
          reflection_questions_pt: 'Array de perguntas em português',
          reflection_questions_en: 'Array de perguntas em inglês',
          closing_prayer_pt: 'Oração em português',
          closing_prayer_en: 'Oração em inglês',
          publish_date: 'Data de publicação (YYYY-MM-DD)',
          is_published: 'Publicar imediatamente (true/false)',
        },
      },
      listDevotionals: {
        description: 'Lista os devocionais existentes no banco de dados.',
        parameters: {
          limit: 'Número máximo de devocionais (padrão: 10)',
          is_published: 'Filtrar por status de publicação (opcional)',
        },
      },
      getDevotional: {
        description: 'Busca um devocional específico pelo ID.',
        parameters: {
          devotional_id: 'ID do devocional',
        },
      },
      searchBibleVerse: {
        description: 'Busca versículos bíblicos relevantes para um tema.',
        parameters: {
          theme: 'Tema ou assunto (ex: fé, amor, esperança)',
        },
      },
    };
  }

  // Executar as ferramentas chamadas pelo agente
  async executeFunction(functionName, args) {
    try {
      switch (functionName) {
        case 'createDevotional':
          return await this.createDevotional(args);
        case 'listDevotionals':
          return await this.listDevotionals(args);
        case 'getDevotional':
          return await this.getDevotional(args);
        case 'searchBibleVerse':
          return await this.searchBibleVerse(args);
        default:
          return { error: `Função desconhecida: ${functionName}` };
      }
    } catch (error) {
      console.error(`Error executing function ${functionName}:`, error);
      return { error: error.message };
    }
  }

  // Implementação: Criar devocional
  async createDevotional(args) {
    try {
      // Gerar slug a partir do título PT se não fornecido
      const slug = args.slug || args.title_pt
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Usar data de hoje se não fornecida
      const publishDate = args.publish_date || new Date().toISOString().split('T')[0];

      console.log(`📅 Criando devocional: ${args.title_pt}`);
      console.log(`🔗 Slug: ${slug}`);
      console.log(`📆 Data de publicação: ${publishDate}`);

      const { data: devotional, error: devotionalError } = await supabase
        .from('devotionals')
        .insert([{
          slug: slug,
          publish_date: publishDate,
          day_number: args.day_number || null,
          estimated_duration_minutes: 10,
          tags: args.tags || [],
          is_published: args.is_published !== undefined ? args.is_published : true,
        }])
        .select()
        .single();

      if (devotionalError) throw devotionalError;

      const devotionalId = devotional.id;

      const { error: contentPtError } = await supabase
        .from('devotional_contents')
        .insert([{
          devotional_id: devotionalId,
          language: 'pt',
          title: args.title_pt,
          quote_author: args.quote_author || null,
          quote_text: args.quote_text_pt || null,
          teaching_content: args.teaching_content_pt,
          reflection_questions: args.reflection_questions_pt || [],
          closing_prayer: args.closing_prayer_pt,
        }]);

      if (contentPtError) throw contentPtError;

      const { error: contentEnError } = await supabase
        .from('devotional_contents')
        .insert([{
          devotional_id: devotionalId,
          language: 'en',
          title: args.title_en,
          quote_author: args.quote_author || null,
          quote_text: args.quote_text_en || null,
          teaching_content: args.teaching_content_en,
          reflection_questions: args.reflection_questions_en || [],
          closing_prayer: args.closing_prayer_en,
        }]);

      if (contentEnError) throw contentEnError;

      return {
        success: true,
        devotional_id: devotionalId,
        message: `Devocional "${args.title_pt}" criado com sucesso!`,
      };
    } catch (error) {
      console.error('Error creating devotional:', error);
      throw error;
    }
  }

  // Implementação: Listar devocionais
  async listDevotionals(args) {
    const limit = args.limit || 10;

    try {
      let query = supabase
        .from('devotionals')
        .select(`
          id,
          slug,
          publish_date,
          day_number,
          is_published,
          tags,
          devotional_contents!inner(title)
        `)
        .eq('devotional_contents.language', 'pt')
        .order('publish_date', { ascending: false })
        .limit(limit);

      if (args.is_published !== undefined) {
        query = query.eq('is_published', args.is_published);
      }

      const { data, error } = await query;

      if (error) throw error;

      const devotionals = data.map(d => ({
        id: d.id,
        slug: d.slug,
        publish_date: d.publish_date,
        day_number: d.day_number,
        is_published: d.is_published,
        tags: d.tags,
        title: d.devotional_contents[0]?.title || '',
      }));

      return {
        success: true,
        devotionals,
        count: devotionals.length,
      };
    } catch (error) {
      console.error('Error listing devotionals:', error);
      return {
        success: false,
        devotionals: [],
        count: 0,
        error: error.message,
      };
    }
  }

  // Implementação: Buscar devocional específico
  async getDevotional(args) {
    try {
      const { data: devotional, error: devotionalError } = await supabase
        .from('devotionals')
        .select(`
          *,
          devotional_contents(*)
        `)
        .eq('id', args.devotional_id)
        .single();

      if (devotionalError) throw devotionalError;

      if (!devotional) {
        return { error: 'Devocional não encontrado' };
      }

      return {
        success: true,
        devotional: {
          ...devotional,
          contents: devotional.devotional_contents,
        },
      };
    } catch (error) {
      console.error('Error getting devotional:', error);
      return { error: 'Devocional não encontrado' };
    }
  }

  // Implementação: Buscar versículos bíblicos
  async searchBibleVerse(args) {
    const suggestions = {
      fé: ['Hebreus 11:1', 'Marcos 11:22-24', 'Romanos 10:17'],
      amor: ['1 Coríntios 13:4-7', 'João 3:16', '1 João 4:8'],
      esperança: ['Romanos 15:13', 'Jeremias 29:11', 'Salmos 42:5'],
      paz: ['Filipenses 4:7', 'João 14:27', 'Isaías 26:3'],
      força: ['Filipenses 4:13', 'Isaías 40:31', '2 Coríntios 12:9'],
    };

    const theme = args.theme.toLowerCase();
    const verses = suggestions[theme] || [
      'Salmos 119:105',
      'Provérbios 3:5-6',
      'Josué 1:9',
    ];

    return {
      success: true,
      theme: args.theme,
      suggested_verses: verses,
      message: `Versículos sugeridos sobre ${args.theme}: ${verses.join(', ')}`,
    };
  }

  // Método principal de chat
  async chat(messages, userId) {
    try {
      console.log('🤖 Devon IA: Iniciando chat com Ollama');
      console.log(`📍 Ollama URL: ${this.ollama.config.host}`);
      console.log(`🎯 Modelo: ${this.model}`);

      const systemPrompt = `Você é o Devon IA, um assistente especializado em criar devocionais cristãos profundos e inspiradores.

IMPORTANTE: Você deve responder APENAS com JSON válido, sem texto adicional.

Quando o usuário pedir para criar um devocional, você DEVE criar um conteúdo COMPLETO e PROFUNDO com:

1. TÍTULO: Inspirador e cativante (PT e EN)
2. CITAÇÃO DIÁRIA: Uma frase marcante de um autor cristão conhecido (Charles Spurgeon, C.S. Lewis, Dietrich Bonhoeffer, Rick Warren, etc.) relacionada ao tema
3. CONTEÚDO DEVOCIONAL: Texto rico com 4-6 parágrafos (mínimo 300 palavras) explorando o tema biblicamente
4. PERGUNTAS DE REFLEXÃO: 4-5 perguntas profundas e práticas para reflexão pessoal
5. ORAÇÃO: Oração completa e tocante (mínimo 4-5 frases) relacionada ao tema

FORMATO JSON DE RESPOSTA:
{
  "message": "✓ Devocional criado com sucesso!",
  "actions": [
    {
      "tool": "createDevotional",
      "args": {
        "title_pt": "Título Inspirador",
        "title_en": "Inspiring Title",
        "quote_author": "Nome do Autor",
        "quote_text_pt": "Citação profunda em português",
        "quote_text_en": "Deep quote in English",
        "teaching_content_pt": "<p>Parágrafo 1 explorando o tema biblicamente...</p><p>Parágrafo 2 com aplicação prática...</p><p>Parágrafo 3 com mais profundidade teológica...</p><p>Parágrafo 4 concluindo com esperança...</p>",
        "teaching_content_en": "<p>Paragraph 1 exploring the theme biblically...</p><p>Paragraph 2 with practical application...</p><p>Paragraph 3 with more theological depth...</p><p>Paragraph 4 concluding with hope...</p>",
        "reflection_questions_pt": [
          "Pergunta profunda 1?",
          "Pergunta prática 2?",
          "Pergunta de autoexame 3?",
          "Pergunta de aplicação 4?"
        ],
        "reflection_questions_en": [
          "Deep question 1?",
          "Practical question 2?",
          "Self-examination question 3?",
          "Application question 4?"
        ],
        "closing_prayer_pt": "Pai celestial, venho diante de Ti reconhecendo... [oração completa de 4-5 frases]. Amém.",
        "closing_prayer_en": "Heavenly Father, I come before You acknowledging... [complete prayer of 4-5 sentences]. Amen."
      }
    }
  ]
}

EXEMPLO CONCRETO de devocional sobre FÉ:
{
  "message": "✓ Devocional sobre fé criado com sucesso!",
  "actions": [
    {
      "tool": "createDevotional",
      "args": {
        "title_pt": "Fé Que Move Montanhas",
        "title_en": "Faith That Moves Mountains",
        "quote_author": "Charles Spurgeon",
        "quote_text_pt": "A fé não opera no reino do possível. Não há glória para Deus naquilo que é humanamente possível. A fé começa onde as possibilidades terminam.",
        "quote_text_en": "Faith does not operate in the realm of the possible. There is no glory for God in that which is humanly possible. Faith begins where possibilities end.",
        "teaching_content_pt": "<p>A fé genuína não é simplesmente acreditar que Deus existe, mas confiar plenamente em Seu caráter e Suas promessas, mesmo quando as circunstâncias parecem impossíveis. Hebreus 11:1 nos ensina que 'a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.' Esta definição nos revela que a fé transcende o visível e se ancora no invisível – no próprio Deus.</p><p>Quando Jesus disse em Mateus 17:20 que a fé do tamanho de um grão de mostarda pode mover montanhas, Ele não estava falando sobre a quantidade de fé, mas sobre a qualidade dela. Não se trata de ter uma fé gigante, mas de ter fé em um Deus gigante. As montanhas que enfrentamos – seja doença, dificuldades financeiras, relacionamentos quebrados ou desafios espirituais – são oportunidades para vermos o poder de Deus em ação.</p><p>A jornada da fé não é isenta de dúvidas e questionamentos. Até mesmo João Batista, do cárcere, enviou discípulos para perguntar a Jesus: 'És tu aquele que havia de vir, ou esperamos outro?' A fé madura não ignora as perguntas difíceis, mas as traz diante de Deus com honestidade. É na vulnerabilidade de nossas dúvidas que Deus fortalece nossa confiança Nele.</p><p>Deus não nos chama para uma vida de fé cega, mas de fé fundamentada em quem Ele é. Cada promessa cumprida na Escritura, cada testemunho de Sua fidelidade em nossa própria história, e especialmente a prova suprema de Seu amor demonstrada na cruz de Cristo – tudo isso constrói o alicerce sobre o qual nossa fé se mantém firme. Que possamos cultivar uma fé que não apenas move montanhas, mas que honra a Deus em meio a elas.</p>",
        "teaching_content_en": "<p>Genuine faith is not simply believing that God exists, but fully trusting in His character and His promises, even when circumstances seem impossible. Hebrews 11:1 teaches us that 'faith is the assurance of what we hope for and the proof of things not seen.' This definition reveals that faith transcends the visible and anchors itself in the invisible – in God Himself.</p><p>When Jesus said in Matthew 17:20 that faith the size of a mustard seed can move mountains, He was not talking about the quantity of faith, but about its quality. It's not about having giant faith, but about having faith in a giant God. The mountains we face – whether illness, financial difficulties, broken relationships, or spiritual challenges – are opportunities to see God's power in action.</p><p>The journey of faith is not free from doubts and questions. Even John the Baptist, from prison, sent disciples to ask Jesus: 'Are you the one who is to come, or should we expect someone else?' Mature faith does not ignore difficult questions but brings them before God with honesty. It is in the vulnerability of our doubts that God strengthens our trust in Him.</p><p>God does not call us to a life of blind faith, but of faith grounded in who He is. Every promise fulfilled in Scripture, every testimony of His faithfulness in our own story, and especially the supreme proof of His love demonstrated on the cross of Christ – all of this builds the foundation on which our faith stands firm. May we cultivate a faith that not only moves mountains but honors God in the midst of them.</p>",
        "reflection_questions_pt": [
          "Quais são as 'montanhas' que você está enfrentando atualmente e que parecem impossíveis de mover?",
          "De que maneiras você tem confiado mais nas suas próprias forças do que na fidelidade de Deus?",
          "Quando foi a última vez que você experimentou Deus agindo de forma sobrenatural em sua vida?",
          "Como suas dúvidas e questionamentos podem se tornar oportunidades para fortalecer sua fé ao invés de enfraquecê-la?",
          "O que significa para você, hoje, ter fé 'em um Deus gigante' ao invés de buscar ter 'fé gigante'?"
        ],
        "reflection_questions_en": [
          "What are the 'mountains' you are currently facing that seem impossible to move?",
          "In what ways have you been trusting more in your own strength than in God's faithfulness?",
          "When was the last time you experienced God acting supernaturally in your life?",
          "How can your doubts and questions become opportunities to strengthen your faith instead of weakening it?",
          "What does it mean for you, today, to have faith 'in a giant God' instead of seeking to have 'giant faith'?"
        ],
        "closing_prayer_pt": "Pai celestial, venho diante de Ti reconhecendo que muitas vezes confio mais no que vejo do que em Tuas promessas. Perdoa-me por tentar mover montanhas com minhas próprias forças, esquecendo que Tu és o Deus que move montanhas. Aumenta minha fé, Senhor, não em tamanho, mas em profundidade e qualidade. Que eu possa confiar plenamente em Teu caráter, mesmo quando as circunstâncias parecem impossíveis. Ajuda-me a trazer minhas dúvidas diante de Ti com honestidade, sabendo que Tu fortaleces minha confiança em meio às minhas fraquezas. Obrigado por nunca me abandonar e por ser sempre fiel. Em nome de Jesus, Amém.",
        "closing_prayer_en": "Heavenly Father, I come before You acknowledging that often I trust more in what I see than in Your promises. Forgive me for trying to move mountains with my own strength, forgetting that You are the God who moves mountains. Increase my faith, Lord, not in size, but in depth and quality. May I fully trust in Your character, even when circumstances seem impossible. Help me bring my doubts before You with honesty, knowing that You strengthen my trust amid my weaknesses. Thank You for never abandoning me and for always being faithful. In Jesus' name, Amen."
      }
    }
  ]
}

Se o usuário apenas cumprimentar, responda:
{
  "message": "Olá! Sou o Devon IA, especialista em criar devocionais cristãos profundos e inspiradores. Sobre qual tema você gostaria de um devocional? (Exemplos: fé, amor, esperança, paz, perdão, gratidão, força, perseverança, etc.)",
  "actions": []
}`;

      // Construir histórico de mensagens
      const conversationHistory = messages
        .filter(m => m.content && m.content.trim() !== '')
        .map(m => `${m.role === 'user' ? 'Usuário' : 'Devon IA'}: ${m.content}`)
        .join('\n\n');

      const lastUserMessage = messages[messages.length - 1].content;
      const lowerMessage = lastUserMessage.toLowerCase();

      // Detectar se usuário quer criar um devocional
      const wantsToCreate = lowerMessage.match(/crie|criar|faça|fazer|gerar|gostaria|quero/i) &&
                           (lowerMessage.match(/devocional/i) || lowerMessage.match(/fé|amor|esperança|paz|força|oração/i));

      console.log(`🔍 Usuário quer criar devocional: ${wantsToCreate}`);

      const fullPrompt = `${systemPrompt}

HISTÓRICO DA CONVERSA:
${conversationHistory}

NOVA MENSAGEM DO USUÁRIO:
${lastUserMessage}

Sua resposta${wantsToCreate ? ' (o usuário está pedindo para criar um devocional)' : ''}:`;

      // Fazer requisição ao Ollama com formato JSON
      console.log('📤 Enviando requisição ao Ollama...');
      const response = await this.ollama.generate({
        model: this.model,
        prompt: fullPrompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.8,
          num_predict: 4000,
        },
      });
      console.log('✅ Resposta recebida do Ollama');

      let responseText = response.response;
      console.log('📝 Resposta bruta do Ollama:', responseText);

      // Tentar fazer parse da resposta JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
        console.log('✅ JSON parsed com sucesso');
      } catch (e) {
        console.error('❌ Erro ao fazer parse do JSON:', e.message);
        return {
          role: 'assistant',
          content: 'Desculpe, tive um problema ao processar sua solicitação. Por favor, tente novamente.',
        };
      }

      // Se detectamos que quer criar devocional, forçar a ação
      const functionCalls = [];

      if (wantsToCreate) {
        console.log('🎯 Criando devocional automaticamente...');

        // Extrair tema da mensagem
        let theme = 'fé';
        if (lowerMessage.includes('amor')) theme = 'amor';
        else if (lowerMessage.includes('esperança')) theme = 'esperança';
        else if (lowerMessage.includes('paz')) theme = 'paz';
        else if (lowerMessage.includes('força')) theme = 'força';

        console.log(`📌 Tema detectado: ${theme}`);

        // Verificar se o modelo já incluiu a ação no JSON
        const hasCreateAction = parsedResponse.actions?.some(a => a.tool === 'createDevotional');

        if (!hasCreateAction && parsedResponse.actions?.length > 0) {
          // Se tem outras ações mas não createDevotional, executar as ações do modelo
          for (const action of parsedResponse.actions) {
            const { tool, args } = action;
            console.log(`⚙️ Executando função: ${tool}`);
            const functionResponse = await this.executeFunction(tool, args);
            functionCalls.push({ name: tool, response: functionResponse });
          }
        } else if (hasCreateAction) {
          // Se o modelo já incluiu createDevotional, executar normalmente
          for (const action of parsedResponse.actions) {
            const { tool, args } = action;
            console.log(`⚙️ Executando função: ${tool}`);
            console.log(`📋 Argumentos:`, JSON.stringify(args, null, 2));
            const functionResponse = await this.executeFunction(tool, args);
            console.log(`✅ Resposta da função:`, JSON.stringify(functionResponse, null, 2));
            functionCalls.push({ name: tool, response: functionResponse });
          }
        } else {
          // Se o modelo não incluiu createDevotional, forçar a criação com conteúdo rico
          const themeData = {
            fé: {
              title_pt: 'Fé Que Transforma Vidas',
              title_en: 'Faith That Transforms Lives',
              quote_author: 'Charles Spurgeon',
              quote_pt: 'A fé não opera no reino do possível. Não há glória para Deus naquilo que é humanamente possível. A fé começa onde as possibilidades terminam.',
              quote_en: 'Faith does not operate in the realm of the possible. There is no glory for God in that which is humanly possible. Faith begins where possibilities end.',
            },
            amor: {
              title_pt: 'O Amor Que Nunca Falha',
              title_en: 'Love That Never Fails',
              quote_author: 'C.S. Lewis',
              quote_pt: 'Amar não é olhar um para o outro, mas olhar juntos na mesma direção.',
              quote_en: 'Love is not looking at each other, but looking together in the same direction.',
            },
            esperança: {
              title_pt: 'Esperança Que Não Decepciona',
              title_en: 'Hope That Does Not Disappoint',
              quote_author: 'Dietrich Bonhoeffer',
              quote_pt: 'Somente aqueles que esperam podem receber o que está além de suas esperanças.',
              quote_en: 'Only those who hope can receive what is beyond their hopes.',
            },
            paz: {
              title_pt: 'Paz Que Excede Todo Entendimento',
              title_en: 'Peace That Surpasses All Understanding',
              quote_author: 'Max Lucado',
              quote_pt: 'A paz não é a ausência de problemas, mas a presença de Deus.',
              quote_en: 'Peace is not the absence of problems, but the presence of God.',
            },
            força: {
              title_pt: 'Força na Fraqueza',
              title_en: 'Strength in Weakness',
              quote_author: 'Rick Warren',
              quote_pt: 'Nossa maior fraqueza é a oportunidade de Deus mostrar Sua maior força.',
              quote_en: 'Our greatest weakness is God\'s opportunity to show His greatest strength.',
            },
          };

          const currentTheme = themeData[theme] || themeData.fé;

          const devotionalArgs = {
            title_pt: parsedResponse.title_pt || currentTheme.title_pt,
            title_en: parsedResponse.title_en || currentTheme.title_en,
            quote_author: parsedResponse.quote_author || currentTheme.quote_author,
            quote_text_pt: parsedResponse.quote_text_pt || currentTheme.quote_pt,
            quote_text_en: parsedResponse.quote_text_en || currentTheme.quote_en,
            teaching_content_pt: parsedResponse.teaching_content_pt || parsedResponse.content_pt ||
              `<p>Este devocional explora o tema de ${theme} através de uma perspectiva bíblica profunda. A Palavra de Deus nos ensina que ${theme} é fundamental para nossa caminhada cristã.</p>
              <p>Quando olhamos para as Escrituras, vemos inúmeros exemplos de como ${theme} transformou vidas e mudou histórias. Não se trata apenas de um conceito teórico, mas de uma realidade viva que deve permear cada aspecto de nossa existência.</p>
              <p>Em nossa jornada diária, somos constantemente desafiados a viver ${theme} de forma prática e autêntica. As dificuldades que enfrentamos são oportunidades para que ${theme} se manifeste de maneira ainda mais poderosa em nossas vidas.</p>
              <p>Que possamos, portanto, buscar crescer em ${theme}, sabendo que Deus nos capacita e fortalece a cada dia. Ele é fiel para completar a boa obra que começou em nós.</p>`,
            teaching_content_en: parsedResponse.teaching_content_en || parsedResponse.content_en ||
              `<p>This devotional explores the theme of ${theme} through a deep biblical perspective. God's Word teaches us that ${theme} is fundamental to our Christian walk.</p>
              <p>When we look at the Scriptures, we see countless examples of how ${theme} transformed lives and changed stories. It is not just a theoretical concept, but a living reality that should permeate every aspect of our existence.</p>
              <p>In our daily journey, we are constantly challenged to live ${theme} in a practical and authentic way. The difficulties we face are opportunities for ${theme} to manifest even more powerfully in our lives.</p>
              <p>May we therefore seek to grow in ${theme}, knowing that God empowers and strengthens us each day. He is faithful to complete the good work He began in us.</p>`,
            reflection_questions_pt: parsedResponse.reflection_questions_pt || [
              `De que forma ${theme} tem sido manifesta em sua vida diária?`,
              `Quais obstáculos você enfrenta ao buscar viver ${theme} de maneira autêntica?`,
              `Como as Escrituras podem fortalecer sua compreensão sobre ${theme}?`,
              `Que passos práticos você pode dar hoje para crescer em ${theme}?`,
            ],
            reflection_questions_en: parsedResponse.reflection_questions_en || [
              `In what ways has ${theme} been manifested in your daily life?`,
              `What obstacles do you face in seeking to live ${theme} authentically?`,
              `How can Scripture strengthen your understanding of ${theme}?`,
              `What practical steps can you take today to grow in ${theme}?`,
            ],
            closing_prayer_pt: parsedResponse.closing_prayer_pt ||
              `Pai celestial, venho diante de Ti hoje reconhecendo minha necessidade de crescer em ${theme}. Sei que sem Ti nada posso fazer, mas em Ti encontro toda a força e capacitação que preciso. Ajuda-me a viver ${theme} de forma autêntica e transformadora. Que minha vida seja um reflexo do Teu amor e da Tua graça. Obrigado por nunca me abandonar e por estar comigo em cada passo desta jornada. Em nome de Jesus, Amém.`,
            closing_prayer_en: parsedResponse.closing_prayer_en ||
              `Heavenly Father, I come before You today acknowledging my need to grow in ${theme}. I know that without You I can do nothing, but in You I find all the strength and empowerment I need. Help me to live ${theme} in an authentic and transformative way. May my life be a reflection of Your love and Your grace. Thank You for never abandoning me and for being with me in every step of this journey. In Jesus' name, Amen.`,
          };

          console.log(`⚙️ Executando função: createDevotional`);
          console.log(`📋 Argumentos:`, JSON.stringify(devotionalArgs, null, 2));

          const functionResponse = await this.executeFunction('createDevotional', devotionalArgs);
          console.log(`✅ Resposta da função:`, JSON.stringify(functionResponse, null, 2));

          functionCalls.push({
            name: 'createDevotional',
            response: functionResponse,
          });
        }
      } else if (parsedResponse.actions && Array.isArray(parsedResponse.actions) && parsedResponse.actions.length > 0) {
        // Usuário não quer criar devocional, mas o modelo retornou ações
        console.log(`🔧 Encontradas ${parsedResponse.actions.length} ações para executar`);

        for (const action of parsedResponse.actions) {
          const { tool, args } = action;
          console.log(`⚙️ Executando função: ${tool}`);
          console.log(`📋 Argumentos:`, JSON.stringify(args, null, 2));

          const functionResponse = await this.executeFunction(tool, args);
          console.log(`✅ Resposta da função:`, JSON.stringify(functionResponse, null, 2));

          functionCalls.push({
            name: tool,
            response: functionResponse,
          });
        }
      }

      // Ajustar mensagem se criou devocional
      let finalMessage = parsedResponse.message || 'Tarefa concluída!';
      if (functionCalls.some(fc => fc.name === 'createDevotional' && fc.response.success)) {
        const devotionalTitle = functionCalls.find(fc => fc.name === 'createDevotional')?.response?.message || '';
        finalMessage = `✓ Devocional criado com sucesso! ${devotionalTitle} Você pode visualizá-lo no painel de Devocionais.`;
      }

      // Retornar a mensagem com as funções executadas
      return {
        role: 'assistant',
        content: finalMessage,
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
      };
    } catch (error) {
      console.error('❌ Ollama chat error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });

      // Retornar erro mais amigável
      throw new Error(`Falha ao comunicar com Ollama: ${error.message}`);
    }
  }
}

module.exports = new OllamaService();
