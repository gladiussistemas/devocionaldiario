const geminiService = require('../../services/geminiService');
const ollamaService = require('../../services/ollamaService');
const DevonAIConversation = require('../../models/DevonAIConversation');

// Escolher qual serviço usar baseado na variável de ambiente
const aiService = process.env.USE_OLLAMA === 'true' ? ollamaService : geminiService;

/**
 * Chat com Devon IA
 */
async function chat(req, res, next) {
  try {
    const { messages, conversationId } = req.body;
    const userId = req.user.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Messages array is required',
        },
      });
    }

    // Validar formato das mensagens
    for (const msg of messages) {
      if (!msg.role) {
        return res.status(400).json({
          error: {
            code: 'INVALID_MESSAGE_FORMAT',
            message: 'Each message must have role and content',
          },
        });
      }
      // Se não tem content mas tem functionCalls, adicionar content vazio
      if (!msg.content && msg.functionCalls) {
        msg.content = '';
      }
      // Se não tem nem content nem functionCalls, é erro
      if (!msg.content && !msg.functionCalls) {
        return res.status(400).json({
          error: {
            code: 'INVALID_MESSAGE_FORMAT',
            message: 'Each message must have role and content',
          },
        });
      }
    }

    // Se conversationId foi fornecido, verificar se pertence ao usuário
    let conversation;
    if (conversationId) {
      conversation = await DevonAIConversation.findById(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({
          error: {
            code: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation not found',
          },
        });
      }
    } else {
      // Criar nova conversa com título gerado a partir da primeira mensagem do usuário
      const firstUserMessage = messages.find((m) => m.role === 'user');
      const title = firstUserMessage
        ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
        : 'Nova conversa';
      conversation = await DevonAIConversation.create(userId, title);

      if (!conversation) {
        return res.status(500).json({
          error: {
            code: 'CONVERSATION_CREATE_ERROR',
            message: 'Failed to create conversation',
          },
        });
      }
    }

    // Salvar a mensagem do usuário
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role === 'user' && conversation) {
      await DevonAIConversation.addMessage(
        conversation.id,
        'user',
        lastUserMessage.content
      );
    }

    // Processar o chat com AI (Gemini ou Ollama)
    const response = await aiService.chat(messages, userId);

    // Salvar a resposta do assistente
    if (conversation) {
      await DevonAIConversation.addMessage(
        conversation.id,
        'assistant',
        response.content,
        response.functionCalls
      );
    }

    res.json({
      success: true,
      message: response,
      conversationId: conversation?.id || null,
    });
  } catch (error) {
    console.error('Devon IA chat error:', error);

    // Tratar erros específicos
    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: {
          code: 'API_KEY_ERROR',
          message: 'Gemini API key not configured. Please add GEMINI_API_KEY to .env file.',
        },
      });
    }

    next(error);
  }
}

/**
 * Criar nova conversa
 */
async function createConversation(req, res, next) {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    const conversation = await DevonAIConversation.create(
      userId,
      title || 'Nova conversa'
    );

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    next(error);
  }
}

/**
 * Listar conversas do usuário
 */
async function listConversations(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const conversations = await DevonAIConversation.listByUser(userId, limit);

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('Error listing conversations:', error);
    next(error);
  }
}

/**
 * Buscar conversa específica com mensagens
 */
async function getConversation(req, res, next) {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);

    const conversation = await DevonAIConversation.findById(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found',
        },
      });
    }

    const messages = await DevonAIConversation.getMessages(conversationId);

    res.json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    next(error);
  }
}

/**
 * Buscar última conversa do usuário
 */
async function getLastConversation(req, res, next) {
  try {
    const userId = req.user.id;

    const conversation = await DevonAIConversation.getLastConversation(userId);
    if (!conversation) {
      return res.json({
        success: true,
        conversation: null,
        messages: [],
      });
    }

    const messages = await DevonAIConversation.getMessages(conversation.id);

    res.json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    console.error('Error getting last conversation:', error);
    next(error);
  }
}

/**
 * Deletar conversa
 */
async function deleteConversation(req, res, next) {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);

    const conversation = await DevonAIConversation.findById(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found',
        },
      });
    }

    await DevonAIConversation.delete(conversationId, userId);

    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    next(error);
  }
}

/**
 * Atualizar título da conversa
 */
async function updateConversationTitle(req, res, next) {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Title is required',
        },
      });
    }

    const conversation = await DevonAIConversation.findById(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found',
        },
      });
    }

    await DevonAIConversation.updateTitle(conversationId, title);

    res.json({
      success: true,
      message: 'Title updated',
    });
  } catch (error) {
    console.error('Error updating conversation title:', error);
    next(error);
  }
}

/**
 * Obter informações sobre o Devon IA
 */
async function getInfo(req, res) {
  res.json({
    success: true,
    devon: {
      name: 'Devon IA',
      version: '1.0.0',
      description: 'Agente inteligente para criar devocionais automaticamente',
      capabilities: [
        'Criar devocionais completos em português e inglês',
        'Gerar títulos e conteúdo inspirador',
        'Sugerir perguntas de reflexão',
        'Escrever orações personalizadas',
        'Buscar referências bíblicas relevantes',
        'Listar e gerenciar devocionais existentes',
      ],
      tools: [
        'createDevotional - Cria um novo devocional',
        'listDevotionals - Lista devocionais existentes',
        'getDevotional - Busca devocional específico',
        'searchBibleVerse - Sugere versículos bíblicos',
      ],
    },
  });
}

module.exports = {
  chat,
  createConversation,
  listConversations,
  getConversation,
  getLastConversation,
  deleteConversation,
  updateConversationTitle,
  getInfo,
};
