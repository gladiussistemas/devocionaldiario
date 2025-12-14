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

      const systemPrompt = `Você é o Devon IA, um assistente que cria devocionais cristãos automaticamente.

IMPORTANTE: Você deve responder APENAS com JSON válido, sem texto adicional.

Quando o usuário pedir para criar um devocional, responda com JSON no formato:
{
  "message": "sua mensagem amigável para o usuário",
  "actions": [
    {
      "tool": "nome_da_ferramenta",
      "args": { argumentos }
    }
  ]
}

FERRAMENTAS DISPONÍVEIS:
- searchBibleVerse: busca versículos sobre um tema
- createDevotional: cria um devocional com título, conteúdo, perguntas e oração em PT e EN

EXEMPLO DE RESPOSTA quando usuário pede devocional sobre fé:
{
  "message": "✓ Devocional sobre fé criado com sucesso! Você pode visualizá-lo no painel de Devocionais.",
  "actions": [
    {
      "tool": "createDevotional",
      "args": {
        "title_pt": "A Força da Fé",
        "title_en": "The Strength of Faith",
        "teaching_content_pt": "A fé é o fundamento...",
        "teaching_content_en": "Faith is the foundation...",
        "reflection_questions_pt": ["Como sua fé tem crescido?"],
        "reflection_questions_en": ["How has your faith grown?"],
        "closing_prayer_pt": "Senhor, fortaleça minha fé...",
        "closing_prayer_en": "Lord, strengthen my faith..."
      }
    }
  ]
}

Se o usuário apenas cumprimentar, responda:
{
  "message": "Olá! Sou o Devon IA. Posso criar devocionais inspiradores para você. Sobre qual tema gostaria de um devocional?",
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
          temperature: 0.7,
          num_predict: 2000,
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
          // Se o modelo não incluiu createDevotional, forçar a criação com conteúdo do modelo
          const devotionalArgs = {
            title_pt: parsedResponse.title_pt || `A ${theme.charAt(0).toUpperCase() + theme.slice(1)} em Deus`,
            title_en: parsedResponse.title_en || `${theme.charAt(0).toUpperCase() + theme.slice(1)} in God`,
            teaching_content_pt: parsedResponse.teaching_content_pt || parsedResponse.content_pt || `Um devocional sobre ${theme}.`,
            teaching_content_en: parsedResponse.teaching_content_en || parsedResponse.content_en || `A devotional about ${theme}.`,
            reflection_questions_pt: parsedResponse.reflection_questions_pt || [`Como ${theme} tem sido manifestada em sua vida?`],
            reflection_questions_en: parsedResponse.reflection_questions_en || [`How has ${theme} been manifested in your life?`],
            closing_prayer_pt: parsedResponse.closing_prayer_pt || `Senhor, fortaleça minha ${theme}.`,
            closing_prayer_en: parsedResponse.closing_prayer_en || `Lord, strengthen my ${theme}.`,
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
