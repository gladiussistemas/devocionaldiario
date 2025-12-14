import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import devonAIService from '../services/devonAIService';

const SUGGESTIONS = [
  { text: 'Criar devocionais completos em português e inglês', prompt: 'Crie um devocional completo em português e inglês sobre fé' },
  { text: 'Gerar títulos e conteúdo inspirador', prompt: 'Me ajude a gerar títulos inspiradores para devocionais' },
  { text: 'Sugerir perguntas de reflexão e orações', prompt: 'Sugira perguntas de reflexão e uma oração para um devocional sobre esperança' },
  { text: 'Buscar referências bíblicas relevantes', prompt: 'Busque referências bíblicas sobre amor ao próximo' },
  { text: 'Listar e gerenciar seus devocionais', prompt: 'Liste os últimos 10 devocionais criados' },
];

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: `Olá! Sou o Devon IA, seu assistente inteligente para criar devocionais!\n\nEu posso te ajudar a:`,
  isWelcome: true,
};

// Ícone de relógio (SVG do usuário)
const HistoryIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M13.5,2c-5.629,0-10.212,4.477-10.475,10.068l-1.679-1.589c-.195-.184-.501-.175-.684,.021-.183,.195-.175,.501,.021,.684l2.5,2.366c.092,.087,.21,.131,.33,.131,.009,0,.018,0,.028,0,.129-.006,.25-.065,.336-.163l2.269-2.598c.18-.205,.159-.517-.045-.696-.206-.181-.518-.159-.696,.045l-1.475,1.689c.277-5.175,4.509-9.292,9.571-9.292,5.291,0,9.595,4.304,9.595,9.595s-4.304,9.595-9.595,9.595c-.276,0-.5,.224-.5,.5s.224,.5,.5,.5c5.843,0,10.595-4.752,10.595-10.595S19.343,2,13.5,2Zm.5,4.764c0-.276-.224-.5-.5-.5s-.5,.224-.5,.5v6.132c0,.133,.053,.26,.146,.354l3.354,3.354c.098,.098,.226,.146,.354,.146s.256-.049,.354-.146c.195-.195,.195-.512,0-.707l-3.207-3.207V6.764Z" />
  </svg>
);

