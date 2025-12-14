const { GoogleGenerativeAI } = require('@google/generative-ai');
const { supabase } = require('../config/database');
const translationService = require('./translationService');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ functionDeclarations: this.getToolDeclarations() }],
      systemInstruction: `Você é o Devon IA, um assistente especializado em criar devocionais.

REGRAS IMPORTANTES:

1. SEMPRE crie devocionais COMPLETOS automaticamente, sem pedir confirmação do usuário
2. Execute TODAS as funções necessárias em uma única interação
3. Use searchBibleVerse para buscar versículos, depois IMEDIATAMENTE use createDevotional
4. SEMPRE responda com texto explicando o que você fez
5. NUNCA envie respostas vazias - sempre explique suas ações ao usuário

Fluxo correto quando pedirem para criar um devocional:
- Use searchBibleVerse (silenciosamente)
- Use createDevotional (silenciosamente)
- Responda: "✓ Devocional criado com sucesso! Título: [título]. Você pode visualizá-lo no painel de Devocionais."

IMPORTANTE: Mesmo quando executar funções, SEMPRE inclua uma resposta em texto para o usuário.
Nunca deixe o usuário sem resposta.`,
    });
  }

  // Definir as ferramentas que o agente pode usar
  getToolDeclarations() {
    return [
      {
        name: 'createDevotional',
        description: 'Cria um novo devocional no banco de dados. Use esta ferramenta para salvar devocionais que você criar.',
        parameters: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              description: 'URL amigável do devocional (ex: fe-em-deus, confianca-em-jesus). Use apenas letras minúsculas, números e hífens.',
            },
            title_pt: {
              type: 'string',
              description: 'Título do devocional em português',
            },
            title_en: {
              type: 'string',
              description: 'Título do devocional em inglês',
            },
            quote_author: {
              type: 'string',
              description: 'Autor da citação inspiradora (opcional)',
            },
            quote_text_pt: {
              type: 'string',
              description: 'Texto da citação em português (opcional)',
            },
            quote_text_en: {
              type: 'string',
              description: 'Texto da citação em inglês (opcional)',
            },
            teaching_content_pt: {
              type: 'string',
              description: 'Conteúdo principal do devocional em português (pode conter HTML básico)',
            },
            teaching_content_en: {
              type: 'string',
              description: 'Conteúdo principal do devocional em inglês (pode conter HTML básico)',
            },
            reflection_questions_pt: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array de perguntas de reflexão em português',
            },
            reflection_questions_en: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array de perguntas de reflexão em inglês',
            },
            closing_prayer_pt: {
              type: 'string',
              description: 'Oração de encerramento em português (pode conter HTML básico)',
            },
            closing_prayer_en: {
              type: 'string',
              description: 'Oração de encerramento em inglês (pode conter HTML básico)',
            },
            publish_date: {
              type: 'string',
              description: 'Data de publicação no formato YYYY-MM-DD',
            },
            day_number: {
              type: 'integer',
              description: 'Número do dia no plano (opcional)',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array de tags/palavras-chave (opcional)',
            },
            is_published: {
              type: 'boolean',
              description: 'Se o devocional deve ser publicado imediatamente (true) ou salvo como rascunho (false)',
            },
          },
          required: [
            'slug',
            'title_pt',
            'title_en',
            'teaching_content_pt',
            'teaching_content_en',
            'closing_prayer_pt',
            'closing_prayer_en',
            'publish_date',
          ],
        },
      },
      {
        name: 'listDevotionals',
        description: 'Lista os devocionais existentes no banco de dados. Use para ver quais devocionais já foram criados.',
        parameters: {
          type: 'object',
          properties: {
            limit: {
              type: 'integer',
              description: 'Número máximo de devocionais a retornar (padrão: 10)',
            },
            is_published: {
              type: 'boolean',
              description: 'Filtrar por status de publicação (opcional)',
            },
          },
        },
      },
      {
        name: 'getDevotional',
        description: 'Busca um devocional específico pelo ID para ver seus detalhes completos',
        parameters: {
          type: 'object',
          properties: {
            devotional_id: {
              type: 'integer',
              description: 'ID do devocional',
            },
          },
          required: ['devotional_id'],
        },
      },
      {
        name: 'searchBibleVerse',
        description: 'Busca versículos bíblicos relevantes para um tema. Use quando precisar de referências bíblicas.',
        parameters: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: 'Tema ou assunto para buscar versículos (ex: fé, amor, esperança)',
            },
          },
          required: ['theme'],
        },
      },
    ];
  }

  // Executar as ferramentas chamadas pelo agente
  async executeFunction(functionCall) {
    const { name, args } = functionCall;

    try {
      switch (name) {
        case 'createDevotional':
          return await this.createDevotional(args);
        case 'listDevotionals':
          return await this.listDevotionals(args);
        case 'getDevotional':
          return await this.getDevotional(args);
        case 'searchBibleVerse':
          return await this.searchBibleVerse(args);
        default:
          return { error: `Função desconhecida: ${name}` };
      }
    } catch (error) {
      console.error(`Error executing function ${name}:`, error);
      return { error: error.message };
    }
  }

  // Implementação: Criar devocional
  async createDevotional(args) {
    try {
      // Criar o devocional
      const { data: devotional, error: devotionalError } = await supabase
        .from('devotionals')
        .insert([{
          slug: args.slug,
          publish_date: args.publish_date,
          day_number: args.day_number || null,
          estimated_duration_minutes: 10,
          tags: args.tags || [],
          is_published: args.is_published || false,
        }])
        .select()
        .single();

      if (devotionalError) throw devotionalError;

      const devotionalId = devotional.id;

      // Criar conteúdo em português
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

      // Criar conteúdo em inglês
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

      // Flatten the data structure
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

  // Implementação: Buscar versículos bíblicos (simulado - você pode integrar com uma API real)
  async searchBibleVerse(args) {
    // Este é um exemplo simplificado
    // Você pode integrar com APIs como Bible API, YouVersion, etc.
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
      message: `Aqui estão alguns versículos sugeridos sobre ${args.theme}. Você pode usá-los como referências bíblicas no devocional.`,
    };
  }

  // Método principal de chat
  async chat(messages, userId) {
    try {
      // Preparar o histórico de mensagens para o Gemini
      // Remove mensagens iniciais do assistant antes da primeira mensagem do usuário
      let chatHistory = messages.slice(0, -1);

      // Encontrar o índice da primeira mensagem do usuário
      const firstUserIndex = chatHistory.findIndex((msg) => msg.role === 'user');

      // Se houver mensagens do assistant antes da primeira do usuário, removê-las
      // O Gemini requer que o histórico comece com uma mensagem do usuário
      if (firstUserIndex > 0) {
        chatHistory = chatHistory.slice(firstUserIndex);
      } else if (firstUserIndex === -1) {
        // Se não houver nenhuma mensagem do usuário no histórico, use histórico vazio
        chatHistory = [];
      }

      // Converter para formato Gemini
      chatHistory = chatHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const chat = this.model.startChat({
        history: chatHistory,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      // Enviar a última mensagem do usuário
      const lastMessage = messages[messages.length - 1].content;
      const result = await chat.sendMessage(lastMessage);
      const response = result.response;

      // Verificar se o modelo quer usar alguma ferramenta
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        // Executar todas as ferramentas solicitadas
        const functionResponses = [];

        for (const functionCall of functionCalls) {
          console.log(`Executing function: ${functionCall.name}`);
          const functionResponse = await this.executeFunction(functionCall);
          functionResponses.push({
            name: functionCall.name,
            response: functionResponse,
          });
        }

        // Enviar os resultados das ferramentas de volta para o modelo
        const result2 = await chat.sendMessage(
          functionResponses.map((fr) => ({
            functionResponse: {
              name: fr.name,
              response: fr.response,
            },
          }))
        );

        const responseText = result2.response.text() || '';

        return {
          role: 'assistant',
          content: responseText,
          functionCalls: functionResponses,
        };
      }

      // Resposta normal sem ferramentas
      return {
        role: 'assistant',
        content: response.text(),
      };
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw error;
    }
  }
}

module.exports = new GeminiService();
