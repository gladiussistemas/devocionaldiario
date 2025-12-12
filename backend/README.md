# Devocional API - Backend

API RESTful de Devocionais construída com Node.js, Express e PostgreSQL.

## Requisitos

- Node.js 18+ LTS
- PostgreSQL 15+
- npm ou yarn

## Setup

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações.

### 3. Criar Banco de Dados

```bash
createdb devocional_api
```

Ou via psql:

```sql
CREATE DATABASE devocional_api;
CREATE USER devocional WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE devocional_api TO devocional;
```

### 4. Executar Migrações

```bash
npm run migrate
```

### 5. Criar Dados de Exemplo (Opcional)

```bash
npm run seed
```

### 6. Criar Primeiro Usuário Admin

```bash
npm run create-admin
```

### 7. Iniciar Servidor

Desenvolvimento (com hot reload):
```bash
npm run dev
```

Produção:
```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`

## Endpoints da API

### API Pública (sem autenticação)

- `GET /api/devotionals` - Lista devocionais com filtros
- `GET /api/devotionals/:slug` - Devocional específico
- `GET /api/devotionals/today` - Devocional do dia
- `GET /api/devotionals/random` - Devocional aleatório
- `GET /api/authors` - Lista autores
- `GET /api/authors/:slug` - Autor específico
- `GET /api/themes` - Lista temas
- `GET /api/themes/:slug` - Tema específico
- `GET /api/search?q=termo` - Busca full-text
- `GET /api/stats` - Estatísticas gerais

### API Admin (requer autenticação JWT)

- `POST /api/admin/auth/login` - Login
- `POST /api/admin/auth/logout` - Logout
- `GET /api/admin/auth/me` - Usuário atual
- `GET/POST/PUT/DELETE /api/admin/devotionals` - CRUD devocionais
- `GET/POST/PUT/DELETE /api/admin/authors` - CRUD autores
- `GET/POST/PUT/DELETE /api/admin/themes` - CRUD temas
- `GET/POST/PUT/DELETE /api/admin/users` - CRUD usuários (apenas admin)

## Testes

```bash
npm test
```

Com watch mode:
```bash
npm run test:watch
```

## Estrutura de Pastas

```
backend/
├── src/
│   ├── config/          # Configurações (database, auth, etc)
│   ├── middleware/      # Middlewares Express
│   ├── models/          # Models do banco de dados
│   ├── controllers/     # Controllers (public/ e admin/)
│   ├── routes/          # Rotas (public/ e admin/)
│   ├── services/        # Lógica de negócio
│   ├── database/        # Migrations e seeds
│   ├── app.js           # Setup do Express
│   └── server.js        # Entry point
├── tests/               # Testes
├── .env                 # Variáveis de ambiente (não commitado)
├── .env.example         # Exemplo de variáveis
└── package.json
```

## Segurança

- Passwords hasheados com bcrypt (12 salt rounds)
- Autenticação JWT com expiração de 24h
- Rate limiting configurado
- Helmet.js para security headers
- CORS configurável
- Input validation com express-validator

## Licença

MIT
