const { supabase } = require('../config/database');

class DevonAIConversation {
  /**
   * Criar nova conversa
   */
  static async create(userId, title) {
    const { data, error } = await supabase
      .from('devon_ai_conversations')
      .insert([{ user_id: userId, title }])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data;
  }

  /**
   * Buscar conversa por ID
   */
  static async findById(conversationId, userId) {
    const { data, error } = await supabase
      .from('devon_ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error finding conversation:', error);
      return null;
    }

    return data;
  }

  /**
   * Listar conversas do usuário
   */
  static async listByUser(userId, limit = 50) {
    const { data, error } = await supabase
      .from('devon_ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error listing conversations:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Atualizar timestamp de última atualização
   */
  static async touch(conversationId) {
    const { error } = await supabase
      .from('devon_ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('Error touching conversation:', error);
    }
  }

  /**
   * Atualizar título da conversa
   */
  static async updateTitle(conversationId, title) {
    const { error } = await supabase
      .from('devon_ai_conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation title:', error);
      throw error;
    }
  }

  /**
   * Deletar conversa
   */
  static async delete(conversationId, userId) {
    const { error } = await supabase
      .from('devon_ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Adicionar mensagem à conversa
   */
  static async addMessage(conversationId, role, content, functionCalls = null) {
    const { data, error } = await supabase
      .from('devon_ai_messages')
      .insert([{
        conversation_id: conversationId,
        role,
        content,
        function_calls: functionCalls || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    // Atualizar updated_at da conversa
    await this.touch(conversationId);

    return data;
  }

  /**
   * Buscar mensagens de uma conversa
   */
  static async getMessages(conversationId) {
    const { data, error } = await supabase
      .from('devon_ai_messages')
      .select('id, role, content, function_calls, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting messages:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Buscar última conversa do usuário
   */
  static async getLastConversation(userId) {
    const { data, error } = await supabase
      .from('devon_ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Se não houver conversas, retorna null sem erro
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting last conversation:', error);
      return null;
    }

    return data;
  }
}

module.exports = DevonAIConversation;
