# 🧪 Guia de Teste - Integração API ↔️ GlowUp

## ✅ Checklist de Implementação Backend

### 1. Migrations Executadas
- [x] Migration 006 - Campos em devotionals
- [x] Migration 007 - Campos em devotional_contents
- [x] Migration 008 - scripture_text em biblical_references
- [ ] **Migration 009 - scripture_reference em devotional_contents** (EXECUTAR)

### 2. Código Atualizado
- [x] Rotas corrigidas (sync antes de :slug)
- [x] Devon IA com todos os campos
- [x] Model Devotional completo
- [x] Controller sync implementado

---

## 🚀 PASSO 1: Executar Migration 009

### No Supabase (SQL Editor):

```sql
-- Migration 009: Add scripture_reference field to devotional_contents
ALTER TABLE devotional_contents
  ADD COLUMN IF NOT EXISTS scripture_reference TEXT;

COMMENT ON COLUMN devotional_contents.scripture_reference IS 'Formatted biblical reference text (e.g., "Filipenses 4:6-7")';
```

**✅ Verificar se foi criado:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'devotional_contents'
ORDER BY ordinal_position;
```

---

## 🚀 PASSO 2: Reiniciar o Backend

```bash
cd C:\Users\italo\source\repo\devocionaldiario\backend
npm run dev
```

Deve exibir:
```
🚀 Server running on port 3000
📝 Environment: development
```

---

## 🧪 PASSO 3: Testar Endpoint de Sincronização

### Teste 1: Sync básico
```bash
curl "http://localhost:3000/api/devotionals/sync?language=pt&published_only=true"
```

**Resposta esperada:**
```json
{
  "success": true,
  "format": "glowup",
  "language": "pt",
  "count": X,
  "devotionals": [
    {
      "id": 1,
      "theme_id": null,
      "day_number": 1,
      "title": "Título do Devocional",
      "scripture_reference": "Filipenses 4:6-7",
      "teaching_content": "<p>Conteúdo...</p>",
      "reflection_questions": ["Pergunta 1?", "Pergunta 2?"],
      "closing_prayer": "Oração...",
      "opening_inspiration": "Inspiração...",
      "action_step": "Passo de ação...",
      "estimated_duration_minutes": 10,
      "tags": ["fé", "mulheres"],
      "publish_date": "2025-12-19",
      "published": true,
      "quote_author": "C.S. Lewis",
      "quote_text": "Citação inspiradora...",
      "created_at": "2025-12-19T...",
      "updated_at": "2025-12-19T..."
    }
  ]
}
```

### Teste 2: Sync com filtro de data
```bash
curl "http://localhost:3000/api/devotionals/sync?language=pt&from_date=2025-12-01&published_only=true"
```

### Teste 3: Sync com limite
```bash
curl "http://localhost:3000/api/devotionals/sync?language=pt&limit=5&published_only=true"
```

---

## 🧪 PASSO 4: Criar Devocional de Teste via Devon IA

### 1. Acesse o Admin Panel
```
http://localhost:5173
```

### 2. Faça login

### 3. Vá para Devon IA

### 4. Digite:
```
Crie um devocional sobre fé para mulheres
```

### 5. Aguarde a criação

### 6. Verifique se foi criado com todos os campos:
```bash
curl "http://localhost:3000/api/devotionals/sync?language=pt&limit=1"
```

**Verificar campos obrigatórios:**
- ✅ title (não vazio)
- ✅ scripture_reference (formatado: "Livro X:Y-Z")
- ✅ teaching_content (HTML com parágrafos)
- ✅ reflection_questions (array com 4-5 perguntas)
- ✅ closing_prayer (oração completa)
- ✅ opening_inspiration (frase inspiradora)
- ✅ action_step (passo de ação)
- ✅ quote_author (autor)
- ✅ quote_text (citação)

---

## ✅ PASSO 5: Validar Estrutura da Resposta

### Script de validação (Node.js):

Salve como `test-sync.js`:

```javascript
const fetch = require('node-fetch');

async function testSync() {
  const url = 'http://localhost:3000/api/devotionals/sync?language=pt&published_only=true&limit=1';

  const response = await fetch(url);
  const data = await response.json();

  console.log('📊 Status:', response.status);
  console.log('📦 Resposta:', JSON.stringify(data, null, 2));

  if (data.success && data.devotionals.length > 0) {
    const dev = data.devotionals[0];

    console.log('\n✅ Validação de Campos:');
    console.log('- ID:', dev.id ? '✅' : '❌');
    console.log('- Title:', dev.title ? '✅' : '❌');
    console.log('- Scripture Reference:', dev.scripture_reference ? '✅' : '❌');
    console.log('- Teaching Content:', dev.teaching_content ? '✅' : '❌');
    console.log('- Reflection Questions:', Array.isArray(dev.reflection_questions) ? '✅' : '❌');
    console.log('- Closing Prayer:', dev.closing_prayer ? '✅' : '❌');
    console.log('- Opening Inspiration:', dev.opening_inspiration ? '✅' : '❌');
    console.log('- Action Step:', dev.action_step ? '✅' : '❌');
    console.log('- Quote Author:', dev.quote_author ? '✅' : '❌');
    console.log('- Quote Text:', dev.quote_text ? '✅' : '❌');
    console.log('- Publish Date:', dev.publish_date ? '✅' : '❌');
    console.log('- Published:', typeof dev.published === 'boolean' ? '✅' : '❌');

    // Validar formato de scripture_reference
    if (dev.scripture_reference) {
      const hasCorrectFormat = /^[A-Za-zÀ-ÿ\s]+\d+:\d+(-\d+)?$/.test(dev.scripture_reference);
      console.log('- Scripture Format (Livro X:Y-Z):', hasCorrectFormat ? '✅' : '❌');
    }
  } else {
    console.log('❌ Nenhum devocional encontrado!');
  }
}

testSync().catch(console.error);
```

Execute:
```bash
node test-sync.js
```

---

## 📋 Troubleshooting

### Erro: "Cannot GET /api/devotionals/sync"
- ✅ Verificar se a rota está antes de `/:slug`
- ✅ Reiniciar o servidor backend

### Erro: "column devotional_contents.scripture_reference does not exist"
- ✅ Executar Migration 009 no Supabase

### Resposta vazia: "devotionals": []
- ✅ Criar devocionais via Devon IA
- ✅ Verificar se estão marcados como `is_published = true`
- ✅ Verificar `publish_date` (não pode ser futura se filtrar por data)

### Campo scripture_reference retorna null
- ✅ Verificar se o campo existe no banco
- ✅ Recriar devocional via Devon IA (ele agora salvará o campo)
- ✅ Verificar se biblical_references existe (fallback)

---

## ✅ Critérios de Sucesso

Considere o backend **PRONTO** quando:

- [X] Migration 009 executada
- [X] Servidor rodando sem erros
- [X] Endpoint `/sync` acessível (não retorna 404)
- [ ] Devocional de teste criado via Devon IA
- [ ] Endpoint retorna JSON válido com estrutura correta
- [ ] Todos os campos obrigatórios preenchidos
- [ ] scripture_reference formatado corretamente
- [ ] Teste de validação passa 100%

---

## 🎯 Próximo Passo

Após todos os testes passarem, partimos para:
**📱 INTEGRAÇÃO NO APP GLOWUP**

---

**Data:** 19 de Dezembro de 2025
**Status:** Backend implementado e pronto para testes
