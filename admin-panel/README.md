# 🎨 Devocional Admin Panel

Painel administrativo moderno construído com React, Material-UI e Vite para gerenciar devocionais, autores e temas.

## 🚀 Quick Start

### Instalar dependências
```bash
npm install
```

### Iniciar servidor de desenvolvimento
```bash
npm run dev
```

O painel estará disponível em: http://localhost:5173

### Build para produção
```bash
npm run build
```

## 📋 Features

- ✅ **Autenticação JWT** - Login seguro com tokens
- ✅ **Dashboard** - Visão geral com estatísticas
- ✅ **Sidebar** - Navegação lateral responsiva
- ✅ **Material-UI** - Design moderno e componentes prontos
- ✅ **Protected Routes** - Rotas protegidas por autenticação
- 🚧 **CRUD Devocionais** - Em desenvolvimento
- 🚧 **CRUD Autores** - Em desenvolvimento
- 🚧 **CRUD Temas** - Em desenvolvimento

## 🔐 Login

Use as credenciais criadas com `npm run create-admin` no backend:

- **Usuário**: italoisvi (ou o que você criou)
- **Senha**: Beno1618!@#$ (ou a que você criou)

## 📁 Estrutura do Projeto

```
admin-panel/
├── src/
│   ├── components/
│   │   ├── Auth/           # Login, PrivateRoute
│   │   ├── Layout/         # Layout principal com sidebar
│   │   ├── Devotionals/    # Componentes de devocionais (a implementar)
│   │   ├── Authors/        # Componentes de autores (a implementar)
│   │   └── Themes/         # Componentes de temas (a implementar)
│   ├── pages/              # Páginas principais
│   ├── services/           # API e autenticação
│   ├── contexts/           # Context API (AuthContext)
│   ├── App.jsx             # Rotas e tema
│   └── main.jsx            # Entry point
├── index.html
├── vite.config.js
└── package.json
```

## 🛠️ Tecnologias

- **React 18** - Framework UI
- **Vite** - Build tool rápido
- **Material-UI (MUI)** - Componentes UI
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **React Hook Form** - Formulários (a usar)
- **React Quill** - Editor rich text (a usar)

## 🎨 Design

**Cores:**
- Primary: #254699 (azul do projeto)
- Secondary: #16324e (azul escuro)

**Tema:** Material-UI com customização

## 📝 Próximos Passos

1. Implementar CRUD de Devocionais
2. Implementar CRUD de Autores
3. Implementar CRUD de Temas
4. Adicionar editor rich text para conteúdo
5. Upload de imagens (opcional)
6. Filtros e busca
7. Paginação

## 🐛 Troubleshooting

### Erro de conexão com API
- Verifique se o backend está rodando na porta 3000
- Verifique o proxy no `vite.config.js`

### Erro 401 no login
- Verifique se o usuário foi criado no backend
- Verifique se as credenciais estão corretas

## 🔗 Links Úteis

- Backend API: http://localhost:3000
- Admin Panel: http://localhost:5173
- Documentação MUI: https://mui.com
- React Router: https://reactrouter.com
