-- Tabela para armazenar conversas do Devon IA
CREATE TABLE IF NOT EXISTS devon_ai_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para armazenar mensagens de cada conversa
CREATE TABLE IF NOT EXISTS devon_ai_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES devon_ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  function_calls JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_devon_ai_conversations_user_id ON devon_ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_devon_ai_messages_conversation_id ON devon_ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_devon_ai_conversations_updated_at ON devon_ai_conversations(updated_at DESC);