export default function DevonAI() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Carregar última conversa ao montar
  useEffect(() => {
    loadLastConversation();
  }, []);

  const loadLastConversation = async () => {
    try {
      const response = await devonAIService.getLastConversation();
      if (response.conversation && response.messages.length > 0) {
        setCurrentConversationId(response.conversation.id);
        // Não incluir a mensagem de boas-vindas ao carregar conversa existente
        setMessages(response.messages.map(m => ({
          role: m.role,
          content: m.content,
          functionCalls: m.function_calls,
        })));
      }
    } catch (err) {
      console.error('Error loading last conversation:', err);
    }
  };

  const loadConversations = async () => {
    setLoadingHistory(true);
    try {
      const response = await devonAIService.listConversations();
      setConversations(response.conversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const response = await devonAIService.getConversation(conversationId);
      setCurrentConversationId(conversationId);
      // Não incluir a mensagem de boas-vindas ao carregar conversa existente
      setMessages(response.messages.map(m => ({
        role: m.role,
        content: m.content,
        functionCalls: m.function_calls,
      })));
      setHistoryOpen(false);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Erro ao carregar conversa');
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setHistoryOpen(false);
  };

  const handleOpenHistory = () => {
    loadConversations();
    setHistoryOpen(true);
  };

  const handleContextMenu = (event, conversation) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
    setSelectedConversation(conversation);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setSelectedConversation(null);
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;

    try {
      await devonAIService.deleteConversation(selectedConversation.id);

      // Se a conversa deletada é a atual, criar nova conversa
      if (selectedConversation.id === currentConversationId) {
        handleNewConversation();
      }

      // Recarregar lista de conversas
      loadConversations();
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Erro ao deletar conversa');
    } finally {
      handleCloseContextMenu();
    }
  };

  const handleSend = async (messageText = input) => {
    if (!messageText.trim() || loading) return;

    const userMessage = { role: 'user', content: messageText.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const response = await devonAIService.chat(
        newMessages.filter(m => m.role !== 'assistant' || m !== WELCOME_MESSAGE),
        currentConversationId
      );

      if (response.success && response.message) {
        setMessages([...newMessages, response.message]);

        // Atualizar conversationId se foi criada uma nova
        if (response.conversationId && !currentConversationId) {
          setCurrentConversationId(response.conversationId);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(
        err.response?.data?.error?.message ||
          'Erro ao enviar mensagem. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Agora';
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BotIcon /> Devon IA
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Agente inteligente para criar devocionais automaticamente
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={handleNewConversation}
            color="primary"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <AddIcon />
          </IconButton>
          <IconButton
            onClick={handleOpenHistory}
            color="primary"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <HistoryIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Chat Container */}
      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            backgroundColor: (theme) => theme.palette.grey[50],
          }}
        >
          {messages.filter(m => m.content && m.content.trim() !== '').map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 1,
                  maxWidth: '70%',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                    width: 36,
                    height: 36,
                  }}
                >
                  {message.role === 'user' ? <PersonIcon /> : <BotIcon />}
                </Avatar>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor:
                      message.role === 'user' ? 'primary.light' : 'background.paper',
                    color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  {message.content.split('\n').map((line, idx) => {
                    // Se a linha começa com •, é um item de lista
                    if (line.trim().startsWith('•')) {
                      return (
                        <Typography
                          key={idx}
                          variant="body2"
                          sx={{ pl: 2, my: 0.5 }}
                        >
                          {line.trim()}
                        </Typography>
                      );
                    }
                    // Linha normal
                    return line.trim() ? (
                      <Typography
                        key={idx}
                        variant="body1"
                        sx={{ mb: line === '' ? 1 : 0, fontWeight: idx === 0 ? 500 : 400 }}
                      >
                        {line}
                      </Typography>
                    ) : (
                      <Box key={idx} sx={{ height: 8 }} />
                    );
                  })}

                  {/* Sugestões dentro da mensagem de boas-vindas */}
                  {message.isWelcome && (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {SUGGESTIONS.map((suggestion, idx) => (
                        <Typography
                          key={idx}
                          variant="body2"
                          onClick={() => handleSuggestionClick(suggestion.prompt)}
                          sx={{
                            pl: 2,
                            cursor: 'pointer',
                            color: 'text.primary',
                            transition: 'color 0.2s ease',
                            '&:hover': {
                              color: 'error.main',
                            }
                          }}
                        >
                          • {suggestion.text}
                        </Typography>
                      ))}
                    </Box>
                  )}

                </Paper>
              </Box>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                  <BotIcon />
                </Avatar>
                <Paper sx={{ p: 2 }}>
                  <CircularProgress size={20} />
                </Paper>
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* Input Area */}
        <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              variant="outlined"
              size="small"
            />
            <IconButton
              color="primary"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'grey.300' },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Devon IA pode cometer erros. Revise sempre o conteúdo gerado antes de publicar.
          </Typography>
        </Box>
      </Paper>

      {/* History Sidebar */}
      <Drawer
        anchor="right"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        PaperProps={{
          sx: { width: 320, p: 2 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Histórico</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={handleNewConversation}
            size="small"
            variant="contained"
          >
            Nova
          </Button>
        </Box>

        {loadingHistory ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ flex: 1, overflow: 'auto' }}>
            {conversations.map((conv) => (
              <ListItem
                key={conv.id}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleContextMenu(e, conv)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                }
              >
                <ListItemButton
                  selected={conv.id === currentConversationId}
                  onClick={() => loadConversation(conv.id)}
                >
                  <ListItemText
                    primary={conv.title}
                    secondary={formatDate(conv.updated_at)}
                    primaryTypographyProps={{
                      noWrap: true,
                      sx: { fontSize: '0.9rem' },
                    }}
                    secondaryTypographyProps={{
                      sx: { fontSize: '0.75rem' },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        {conversations.length === 0 && !loadingHistory && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Nenhuma conversa ainda
            </Typography>
          </Box>
        )}
      </Drawer>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleDeleteConversation}>Deletar</MenuItem>
      </Menu>
    </Box>
  );
}
