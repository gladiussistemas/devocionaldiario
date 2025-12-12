# 📡 Exemplos de Requisições - API de Devocionais

## 🌐 API Pública (sem autenticação)

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Estatísticas da API
```bash
curl http://localhost:3000/api/stats
```

### 3. Listar Devocionais
```bash
# Todos os devocionais (página 1, 10 itens)
curl http://localhost:3000/api/devotionals

# Com paginação
curl "http://localhost:3000/api/devotionals?page=1&limit=5"

# Em inglês
curl "http://localhost:3000/api/devotionals?language=en"

# Filtrar por autor
curl "http://localhost:3000/api/devotionals?author=charles-spurgeon"

# Filtrar por tema
curl "http://localhost:3000/api/devotionals?theme=fe"

# Filtrar por data
curl "http://localhost:3000/api/devotionals?date=2025-12-13"

# Múltiplos filtros
curl "http://localhost:3000/api/devotionals?author=john-piper&theme=oracao&language=pt"
```

### 4. Devocional Específico
```bash
# Por slug (português)
curl http://localhost:3000/api/devotionals/confianca-em-deus

# Por slug (inglês)
curl "http://localhost:3000/api/devotionals/confianca-em-deus?language=en"

# URL alternativa com idioma na rota
curl http://localhost:3000/api/devotionals/confianca-em-deus/en
```

### 5. Devocional do Dia
```bash
# Português
curl http://localhost:3000/api/devotionals/today

# Inglês
curl "http://localhost:3000/api/devotionals/today?language=en"
```

### 6. Devocional Aleatório
```bash
# Qualquer devocional
curl http://localhost:3000/api/devotionals/random

# Aleatório de um tema específico
curl "http://localhost:3000/api/devotionals/random?theme=fe"

# Em inglês
curl "http://localhost:3000/api/devotionals/random?language=en"
```

### 7. Listar Autores
```bash
# Todos os autores
curl http://localhost:3000/api/authors

# Em inglês
curl "http://localhost:3000/api/authors?language=en"
```

### 8. Autor Específico
```bash
# Por slug
curl http://localhost:3000/api/authors/charles-spurgeon

# Em inglês
curl "http://localhost:3000/api/authors/charles-spurgeon?language=en"
```

### 9. Listar Temas
```bash
# Todos os temas
curl http://localhost:3000/api/themes

# Em inglês
curl "http://localhost:3000/api/themes?language=en"
```

### 10. Tema Específico
```bash
# Por slug
curl http://localhost:3000/api/themes/fe

# Em inglês
curl "http://localhost:3000/api/themes/fe?language=en"
```

### 11. Buscar Devocionais
```bash
# Busca simples
curl "http://localhost:3000/api/search?q=confianca"

# Com paginação
curl "http://localhost:3000/api/search?q=Deus&page=1&limit=5"

# Em inglês
curl "http://localhost:3000/api/search?q=faith&language=en"
```

---

## 🔐 API Admin (requer autenticação)

### 1. Login
```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha123"}'
```

**Resposta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-13T12:00:00.000Z",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@devocional.com",
    "full_name": "Administrador",
    "role": "admin",
    "is_active": true
  }
}
```

**💾 Copie o token** e use nos próximos comandos substituindo `SEU_TOKEN_AQUI`

### 2. Ver Usuário Atual
```bash
curl http://localhost:3000/api/admin/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 3. Logout
```bash
curl -X POST http://localhost:3000/api/admin/auth/logout \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🧪 Testando Validações

### Erro 400 - Validação Falhou
```bash
# Busca sem query
curl "http://localhost:3000/api/search?q="

# Idioma inválido
curl "http://localhost:3000/api/devotionals?language=fr"

# Página inválida
curl "http://localhost:3000/api/devotionals?page=-1"
```

### Erro 404 - Não Encontrado
```bash
# Devocional inexistente
curl http://localhost:3000/api/devotionals/nao-existe

# Autor inexistente
curl http://localhost:3000/api/authors/autor-invalido
```

### Erro 401 - Não Autenticado
```bash
# Tentar acessar /me sem token
curl http://localhost:3000/api/admin/auth/me

# Token inválido
curl http://localhost:3000/api/admin/auth/me \
  -H "Authorization: Bearer token_invalido"
```

### Erro 429 - Rate Limit
```bash
# Fazer muitas requisições rapidamente
for i in {1..110}; do
  curl http://localhost:3000/api/devotionals
done
```

---

## 📊 Exemplos de Respostas

### Sucesso - Devocional Completo
```json
{
  "devotional": {
    "id": 1,
    "slug": "confianca-em-deus",
    "title": "Confiança em Deus",
    "content": "O Senhor é o nosso pastor...",
    "prayer": "Senhor, ajuda-me a confiar em Ti...",
    "publication_date": "2025-12-13",
    "is_published": true,
    "author": {
      "id": 1,
      "slug": "charles-spurgeon",
      "name": "Charles Spurgeon",
      "bio": "Pregador batista inglês..."
    },
    "theme": {
      "id": 1,
      "slug": "fe",
      "name": "Fé",
      "description": "Devocionais sobre confiança..."
    },
    "biblical_references": [
      {
        "id": 1,
        "book": "psalms",
        "chapter": 23,
        "verse_start": 1,
        "verse_end": null,
        "reference_text": "Salmos 23:1"
      }
    ],
    "created_at": "2025-12-12T...",
    "updated_at": "2025-12-12T..."
  }
}
```

### Sucesso - Lista Paginada
```json
{
  "devotionals": [
    { "id": 1, "slug": "...", "title": "..." },
    { "id": 2, "slug": "...", "title": "..." }
  ],
  "total": 3,
  "page": 1,
  "limit": 10
}
```

### Erro - Validação
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "status": 400,
    "details": [
      {
        "field": "language",
        "message": "Language must be pt or en",
        "value": "fr"
      }
    ]
  }
}
```

### Erro - Rate Limit
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "status": 429
  }
}
```

---

## 🎯 Dicas para Testes

### 1. Use jq para formatar JSON
```bash
curl http://localhost:3000/api/devotionals | jq
```

### 2. Salve o token em variável
```bash
# Bash/Linux/Mac
TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha123"}' | jq -r '.token')

# Usar o token
curl http://localhost:3000/api/admin/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Teste de Performance
```bash
# Apache Bench (100 requisições, 10 concorrentes)
ab -n 100 -c 10 http://localhost:3000/api/devotionals

# Ou use hey
hey -n 100 -c 10 http://localhost:3000/api/devotionals
```

---

## 📱 Testando no Postman/Insomnia

### Importar Collection

Crie uma nova collection com os endpoints acima e configure:

**Variables:**
- `base_url`: `http://localhost:3000`
- `token`: (será preenchido após login)

**Headers globais:**
- `Content-Type`: `application/json`
- `Authorization`: `Bearer {{token}}` (para rotas admin)

---

Pronto para testar! 🚀
