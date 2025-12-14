import api from './api';

const devonAIService = {
  /**
   * Envia mensagem para o Devon IA
   */
  async chat(messages, conversationId = null) {
    try {
      const response = await api.post('/admin/devon-ai/chat', {
        messages,
        conversationId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cria nova conversa
   */
  async createConversation(title = 'Nova conversa') {
    try {
      const response = await api.post('/admin/devon-ai/conversations', { title });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lista conversas do usuário
   */
  async listConversations(limit = 50) {
    try {
      const response = await api.get('/admin/devon-ai/conversations', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Busca conversa específica com mensagens
   */
  async getConversation(conversationId) {
    try {
      const response = await api.get(`/admin/devon-ai/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Busca última conversa do usuário
   */
  async getLastConversation() {
    try {
      const response = await api.get('/admin/devon-ai/conversations/last');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Deleta conversa
   */
  async deleteConversation(conversationId) {
    try {
      const response = await api.delete(`/admin/devon-ai/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualiza título da conversa
   */
  async updateConversationTitle(conversationId, title) {
    try {
      const response = await api.put(`/admin/devon-ai/conversations/${conversationId}`, {
        title,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtém informações sobre o Devon IA
   */
  async getInfo() {
    try {
      const response = await api.get('/admin/devon-ai/info');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default devonAIService;
