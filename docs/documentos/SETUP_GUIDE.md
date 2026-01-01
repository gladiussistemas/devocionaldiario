# 🚀 Guia de Setup - API de Devocionais

Este guia vai te ajudar a configurar e testar a API que acabamos de criar.

## 📋 Pré-requisitos

- ✅ Node.js 18+ instalado
- ✅ Conta no Supabase (gratuita)
- ✅ Git Bash ou terminal

---

## 1️⃣ Criar Projeto no Supabase

### Passo 1: Criar conta e projeto
1. Acesse https://supabase.com
2. Clique em "Start your project"
3. Faça login ou crie uma conta
4. Clique em "New Project"
5. Preencha:
   - **Name**: `devocional-api` (ou nome de sua preferência)
   - **Database Password**: Escolha uma senha forte (salve ela!)
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
6. Clique em "Create new project" (aguarde ~2 minutos)

### Passo 2: Obter credenciais do Supabase
1. No dashboard do projeto, vá em **Settings** (ícone de engrenagem) → **API**
2. Copie os seguintes valores:
   - **Project URL**
   - **anon public** key
   - **service_role** key

---

## 2️⃣ Executar Migrações SQL

### Passo 1: Abrir SQL Editor
1. No Supabase, vá em **SQL Editor** no menu lateral
2. Clique em **New query**

### Passo 2: Executar migrações (uma por vez)

Execute cada arquivo SQL na seguinte ordem:

**1. Criar tabelas de autores:**
```sql
-- Cole e execute todo o conteúdo de:
backend/src/database/migrations/001_create_authors.sql
```
Clique em **Run** (ou Ctrl+Enter)

**2. Criar tabelas de temas:**
```sql
-- Cole e execute todo o conteúdo de:
backend/src/database/migrations/002_create_themes.sql
```

**3. Criar tabelas de devocionais:**
```sql
-- Cole e execute todo o conteúdo de:
backend/src/database/migrations/003_create_devotionals.sql
```

**4. Criar tabelas de usuários admin:**
```sql
-- Cole e execute todo o conteúdo de:
backend/src/database/migrations/004_create_admin_users.sql
```

**5. Criar índices e views:**
```sql
-- Cole e execute todo o conteúdo de:
backend/src/database/migrations/005_create_indexes.sql
```

**6. Inserir dados de exemplo:**
```sql
-- Cole e execute todo o conteúdo de:
backend/src/database/seeds/sample_data.sql
```

### Passo 3: Verificar tabelas criadas
1. Vá em **Table Editor** no menu lateral
2. Você deve ver todas as tabelas criadas:
   - authors
   - author_translations
   - themes
   - theme_translations
   - devotionals
   - devotional_contents
   - biblical_references
   - admin_users
   - admin_sessions
   - api_requests

---

## 3️⃣ Configurar Backend

### Passo 1: Criar arquivo .env
1. Abra o terminal na pasta `backend/`
2. Copie o arquivo de exemplo:
```bash
cd backend
copy .env.example .env
```

### Passo 2: Editar .env
Abra o arquivo `.env` e preencha com as credenciais do Supabase:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# JWT Configuration
JWT_SECRET=mude_isso_para_algo_super_secreto_em_producao
JWT_EXPIRATION=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_PUBLIC=100
RATE_LIMIT_AUTH=5
RATE_LIMIT_ADMIN=1000
```

**⚠️ IMPORTANTE:** Substitua os valores de `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` pelos valores copiados do Supabase!

### Passo 3: Instalar dependências
```bash
npm install
```

Aguarde a instalação (pode demorar 1-2 minutos).

---

## 4️⃣ Criar Primeiro Usuário Admin

Execute o script para criar o primeiro usuário admin:

```bash
npm run create-admin
```

Você será solicitado a fornecer:
- **Username**: admin (ou o que preferir)
- **Email**: seu@email.com
- **Password**: senha123 (escolha uma senha forte!)
- **Full Name**: Seu Nome (opcional)

Exemplo:
```
Username: admin
Email: admin@devocional.com
Password: senha123
Full Name: Administrador

✅ Admin user created successfully!
```

**💾 Salve essas credenciais** - você vai usá-las para fazer login!

---

## 5️⃣ Iniciar o Servidor

### Modo desenvolvimento (com hot reload):
```bash
npm run dev
```

Você deve ver:
```
🚀 Server running on port 3000
📝 Environment: development
🔗 Health check: http://localhost:3000/health
```

### Testar se está funcionando:
Abra o navegador em: http://localhost:3000/health

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2025-12-12T...",
  "environment": "development"
}
```

