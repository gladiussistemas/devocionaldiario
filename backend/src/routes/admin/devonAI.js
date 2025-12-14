const express = require('express');
const router = express.Router();
const devonAIController = require('../../controllers/admin/devonAIController');
const { authenticate, authorize } = require('../../middleware/auth');

// Todas as rotas requerem autenticação (editor ou admin)
router.use(authenticate);
router.use(authorize('editor', 'admin'));

/**
 * POST /api/admin/devon-ai/chat
 * Chat com Devon IA
 */
router.post('/chat', devonAIController.chat);

/**
 * POST /api/admin/devon-ai/conversations
 * Criar nova conversa
 */
router.post('/conversations', devonAIController.createConversation);

/**
 * GET /api/admin/devon-ai/conversations
 * Listar conversas do usuário
 */
router.get('/conversations', devonAIController.listConversations);

/**
 * GET /api/admin/devon-ai/conversations/last
 * Buscar última conversa do usuário
 */
router.get('/conversations/last', devonAIController.getLastConversation);

/**
 * GET /api/admin/devon-ai/conversations/:id
 * Buscar conversa específica com mensagens
 */
router.get('/conversations/:id', devonAIController.getConversation);

/**
 * PUT /api/admin/devon-ai/conversations/:id
 * Atualizar título da conversa
 */
router.put('/conversations/:id', devonAIController.updateConversationTitle);

/**
 * DELETE /api/admin/devon-ai/conversations/:id
 * Deletar conversa
 */
router.delete('/conversations/:id', devonAIController.deleteConversation);

/**
 * GET /api/admin/devon-ai/info
 * Informações sobre Devon IA
 */
router.get('/info', devonAIController.getInfo);

module.exports = router;
