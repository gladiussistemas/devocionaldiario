# API de Devocionais

API RESTful de devocionais cristãos com suporte multi-idioma (PT/EN), desenvolvida com Node.js, Express e PostgreSQL (Supabase).

## Funcionalidades

- Devocionais diários organizados por data
- Suporte a múltiplos idiomas (Português e Inglês)
- Filtros por autor, tema e período
- Busca full-text no conteúdo
- Referências bíblicas estruturadas 
- Painel administrativo para gerenciamento de conteúdo
- API pública com rate limiting 

## Tecnologias

### Backend 
- Node.js 18+
- Express.js
- PostgreSQL (Supabase)
- JWT para autenticação
- bcrypt para hash de senhas

### Admin Panel
- React 18
- Material-UI (MUI)
- React Router
- React Quill (editor de texto rico)
- Axios

## Estrutura do Projeto

```
devocional/
├── backend/              # API Node.js
├── admin-panel/          # Painel React
├── theme-v2/            # Assets do site
├── assets/              # Scripts JS
└── index.htm            # Página de apresentação
```

## Instalação e Configuração

### 1. Backend

```bash
cd backend
npm install

# Configure o .env com suas credenciais do Supabase
cp .env.example .env

# Execute as migrações do banco de dados
# (Conecte ao Supabase e execute os arquivos em src/database/migrations/)

# Crie um usuário admin
node src/scripts/createAdmin.js

# Inicie o servidor
npm run dev
```

### 2. Admin Panel

```bash
cd admin-panel
npm install
npm run dev
```

### 3. Acesse

- API: http://localhost:3000
- Admin Panel: http://localhost:5173
- Site: Abra o `index.htm` no navegador

## Endpoints da API

Documentação completa disponível no repositório.

### Exemplos

```bash
# Devocional de hoje
GET /api/devotionals/today

# Devocional aleatório
GET /api/devotionals/random

# Lista de autores
GET /api/authors

# Lista de temas
GET /api/themes
```

## Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

## Licença

Este projeto está sob a licença MIT.
