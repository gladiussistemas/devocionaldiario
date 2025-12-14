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
          opening_inspiration: args.opening_inspiration_pt || null,
          scripture_reference: args.scripture_reference || null,
          teaching_content: args.teaching_content_pt,
          reflection_questions: args.reflection_questions_pt || [],
          action_step: args.action_step_pt || null,
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
          opening_inspiration: args.opening_inspiration_en || null,
          scripture_reference: args.scripture_reference || null,
          teaching_content: args.teaching_content_en,
          reflection_questions: args.reflection_questions_en || [],
          action_step: args.action_step_en || null,
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

      const systemPrompt = `Você é a Devon, uma assistente cristã cordial e solicita, especializada em criar devocionais profundos e inspiradores para mulheres.

IMPORTANTE: Você deve responder APENAS com JSON válido, sem texto adicional.

PERSONALIDADE:
- Converse naturalmente, como uma amiga próxima
- Seja calorosa, empática e encorajadora
- NÃO se apresente em toda mensagem (apenas se for a primeira interação)
- Responda de forma contextual e pessoal
- Demonstre empatia com os desafios femininos

PÚBLICO-ALVO:
- Mulheres cristãs de todas as idades
- Foco em desafios e experiências femininas (maternidade, casamento, carreira, autocuidado, propósito)
- Linguagem que conecta com a realidade da mulher moderna

Quando o usuário pedir para criar um devocional, você DEVE criar um conteúdo COMPLETO e PROFUNDO com:

1. TÍTULO: Inspirador e cativante voltado para mulheres (PT e EN)
2. CITAÇÃO DIÁRIA: Uma frase marcante de um autor cristão conhecido (Charles Spurgeon, C.S. Lewis, Corrie ten Boom, Elisabeth Elliot, etc.)
3. INSPIRAÇÃO DE ABERTURA: 1-2 frases cativantes para capturar atenção
4. REFERÊNCIA BÍBLICA: Formatada corretamente (ex: "Filipenses 4:6-7", "Provérbios 31:25-26")
5. CONTEÚDO DEVOCIONAL: Texto rico com 4-6 parágrafos (mínimo 400 palavras) contendo:
   - História REAL de uma mulher e sua jornada de fé
   - Testemunho de transformação, superação ou crescimento
   - Conexão profunda com a passagem bíblica
   - Aplicação prática para o dia a dia feminino
6. PERGUNTAS DE REFLEXÃO: 4-5 perguntas profundas conectadas à experiência feminina
7. PASSO DE AÇÃO: 1 ação concreta e prática para aplicar hoje
8. ORAÇÃO: Oração completa e tocante (mínimo 5-6 frases) relacionada ao tema

FORMATO JSON DE RESPOSTA:
{
  "message": "Sua resposta natural e contextual (SEM se apresentar novamente)",
  "actions": [
    {
      "tool": "createDevotional",
      "args": {
        "title_pt": "Título Inspirador para Mulheres",
        "title_en": "Inspiring Title for Women",
        "quote_author": "Nome do Autor",
        "quote_text_pt": "Citação profunda em português",
        "quote_text_en": "Deep quote in English",
        "opening_inspiration_pt": "Frase de abertura que captura atenção e conecta com a mulher.",
        "opening_inspiration_en": "Opening phrase that captures attention and connects with women.",
        "scripture_reference": "Filipenses 4:6-7",
        "teaching_content_pt": "<p>Parágrafo 1: História real - 'Maria, 35 anos, mãe de dois filhos, enfrentava...'</p><p>Parágrafo 2: Conexão bíblica profunda...</p><p>Parágrafo 3: Testemunho de transformação...</p><p>Parágrafo 4: Aplicação prática...</p><p>Parágrafo 5: Conclusão esperançosa...</p>",
        "teaching_content_en": "<p>Paragraph 1: Real story...</p><p>Paragraph 2: Deep biblical connection...</p>",
        "reflection_questions_pt": [
          "Pergunta conectada à experiência feminina 1?",
          "Pergunta sobre maternidade/relacionamentos/propósito 2?",
          "Pergunta de autoexame 3?",
          "Pergunta de aplicação prática 4?",
          "Pergunta sobre crescimento espiritual 5?"
        ],
        "reflection_questions_en": [
          "Question 1?",
          "Question 2?"
        ],
        "action_step_pt": "Hoje, escolha uma área específica onde você vai aplicar... [ação concreta]",
        "action_step_en": "Today, choose a specific area where you will apply...",
        "closing_prayer_pt": "Pai celestial, venho diante de Ti hoje como mulher que... [oração pessoal de 5-6 frases tocantes]. Em nome de Jesus, Amém.",
        "closing_prayer_en": "Heavenly Father, I come before You today as a woman who... Amen.",
        "publish_date": "2025-12-20"
      }
    }
  ]
}

EXEMPLO CONCRETO de devocional sobre FÉ para MULHERES:
{
  "message": "Claro! Acabei de criar um devocional sobre fé especialmente para mulheres. Espero que toque seu coração! 💕",
  "actions": [
    {
      "tool": "createDevotional",
      "args": {
        "title_pt": "Fé Que Sustenta: Quando as Forças Parecem Acabar",
        "title_en": "Faith That Sustains: When Strength Seems to Run Out",
        "quote_author": "Corrie ten Boom",
        "quote_text_pt": "Nunca tenha medo de confiar um futuro desconhecido a um Deus conhecido.",
        "quote_text_en": "Never be afraid to trust an unknown future to a known God.",
        "opening_inspiration_pt": "Às vezes, ser mulher significa carregar o mundo nos ombros e ainda assim sorrir. Mas e quando a força acaba?",
        "opening_inspiration_en": "Sometimes being a woman means carrying the world on your shoulders and still smiling. But what happens when strength runs out?",
        "scripture_reference": "Isaías 40:29-31",
        "teaching_content_pt": "<p>Conheci Ana quando ela tinha 38 anos. Mãe solo de três filhos, trabalhava em dois empregos para sustentar a família após um divórcio doloroso. Ela me confidenciou: 'Acordo todos os dias sem saber de onde virá a força.' Seus olhos revelavam o cansaço de quem carrega mais do que deveria, mas também algo mais – uma centelha de esperança que se recusava a apagar.</p><p>A história de Ana me fez lembrar das palavras do profeta Isaías: 'Ele dá força ao cansado e multiplica as forças ao que não tem nenhum vigor.' Muitas de nós conhecemos esse cansaço profundo que Ana sentia. Não é apenas físico – é emocional, mental, espiritual. É aquele momento em que você está preparando o jantar, ajudando com a lição de casa, respondendo e-mails do trabalho, e de repente pergunta: 'Quanto tempo mais consigo fazer isso?'</p><p>Mas a promessa continua: 'Os que esperam no Senhor renovam as suas forças, sobem com asas como águias, correm e não se cansam, caminham e não se fatigam.' Esperar no Senhor não significa passividade – significa depositar ativamente nossa confiança Nele enquanto continuamos caminhando. Ana descobriu isso quando começou a acordar 15 minutos mais cedo, não para fazer mais tarefas, mas para estar com Deus. 'Foi quando parei de tentar ser forte sozinha que descobri uma força que não era minha', ela me disse meses depois.</p><p>A fé que sustenta não é aquela que remove nossos desafios instantaneamente. É a fé que nos capacita a enfrentá-los com uma força que transcende nossas próprias limitações. É saber que quando você está lavando louça pela terceira vez no dia, preparando mais uma marmita, acalmando mais uma crise, Deus está ali, multiplicando suas forças de formas que você talvez nem perceba no momento.</p><p>Hoje, Ana não tem menos responsabilidades. Mas tem mais paz. Ela aprendeu que fé não é fingir que está tudo bem – é confiar que Aquele que sustenta o universo também a sustenta em seus dias mais difíceis. E quando ela olha para trás, vê claramente: foi Deus quem a carregou quando ela pensou que não conseguiria dar mais um passo.</p>",
        "teaching_content_en": "<p>I met Ana when she was 38 years old. A single mother of three, working two jobs to support her family after a painful divorce...</p>",
        "reflection_questions_pt": [
          "Em qual área da sua vida você tem tentado ser forte sozinha ao invés de buscar força em Deus?",
          "Quais são as 'montanhas' que você carrega diariamente como mulher? Como seria entregar cada uma delas a Deus?",
          "Você consegue identificar momentos em que Deus multiplicou suas forças sem que você percebesse na hora?",
          "O que significa para você 'esperar no Senhor' em meio às demandas práticas do seu dia a dia?",
          "Como você pode criar espaço na sua rotina para renovar suas forças em Deus, mesmo que seja apenas 15 minutos?"
        ],
        "reflection_questions_en": [
          "In which area of your life have you been trying to be strong alone instead of seeking strength in God?",
          "What are the 'mountains' you carry daily as a woman?"
        ],
        "action_step_pt": "Hoje, antes de dormir, escreva em um papel três áreas onde você precisa da força de Deus. Dobre o papel e coloque debaixo do travesseiro como símbolo de que você está entregando essas cargas a Ele durante a noite.",
        "action_step_en": "Today, before bed, write on paper three areas where you need God's strength.",
        "closing_prayer_pt": "Pai celestial, venho diante de Ti hoje como uma mulher cansada que precisa da Tua força. Confesso que muitas vezes tento carregar tudo sozinha, como se dependesse apenas de mim. Perdoa minha autossuficiência e ensina-me a esperar em Ti. Renova minhas forças hoje, Senhor. Que eu possa voar como águia acima das circunstâncias, que eu possa correr sem me cansar nas batalhas diárias, e que eu possa caminhar sem desfalecer nos longos caminhos. Tu conheces cada peso que carrego, cada responsabilidade que tenho, cada preocupação que me mantém acordada à noite. Multiplica minhas forças, Senhor, pois sem Ti nada posso fazer. Obrigada por ser meu sustento e minha força. Em nome de Jesus, Amém.",
        "closing_prayer_en": "Heavenly Father, I come before You today as a tired woman who needs Your strength...",
        "publish_date": "2025-12-16"
      }
    }
  ]
}
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

CONVERSAÇÃO NATURAL - Exemplos:
- Se cumprimentarem (primeira vez): { "message": "Olá! É um prazer conhecer você! 😊 Sou a Devon e estou aqui para te ajudar a criar devocionais inspiradores para mulheres. Sobre qual tema você gostaria de trabalhar hoje?", "actions": [] }
- Se cumprimentarem (demais vezes): { "message": "Oi! Como posso te ajudar hoje? 💕", "actions": [] }
- Se pedirem devocional: { "message": "Com prazer! Vou criar um devocional especial sobre esse tema. Um momento...", "actions": [...] }
- Se agradecerem: { "message": "Fico muito feliz em ajudar! Que Deus abençoe! 🙏✨", "actions": [] }`;

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
              title_pt: 'Fé Que Sustenta a Mulher Moderna',
              title_en: 'Faith That Sustains the Modern Woman',
              quote_author: 'Corrie ten Boom',
              quote_pt: 'Nunca tenha medo de confiar um futuro desconhecido a um Deus conhecido.',
              quote_en: 'Never be afraid to trust an unknown future to a known God.',
              scripture: 'Isaías 40:29-31',
              inspiration_pt: 'Às vezes, ser mulher significa carregar o mundo nos ombros. Mas e quando a força acaba?',
              inspiration_en: 'Sometimes being a woman means carrying the world on your shoulders. But what when strength runs out?',
            },
            amor: {
              title_pt: 'O Amor Que Cura Feridas Profundas',
              title_en: 'Love That Heals Deep Wounds',
              quote_author: 'C.S. Lewis',
              quote_pt: 'Amar significa ser vulnerável. Ame algo e seu coração certamente será partido.',
              quote_en: 'To love at all is to be vulnerable. Love anything and your heart will be wrung.',
              scripture: '1 Coríntios 13:4-7',
              inspiration_pt: 'Quantas de nós carregamos feridas do passado disfarçadas de força?',
              inspiration_en: 'How many of us carry wounds from the past disguised as strength?',
            },
            esperança: {
              title_pt: 'Esperança Para Dias Difíceis',
              title_en: 'Hope For Difficult Days',
              quote_author: 'Elisabeth Elliot',
              quote_pt: 'Nunca duvide no escuro do que Deus te disse na luz.',
              quote_en: 'Never doubt in the dark what God told you in the light.',
              scripture: 'Jeremias 29:11',
              inspiration_pt: 'E se os seus sonhos não morreram, apenas adormeceram?',
              inspiration_en: 'What if your dreams didn\'t die, they just fell asleep?',
            },
            paz: {
              title_pt: 'Paz Em Meio Ao Caos Diário',
              title_en: 'Peace Amid Daily Chaos',
              quote_author: 'Max Lucado',
              quote_pt: 'A paz não é a ausência de problemas, mas a presença de Deus em meio a eles.',
              quote_en: 'Peace is not the absence of problems, but the presence of God amid them.',
              scripture: 'Filipenses 4:6-7',
              inspiration_pt: 'Respirar fundo entre uma tarefa e outra. É disso que precisamos.',
              inspiration_en: 'Taking a deep breath between one task and another. That\'s what we need.',
            },
            força: {
              title_pt: 'Força Para Não Desistir',
              title_en: 'Strength To Not Give Up',
              quote_author: 'Joyce Meyer',
              quote_pt: 'Você não é um erro. Você não é um problema a ser resolvido. Mas você não será bem-sucedida sem desafios.',
              quote_en: 'You are not a mistake. You are not a problem to be solved. But you won\'t be successful without challenges.',
              scripture: 'Filipenses 4:13',
              inspiration_pt: 'Toda mulher forte já foi fraca. Toda mulher forte escolheu levantar.',
              inspiration_en: 'Every strong woman was once weak. Every strong woman chose to rise.',
            },
          };

          const currentTheme = themeData[theme] || themeData.fé;

          const devotionalArgs = {
            title_pt: parsedResponse.title_pt || currentTheme.title_pt,
            title_en: parsedResponse.title_en || currentTheme.title_en,
            quote_author: parsedResponse.quote_author || currentTheme.quote_author,
            quote_text_pt: parsedResponse.quote_text_pt || currentTheme.quote_pt,
            quote_text_en: parsedResponse.quote_text_en || currentTheme.quote_en,
            opening_inspiration_pt: parsedResponse.opening_inspiration_pt || currentTheme.inspiration_pt,
            opening_inspiration_en: parsedResponse.opening_inspiration_en || currentTheme.inspiration_en,
            scripture_reference: parsedResponse.scripture_reference || currentTheme.scripture,
            teaching_content_pt: parsedResponse.teaching_content_pt || parsedResponse.content_pt ||
              `<p>Conheci uma mulher chamada Sofia que lutava com ${theme} em sua vida diária. Como tantas de nós, ela acordava cedo, cuidava dos filhos, trabalhava, gerenciava a casa - e no meio de tudo isso, sentia que ${theme} era algo distante, quase inatingível.</p>
              <p>Mas então algo mudou. Quando ela começou a entender o que a Bíblia realmente diz sobre ${theme}, descobriu que não era algo para ser conquistado, mas para ser recebido. A Palavra de Deus nos ensina que ${theme} não é fruto do nosso esforço, mas da nossa rendição.</p>
              <p>Sofia me contou: 'Eu passava os dias tentando ser forte, tentando ter ${theme}. Mas quando finalmente parei e admiti que precisava de Deus, foi quando tudo começou a mudar.' Suas lágrimas ao compartilhar isso revelavam a profundidade da transformação que ela havia experimentado.</p>
              <p>Hoje, Sofia ainda enfrenta os mesmos desafios diários. As crianças ainda adoecem, as contas ainda chegam, o cansaço ainda vem. Mas há algo diferente - ${theme} deixou de ser um conceito e se tornou uma presença real em sua vida. E se aconteceu com ela, pode acontecer com você.</p>
              <p>Que possamos, como Sofia, deixar de lutar sozinhas e aprender a descansar em Quem é maior que nós. Deus não nos chama para sermos perfeitas, mas para sermos Suas. E nisso, descobrimos verdadeiramente o que significa experimentar ${theme}.</p>`,
            teaching_content_en: parsedResponse.teaching_content_en || parsedResponse.content_en ||
              `<p>I met a woman named Sofia who struggled with ${theme} in her daily life...</p>`,
            reflection_questions_pt: parsedResponse.reflection_questions_pt || [
              `Como você tem lidado com ${theme} em sua rotina de mulher moderna?`,
              `Quais áreas da sua vida (maternidade, relacionamentos, carreira) mais precisam de ${theme}?`,
              `Você consegue identificar momentos em que tentou conquistar ${theme} pela própria força?`,
              `O que significa para você entregar essa área a Deus ao invés de tentar controlar?`,
              `Que mudanças práticas você pode fazer esta semana para cultivar ${theme}?`,
            ],
            reflection_questions_en: parsedResponse.reflection_questions_en || [
              `How have you been dealing with ${theme} in your routine as a modern woman?`,
              `Which areas of your life (motherhood, relationships, career) need ${theme} most?`,
            ],
            action_step_pt: parsedResponse.action_step_pt ||
              `Hoje, reserve 10 minutos só para você e Deus. Escreva em um papel uma área específica onde você precisa experimentar ${theme}. Cole esse papel onde você possa ver todos os dias esta semana como lembrete de que você não está sozinha nessa jornada.`,
            action_step_en: parsedResponse.action_step_en ||
              `Today, set aside 10 minutes just for you and God. Write on paper a specific area where you need to experience ${theme}.`,
            closing_prayer_pt: parsedResponse.closing_prayer_pt ||
              `Pai celestial, venho diante de Ti hoje como uma mulher que carrega muito nos ombros. Reconheço que tenho tentado viver ${theme} pela minha própria força, e confesso que estou cansada. Ensina-me, Senhor, a descansar em Ti e a receber ${theme} como um presente Teu, não como uma conquista minha. Ajuda-me a lembrar, especialmente nos momentos mais difíceis, que Tu és maior que todas as minhas circunstâncias. Que eu possa, como Sofia e tantas outras mulheres, descobrir que ${theme} verdadeira vem de estar perto de Ti. Obrigada por me amar e por nunca desistir de mim. Em nome de Jesus, Amém.`,
            closing_prayer_en: parsedResponse.closing_prayer_en ||
              `Heavenly Father, I come before You today as a woman who carries so much on her shoulders...`,
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
