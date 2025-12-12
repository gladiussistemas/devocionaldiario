# ✅ Checklist de Setup

Use este checklist para garantir que configurou tudo corretamente.

## 🎯 Pré-Setup
- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm instalado (`npm --version`)
- [ ] Conta no Supabase criada

---

## 📦 Supabase Setup
- [ ] Projeto criado no Supabase
- [ ] Project URL copiado
- [ ] anon public key copiado
- [ ] service_role key copiado
- [ ] SQL Editor aberto

### Migrações SQL (executar em ordem)
- [ ] `001_create_authors.sql` executado ✓
- [ ] `002_create_themes.sql` executado ✓
- [ ] `003_create_devotionals.sql` executado ✓
- [ ] `004_create_admin_users.sql` executado ✓
- [ ] `005_create_indexes.sql` executado ✓
- [ ] `seeds/sample_data.sql` executado ✓

### Verificar Tabelas
- [ ] Table Editor mostra 10 tabelas criadas
- [ ] Tabela `devotionals` tem 3 linhas (dados de exemplo)
- [ ] Tabela `authors` tem 3 linhas
- [ ] Tabela `themes` tem 5 linhas

---

## ⚙️ Backend Setup
- [ ] Navegado para pasta `backend/`
- [ ] Arquivo `.env` criado (copiado de `.env.example`)
- [ ] `SUPABASE_URL` preenchido no `.env`
- [ ] `SUPABASE_ANON_KEY` preenchido no `.env`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` preenchido no `.env`
- [ ] `JWT_SECRET` alterado para algo secreto
- [ ] Dependências instaladas (`npm install` completo)
- [ ] Usuário admin criado (`npm run create-admin`)
- [ ] Credenciais do admin salvas

---

## 🚀 Servidor Rodando
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Mensagem "Server running on port 3000" apareceu
- [ ] Sem erros no console

---

## 🧪 Testes Básicos

### No Navegador
- [ ] `http://localhost:3000/health` retorna JSON com "ok"
- [ ] `http://localhost:3000/api/stats` mostra estatísticas
- [ ] `http://localhost:3000/api/devotionals` lista devocionais
- [ ] `http://localhost:3000/api/devotionals/today` retorna devocional
- [ ] `http://localhost:3000/api/authors` lista autores
- [ ] `http://localhost:3000/api/themes` lista temas

### Login Admin (cURL ou Postman)
- [ ] POST `/api/admin/auth/login` retorna token
- [ ] Token copiado e salvo
- [ ] GET `/api/admin/auth/me` com token retorna usuário

---

## 🎉 Tudo Funcionando?
- [ ] ✅ Todos os itens acima marcados
- [ ] ✅ API respondendo sem erros
- [ ] ✅ Dados de exemplo aparecendo

---

## 🐛 Problemas Comuns

### ❌ Erro: "Invalid credentials"
**Solução:** Execute `npm run create-admin` novamente

### ❌ Erro: "relation does not exist"
**Solução:** Execute todas as migrações SQL no Supabase

### ❌ Erro: "connect ECONNREFUSED"
**Solução:** Verifique credenciais do Supabase no `.env`

### ❌ Porta 3000 ocupada
**Solução:** Mude `PORT=3001` no `.env`

### ❌ "No devotional found for today"
**Solução:** Altere `publication_date` nos seeds ou use `/random`

---

## 📝 Próximos Passos

Após tudo funcionando:
1. Testar todos os endpoints (veja `API_EXAMPLES.md`)
2. Explorar respostas JSON
3. Testar filtros e paginação
4. Implementar controllers admin
5. Criar admin panel React

---

**Status Atual:** ⬜ Não iniciado | 🟡 Em progresso | ✅ Completo

Marque os itens conforme avança! 🚀
