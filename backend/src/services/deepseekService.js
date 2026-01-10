const OpenAI = require('openai');
const { supabase } = require('../config/database');

class DeepSeekService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1',
    });
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
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

      console.log(`✅ Devocional criado com ID: ${devotional.id}`);

      // Criar conteúdo em português
      const { error: contentPtError } = await supabase
        .from('devotional_contents')
        .insert([{
          devotional_id: devotional.id,
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
      console.log('✅ Conteúdo em português criado');

      // Criar conteúdo em inglês
      const { error: contentEnError } = await supabase
        .from('devotional_contents')
        .insert([{
          devotional_id: devotional.id,
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
      console.log('✅ Conteúdo em inglês criado');

      // Criar referência bíblica se fornecida
      if (args.scripture_reference) {
        const { error: bibleRefError } = await supabase
          .from('biblical_references')
          .insert([{
            devotional_id: devotional.id,
            reference: args.scripture_reference,
            is_main: true,
          }]);

        if (bibleRefError) {
          console.warn('⚠️ Erro ao criar referência bíblica:', bibleRefError);
        } else {
          console.log('✅ Referência bíblica criada');
        }
      }

      return {
        success: true,
        devotional_id: devotional.id,
        slug: slug,
        message: `Devocional "${args.title_pt}" criado com sucesso! ID: ${devotional.id}`,
      };
    } catch (error) {
      console.error('Error creating devotional:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Implementação: Listar devocionais
  async listDevotionals(args) {
    try {
      const limit = args.limit || 10;
      let query = supabase
        .from('devotionals')
        .select(`
          id,
          slug,
          publish_date,
          day_number,
          is_published,
          devotional_contents(language, title)
        `)
        .order('publish_date', { ascending: false })
        .limit(limit);

      if (args.is_published !== undefined) {
        query = query.eq('is_published', args.is_published);
      }

      const { data: devotionals, error } = await query;

      if (error) throw error;

      return {
        success: true,
        devotionals: devotionals.map(d => ({
          id: d.id,
          slug: d.slug,
          publish_date: d.publish_date,
          day_number: d.day_number,
          is_published: d.is_published,
          title_pt: d.devotional_contents?.find(c => c.language === 'pt')?.title,
          title_en: d.devotional_contents?.find(c => c.language === 'en')?.title,
        })),
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
      console.log('🤖 Devon IA: Iniciando chat com DeepSeek');
      console.log(`🎯 Modelo: ${this.model}`);

      const lastUserMessage = messages[messages.length - 1].content;
      const lowerMessage = lastUserMessage.toLowerCase();

      // Detectar se usuário quer criar um devocional - regex mais abrangente
      const creationVerbs = /cri[ea]r?|fa[çz][ao]?|fazer|ger[ae]r?|gostaria|quero|preciso|pode|poderia|elabor[ae]|produz|escreva?|desenvolv|mont[ae]/i;
      const devotionalTerms = /devocional|devociona[il]s|medita[çc][ãa]o|reflexão|reflexao|conte[úu]do/i;
      const themeTerms = /fé|fe|amor|esperança|esperanca|paz|força|forca|oração|oracao|gratidão|gratidao|perservança|perseverança|humildade|sabedoria|confiança|confianca|alegria|perdão|perdao|graça|graca/i;

      const hasCreationVerb = creationVerbs.test(lowerMessage);
      const hasDevotionalTerm = devotionalTerms.test(lowerMessage);
      const hasThemeTerm = themeTerms.test(lowerMessage);

      // Quer criar se: (verbo de criação + termo devocional) OU (verbo de criação + tema + contexto de devocional implícito)
      const wantsToCreate = hasCreationVerb && (hasDevotionalTerm || hasThemeTerm);

      // Detectar quantidade de devocionais a criar
      let quantityToCreate = 1;
      const quantityMatch = lowerMessage.match(/(\d+)\s*(?:devociona|medita|reflex)/i);
      if (quantityMatch) {
        quantityToCreate = parseInt(quantityMatch[1]);
      }
      // Também detectar por extenso
      const quantityWords = { 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'três': 3, 'tres': 3, 'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10 };
      for (const [word, num] of Object.entries(quantityWords)) {
        if (lowerMessage.includes(`${word} devociona`) || lowerMessage.includes(`${word} medita`)) {
          quantityToCreate = num;
          break;
        }
      }

      console.log(`🔍 Usuário quer criar devocional: ${wantsToCreate} (verbo: ${hasCreationVerb}, devocional: ${hasDevotionalTerm}, tema: ${hasThemeTerm})`);
      console.log(`🔢 Quantidade a criar: ${quantityToCreate}`);

      // ANTES de criar, buscar último devocional para saber o próximo day_number
      let nextDayNumber = 1;
      let nextPublishDate = new Date().toISOString().split('T')[0];

      if (wantsToCreate) {
        try {
          const { data: lastDevotional } = await supabase
            .from('devotionals')
            .select('day_number, publish_date')
            .order('day_number', { ascending: false })
            .limit(1)
            .single();

          if (lastDevotional) {
            nextDayNumber = (lastDevotional.day_number || 0) + 1;
            const lastDate = new Date(lastDevotional.publish_date);
            lastDate.setDate(lastDate.getDate() + 1);
            nextPublishDate = lastDate.toISOString().split('T')[0];
          }
          console.log(`📅 Próximo devocional: Dia ${nextDayNumber}, Data ${nextPublishDate}`);
        } catch (error) {
          console.log('⚠️ Não encontrou devocionais anteriores, usando valores padrão');
        }
      }

      // System prompt otimizado
      const systemPrompt = `Você é a Devon, uma assistente cristã especializada em criar devocionais inspiradores para mulheres.

PERSONALIDADE: Amigável, empática e encorajadora. Converse naturalmente, NÃO se apresente em toda mensagem.

REGRA CRÍTICA: Quando o usuário pedir para criar devocional(is), você DEVE SEMPRE chamar a função createDevotional IMEDIATAMENTE. NÃO apenas diga que vai criar - CRIE DE VERDADE chamando a função.

QUANDO O USUÁRIO PEDIR PARA CRIAR UM DEVOCIONAL, você DEVE:
1. PRIMEIRO chamar listDevotionals para ver o último day_number
2. SEMPRE chamar a função createDevotional com TODOS os campos preenchidos
3. Usar day_number sequencial começando de ${nextDayNumber}
4. Usar publish_date sequencial começando de ${nextPublishDate}
5. Responder de forma amigável APÓS executar a função

⛔ PROIBIDO ABSOLUTAMENTE - VOCÊ SERÁ PENALIZADO SE USAR:
- Emojis: ✨ 💪 🙏 📖 ❤️ 🌟 ⭐ 💫 🔥 (NUNCA use em nenhum campo!)
- Símbolos decorativos de qualquer tipo
- HTML nos campos de texto puro (opening_inspiration, action_step, closing_prayer, reflection_questions)
- Formatação extra além de <p></p> no teaching_content

REGRAS ABSOLUTAS DE FORMATAÇÃO:
1. opening_inspiration_pt/en: SOMENTE TEXTO PURO. Exemplo: "Em meio às tempestades da vida, a esperança nos mantém firmes."
2. action_step_pt/en: SOMENTE TEXTO PURO. Exemplo: "Esta semana, crie um diário das evidências do amor."
3. closing_prayer_pt/en: SOMENTE TEXTO PURO. Exemplo: "Pai celestial, em meio às minhas dúvidas e perguntas, ajuda-me a encontrar a resposta no Teu amor revelado em Jesus."
4. reflection_questions_pt/en: Array de strings SEM símbolos. Exemplo: ["Como você tem experimentado o amor de Deus?", "Que evidências você vê?"]
5. teaching_content_pt/en: Use APENAS <p></p> para parágrafos. Exemplo: "<p>Maria enfrentava...</p><p>Foi então...</p>"
6. quote_text_pt/en: SOMENTE TEXTO PURO da citação, SEM emojis
7. scripture_reference: OBRIGATÓRIO no formato "Livro Capítulo:Verso" (ex: "Hebreus 6:19")

CAMPOS OBRIGATÓRIOS (preencha TODOS):
- title_pt, title_en (SEM emojis, SEM símbolos)
- quote_author (autor cristão conhecido como "Charles Spurgeon")
- quote_text_pt, quote_text_en (citação inspiradora SEM emojis)
- opening_inspiration_pt, opening_inspiration_en (texto puro)
- scripture_reference (OBRIGATÓRIO! Ex: "Hebreus 6:19")
- teaching_content_pt, teaching_content_en (4-6 parágrafos com <p>)
- reflection_questions_pt, reflection_questions_en (array de 4-5 perguntas)
- action_step_pt, action_step_en (texto puro)
- closing_prayer_pt, closing_prayer_en (oração com 5-6 frases)
- day_number (próximo número da sequência: ${nextDayNumber})
- publish_date (próxima data: ${nextPublishDate})

EXEMPLO PERFEITO (COPIE EXATAMENTE ESTE PADRÃO):
{
  "title_pt": "A Força da Esperança",
  "title_en": "The Strength of Hope",
  "quote_author": "Charles Spurgeon",
  "quote_text_pt": "A esperança é a âncora da alma",
  "quote_text_en": "Hope is the anchor of the soul",
  "opening_inspiration_pt": "Em meio às tempestades da vida, a esperança nos mantém firmes.",
  "opening_inspiration_en": "Amid life's storms, hope keeps us steadfast.",
  "scripture_reference": "Hebreus 6:19",
  "teaching_content_pt": "<p>Ana enfrentava uma das maiores crises de sua vida.</p><p>Foi então que seus olhos encontraram Hebreus 6:19.</p>",
  "teaching_content_en": "<p>Ana faced one of the greatest crises of her life.</p><p>It was then that her eyes found Hebrews 6:19.</p>",
  "reflection_questions_pt": ["Como você tem experimentado o amor de Deus?", "Que evidências você vê?"],
  "reflection_questions_en": ["How have you experienced God's love?", "What evidence do you see?"],
  "action_step_pt": "Esta semana, crie um diário das evidências do amor.",
  "action_step_en": "This week, create a diary of love evidences.",
  "closing_prayer_pt": "Pai celestial, em meio às minhas dúvidas e perguntas, ajuda-me a encontrar a resposta no Teu amor revelado em Jesus.",
  "closing_prayer_en": "Heavenly Father, amid my doubts and questions, help me find the answer in Your love revealed in Jesus.",
  "day_number": ${nextDayNumber},
  "publish_date": "${nextPublishDate}"
}

CRÍTICO: Os campos _pt DEVEM estar em PORTUGUÊS. Os campos _en DEVEM estar em INGLÊS.`;

      // Construir mensagens para a API
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      ];

      // Definir tools (funções)
      const tools = [
        {
          type: 'function',
          function: {
            name: 'createDevotional',
            description: 'Cria um novo devocional no banco de dados com conteúdo em português e inglês',
            parameters: {
              type: 'object',
              properties: {
                title_pt: { type: 'string', description: 'Título em português' },
                title_en: { type: 'string', description: 'Título em inglês' },
                quote_author: { type: 'string', description: 'Autor da citação (ex: Charles Spurgeon)' },
                quote_text_pt: { type: 'string', description: 'Texto da citação em português' },
                quote_text_en: { type: 'string', description: 'Texto da citação em inglês' },
                opening_inspiration_pt: { type: 'string', description: 'Frase de abertura em português' },
                opening_inspiration_en: { type: 'string', description: 'Frase de abertura em inglês' },
                scripture_reference: { type: 'string', description: 'Referência bíblica (ex: João 3:16)' },
                teaching_content_pt: { type: 'string', description: 'Conteúdo principal EM PORTUGUÊS com parágrafos <p>. DEVE estar em português.' },
                teaching_content_en: { type: 'string', description: 'Conteúdo principal EM INGLÊS com parágrafos <p>. DEVE estar em inglês.' },
                reflection_questions_pt: { type: 'array', items: { type: 'string' }, description: 'Array de perguntas EM PORTUGUÊS. DEVE estar em português.' },
                reflection_questions_en: { type: 'array', items: { type: 'string' }, description: 'Array de perguntas EM INGLÊS. DEVE estar em inglês.' },
                action_step_pt: { type: 'string', description: 'Passo de ação EM PORTUGUÊS. DEVE estar em português.' },
                action_step_en: { type: 'string', description: 'Passo de ação EM INGLÊS. DEVE estar em inglês.' },
                closing_prayer_pt: { type: 'string', description: 'Oração final EM PORTUGUÊS. DEVE estar em português.' },
                closing_prayer_en: { type: 'string', description: 'Oração final EM INGLÊS. DEVE estar em inglês.' },
                day_number: { type: 'number', description: 'Número do dia no plano (ex: 1, 2, 3, etc.). OBRIGATÓRIO.' },
                publish_date: { type: 'string', description: 'Data de publicação (YYYY-MM-DD)' },
                is_published: { type: 'boolean', description: 'Publicar imediatamente (padrão: true)' },
              },
              required: [
                'title_pt', 'title_en',
                'teaching_content_pt', 'teaching_content_en',
                'reflection_questions_pt', 'reflection_questions_en',
                'closing_prayer_pt', 'closing_prayer_en',
                'day_number',
              ],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'listDevotionals',
            description: 'Lista os devocionais existentes no banco de dados',
            parameters: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: 'Número máximo de devocionais (padrão: 10)' },
                is_published: { type: 'boolean', description: 'Filtrar por status de publicação' },
              },
            },
          },
        },
      ];

      console.log('📤 Enviando requisição ao DeepSeek...');

      // Se o usuário quer criar múltiplos devocionais, fazer múltiplas chamadas à API
      if (wantsToCreate && quantityToCreate > 1) {
        console.log(`🔁 Criando ${quantityToCreate} devocionais únicos...`);
        const functionCalls = [];
        const createdDevotionals = [];

        for (let i = 0; i < quantityToCreate; i++) {
          const currentDayNumber = nextDayNumber + i;
          const currentDate = new Date(nextPublishDate);
          currentDate.setDate(currentDate.getDate() + i);
          const currentPublishDate = currentDate.toISOString().split('T')[0];

          // Atualizar o system prompt para cada devocional com dia/data corretos
          const iterationSystemPrompt = systemPrompt
            .replace(new RegExp(`day_number: ${nextDayNumber}`, 'g'), `day_number: ${currentDayNumber}`)
            .replace(new RegExp(`"day_number": ${nextDayNumber}`, 'g'), `"day_number": ${currentDayNumber}`)
            .replace(new RegExp(nextPublishDate, 'g'), currentPublishDate);

          const iterationMessages = [
            { role: 'system', content: iterationSystemPrompt },
            { role: 'user', content: `Crie o devocional número ${i + 1} de ${quantityToCreate}. Use day_number ${currentDayNumber} e publish_date ${currentPublishDate}. ${lastUserMessage}` }
          ];

          console.log(`⚙️ Gerando devocional ${i + 1}/${quantityToCreate} (Dia ${currentDayNumber}, Data ${currentPublishDate})`);

          try {
            const iterationResponse = await this.client.chat.completions.create({
              model: this.model,
              messages: iterationMessages,
              tools: tools,
              tool_choice: { type: 'function', function: { name: 'createDevotional' } },
              temperature: 0.9, // Mais variação para conteúdos únicos
              max_tokens: 4000,
            });

            const iterationAssistantMessage = iterationResponse.choices[0].message;
            const iterationToolCalls = iterationAssistantMessage.tool_calls;

            if (iterationToolCalls && iterationToolCalls.length > 0) {
              const toolCall = iterationToolCalls[0];
              const functionArgs = JSON.parse(toolCall.function.arguments);

              // Garantir que day_number e publish_date estão corretos
              functionArgs.day_number = currentDayNumber;
              functionArgs.publish_date = currentPublishDate;

              console.log(`📋 Devocional ${i + 1}: "${functionArgs.title_pt}"`);

              const functionResponse = await this.executeFunction('createDevotional', functionArgs);

              if (functionResponse.success) {
                createdDevotionals.push({
                  title: functionArgs.title_pt,
                  day_number: currentDayNumber,
                  id: functionResponse.devotional_id
                });
              }

              functionCalls.push({
                name: 'createDevotional',
                response: functionResponse
              });
            }
          } catch (iterError) {
            console.error(`❌ Erro ao criar devocional ${i + 1}:`, iterError.message);
          }

          // Pequeno delay para evitar rate limiting
          if (i < quantityToCreate - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        const successCount = createdDevotionals.length;
        let responseContent = '';

        if (successCount === quantityToCreate) {
          responseContent = `Pronto! Criei ${successCount} devocionais com sucesso:\n\n`;
          createdDevotionals.forEach((d, idx) => {
            responseContent += `${idx + 1}. "${d.title}" (Dia ${d.day_number})\n`;
          });
          responseContent += `\nVocê pode visualizá-los na lista de devocionais.`;
        } else if (successCount > 0) {
          responseContent = `Criei ${successCount} de ${quantityToCreate} devocionais:\n\n`;
          createdDevotionals.forEach((d, idx) => {
            responseContent += `${idx + 1}. "${d.title}" (Dia ${d.day_number})\n`;
          });
          responseContent += `\nAlguns devocionais não puderam ser criados. Tente novamente para os restantes.`;
        } else {
          responseContent = `Não consegui criar os devocionais. Por favor, tente novamente.`;
        }

        return {
          role: 'assistant',
          content: responseContent,
          functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
        };
      }

      // Caso normal: criar apenas 1 devocional ou outra ação
      const requestConfig = {
        model: this.model,
        messages: apiMessages,
        tools: tools,
        temperature: 0.8,
        max_tokens: 4000,
      };

      // Se detectamos que quer criar, forçar uso da ferramenta
      if (wantsToCreate) {
        requestConfig.tool_choice = { type: 'function', function: { name: 'createDevotional' } };
        console.log('🎯 Forçando uso da função createDevotional');
      }

      const response = await this.client.chat.completions.create(requestConfig);

      console.log('✅ Resposta recebida do DeepSeek');

      const assistantMessage = response.choices[0].message;
      const toolCalls = assistantMessage.tool_calls;

      let responseContent = assistantMessage.content || '';
      const functionCalls = [];

      // Se o modelo chamou funções, executar
      if (toolCalls && toolCalls.length > 0) {
        console.log(`🔧 Executando ${toolCalls.length} função(ões)...`);

        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          let functionArgs;

          try {
            functionArgs = JSON.parse(toolCall.function.arguments);
          } catch (parseError) {
            console.error('❌ Erro ao parsear argumentos da função:', parseError);
            continue;
          }

          console.log(`⚙️ Executando função: ${functionName}`);
          console.log(`📋 Argumentos:`, JSON.stringify(functionArgs, null, 2));

          const functionResponse = await this.executeFunction(functionName, functionArgs);
          console.log(`✅ Resposta da função:`, JSON.stringify(functionResponse, null, 2));

          functionCalls.push({
            name: functionName,
            response: functionResponse
          });

          // Se criou devocional com sucesso, adicionar à resposta
          if (functionName === 'createDevotional') {
            if (functionResponse.success) {
              responseContent = `Pronto! Criei o devocional "${functionArgs.title_pt}" com sucesso!\n\nO devocional foi agendado para o Dia ${functionArgs.day_number}.\n\nVocê pode visualizá-lo na lista de devocionais.`;
            } else {
              responseContent = `Houve um erro ao criar o devocional: ${functionResponse.error || 'Erro desconhecido'}. Por favor, tente novamente.`;
            }
          } else if (functionName === 'listDevotionals') {
            if (functionResponse.success && functionResponse.devotionals) {
              responseContent = `Encontrei ${functionResponse.count} devocional(is):\n\n`;
              functionResponse.devotionals.forEach((d, idx) => {
                responseContent += `${idx + 1}. "${d.title_pt || 'Sem título'}" - Dia ${d.day_number || 'N/A'} (${d.publish_date})\n`;
              });
            }
          }
        }
      }

      // Se não tem resposta de texto e nem função foi chamada, algo deu errado
      if (!responseContent && functionCalls.length === 0) {
        responseContent = 'Desculpe, não consegui processar sua solicitação. Pode reformular o pedido?';
      } else if (!responseContent && functionCalls.length > 0) {
        responseContent = 'Pronto! Executei as ações solicitadas.';
      }

      return {
        role: 'assistant',
        content: responseContent,
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
      };
    } catch (error) {
      console.error('❌ DeepSeek chat error:', error);
      throw new Error(`Falha ao comunicar com DeepSeek: ${error.message}`);
    }
  }
}

module.exports = new DeepSeekService();
