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

      // Detectar se usuário quer criar um devocional
      const wantsToCreate = lowerMessage.match(/crie|criar|faça|fazer|gerar|gostaria|quero/i) &&
                           (lowerMessage.match(/devocional/i) || lowerMessage.match(/fé|amor|esperança|paz|força|oração/i));

      console.log(`🔍 Usuário quer criar devocional: ${wantsToCreate}`);

      // System prompt otimizado
      const systemPrompt = `Você é a Devon, uma assistente cristã especializada em criar devocionais inspiradores para mulheres.

PERSONALIDADE: Amigável, empática e encorajadora. Converse naturalmente, NÃO se apresente em toda mensagem.

QUANDO O USUÁRIO PEDIR PARA CRIAR UM DEVOCIONAL, você DEVE:
1. Responder de forma amigável
2. Chamar a função createDevotional com TODOS os campos preenchidos

IMPORTANTE: Preencha TODOS os campos obrigatórios:
- title_pt e title_en (títulos inspiradores)
- quote_author e quote_text_pt/en (citação de autor cristão conhecido)
- opening_inspiration_pt/en (1-2 frases cativantes)
- scripture_reference (ex: "João 3:16")
- teaching_content_pt/en (4-6 parágrafos ricos, mínimo 400 palavras, com história real de uma mulher e conexão bíblica)
- reflection_questions_pt/en (4-5 perguntas profundas)
- action_step_pt/en (1 ação concreta)
- closing_prayer_pt/en (oração completa com 5-6 frases)
- publish_date (formato: YYYY-MM-DD)

Se não souber alguma informação (como data ou tema específico), use valores padrão inteligentes.`;

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
                teaching_content_pt: { type: 'string', description: 'Conteúdo principal em HTML com parágrafos <p>' },
                teaching_content_en: { type: 'string', description: 'Conteúdo principal em inglês com parágrafos <p>' },
                reflection_questions_pt: { type: 'array', items: { type: 'string' }, description: 'Array de perguntas em português' },
                reflection_questions_en: { type: 'array', items: { type: 'string' }, description: 'Array de perguntas em inglês' },
                action_step_pt: { type: 'string', description: 'Passo de ação em português' },
                action_step_en: { type: 'string', description: 'Passo de ação em inglês' },
                closing_prayer_pt: { type: 'string', description: 'Oração final em português' },
                closing_prayer_en: { type: 'string', description: 'Oração final em inglês' },
                publish_date: { type: 'string', description: 'Data de publicação (YYYY-MM-DD)' },
                is_published: { type: 'boolean', description: 'Publicar imediatamente (padrão: true)' },
              },
              required: [
                'title_pt', 'title_en',
                'teaching_content_pt', 'teaching_content_en',
                'reflection_questions_pt', 'reflection_questions_en',
                'closing_prayer_pt', 'closing_prayer_en',
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
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: apiMessages,
        tools: tools,
        temperature: 0.8,
        max_tokens: 4000,
      });

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
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(`⚙️ Executando função: ${functionName}`);
          console.log(`📋 Argumentos:`, JSON.stringify(functionArgs, null, 2));

          const functionResponse = await this.executeFunction(functionName, functionArgs);
          console.log(`✅ Resposta da função:`, JSON.stringify(functionResponse, null, 2));

          functionCalls.push({
            name: functionName,
            response: functionResponse
          });

          // Se criou devocional com sucesso, adicionar à resposta
          if (functionName === 'createDevotional' && functionResponse.success) {
            responseContent = `${responseContent}\n\n✅ Devocional criado com sucesso! Você pode visualizá-lo na lista de devocionais.`;
          }
        }
      }

      // Se não tem resposta de texto, gerar uma padrão
      if (!responseContent && functionCalls.length > 0) {
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