---

## 6️⃣ Testar a API

### Opção A: Testar no Navegador

**1. Ver estatísticas:**
```
http://localhost:3000/api/stats
```

**2. Listar devocionais:**
```
http://localhost:3000/api/devotionals
```

**3. Devocional do dia:**
```
http://localhost:3000/api/devotionals/today
```

**4. Devocional aleatório:**
```
http://localhost:3000/api/devotionals/random
```

**5. Listar autores:**
```
http://localhost:3000/api/authors
```

**6. Listar temas:**
```
http://localhost:3000/api/themes
```

### Opção B: Testar com cURL

**Login (obter token):**
```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"senha123\"}"
```

Copie o `token` da resposta e use nos próximos comandos.

**Ver usuário atual:**
```bash
curl http://localhost:3000/api/admin/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Opção C: Testar com Postman ou Insomnia

1. Importe a coleção de endpoints (você pode criar manualmente)
2. Configure o base URL: `http://localhost:3000`
3. Teste cada endpoint

---

## 7️⃣ Endpoints Disponíveis

### 🌐 API Pública (sem autenticação)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/devotionals` | Lista devocionais (com filtros) |
| GET | `/api/devotionals/today` | Devocional do dia |
| GET | `/api/devotionals/random` | Devocional aleatório |
| GET | `/api/devotionals/:slug` | Devocional por slug |
| GET | `/api/authors` | Lista autores |
| GET | `/api/authors/:slug` | Autor específico |
| GET | `/api/themes` | Lista temas |
| GET | `/api/themes/:slug` | Tema específico |
| GET | `/api/search?q=termo` | Busca full-text |
| GET | `/api/stats` | Estatísticas da API |

### 🔐 API Admin (requer autenticação)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/admin/auth/login` | Login |
| POST | `/api/admin/auth/logout` | Logout |
| GET | `/api/admin/auth/me` | Usuário atual |

### Query Parameters Suportados

**Devocionais (`/api/devotionals`):**
- `language=pt|en` - Idioma (padrão: pt)
- `author=slug` - Filtrar por autor
- `theme=slug` - Filtrar por tema
- `date=YYYY-MM-DD` - Filtrar por data específica
- `start_date=YYYY-MM-DD` - Data inicial
- `end_date=YYYY-MM-DD` - Data final
- `page=1` - Página (padrão: 1)
- `limit=10` - Itens por página (padrão: 10)

**Exemplos:**
```
/api/devotionals?language=pt&page=1&limit=5
/api/devotionals?author=charles-spurgeon&theme=fe
/api/devotionals?date=2025-12-13
```

---

## 🐛 Troubleshooting

### Erro: "connect ECONNREFUSED"
- ✅ Verifique se as credenciais do Supabase estão corretas no `.env`
- ✅ Verifique se o Supabase URL está correto (com https://)

### Erro: "relation does not exist"
- ✅ Execute todas as migrações SQL no Supabase SQL Editor
- ✅ Verifique se executou na ordem correta (001 → 005)

### Erro: "No devotional found for today"
- ✅ Execute o arquivo de seeds (`sample_data.sql`)
- ✅ Ou altere a `publication_date` no seed para hoje

### Erro: "Invalid credentials" no login
- ✅ Execute novamente `npm run create-admin`
- ✅ Verifique se usou as credenciais corretas

### Porta 3000 já em uso
Altere a porta no `.env`:
```env
PORT=3001
```

---

## ✅ Checklist de Verificação

- [X] Projeto criado no Supabase
- [X] Todas as 5 migrações executadas
- [X] Seeds de dados inseridos
- [X] Arquivo `.env` configurado corretamente
- [X] Dependências instaladas (`npm install`)
- [X] Usuário admin criado
- [X] Servidor rodando (`npm run dev`)
- [X] `/health` endpoint respondendo
- [X] `/api/stats` retornando estatísticas
- [X] `/api/devotionals` listando devocionais
- [ ] Login funcionando

---

## 🎉 Próximos Passos

Depois de testar tudo, podemos:
1. ✅ **Implementar controllers admin** - CRUD completo
2. ✅ **Criar admin panel React** - Interface web para gerenciar
3. ✅ **Integrar no frontend** - Adicionar no site público
4. ✅ **Deploy em produção** - Colocar no ar

---

## 📞 Problemas?

Se encontrar algum erro, me avise com:
1. O erro completo que apareceu
2. O que você estava tentando fazer
3. Print da tela (se possível)

Boa sorte! 🚀
