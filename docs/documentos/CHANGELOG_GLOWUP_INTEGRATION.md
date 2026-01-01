# 📝 Changelog - Integração GlowUp App

## Data: 13 de dezembro de 2025

Este documento registra todas as mudanças implementadas para adaptar a API de Devocionais para alimentar o app mobile GlowUp (focado em mulheres cristãs).

---

## 🎯 Objetivo

Adaptar a estrutura da API de Devocionais para ser compatível com o app GlowUp, adicionando todos os campos necessários para exibir:
- ✅ Citação Diária (quote_author, quote_text)
- ✅ Passagem Bíblica (scripture_reference, scripture_text)
- ✅ Devocional (opening_inspiration, teaching_content, reflection_questions, action_step)
- ✅ Oração (closing_prayer)

---

## 📊 Mudanças no Backend

### 1. Migrations SQL Criadas

#### **006_add_devotional_fields.sql**
**Tabela `devotionals`:**
- ✅ Renomeado: `publication_date` → `publish_date`
- ➕ Adicionado: `day_number` (INTEGER) - Número do dia no plano/tema
- ➕ Adicionado: `estimated_duration_minutes` (INTEGER DEFAULT 10) - Duração estimada
- ➕ Adicionado: `tags` (TEXT[]) - Array de tags/palavras-chave
- 🔧 Índices atualizados para `publish_date` e `tags` (GIN index)

#### **007_add_content_fields.sql**
**Tabela `devotional_contents`:**
- ✅ Renomeado: `content` → `teaching_content`
- ✅ Renomeado: `prayer` → `closing_prayer`
- ➕ Adicionado: `quote_author` (TEXT) - Autor da citação diária
- ➕ Adicionado: `quote_text` (TEXT) - Texto da citação
- ➕ Adicionado: `opening_inspiration` (TEXT) - Inspiração de abertura
- ➕ Adicionado: `action_step` (TEXT) - Passo de ação prático
- ➕ Adicionado: `reflection_questions` (JSONB) - Array de perguntas de reflexão
- 🔧 Índices full-text search atualizados com novos campos

#### **008_add_scripture_text.sql**
**Tabela `biblical_references`:**
- ➕ Adicionado: `scripture_text` (JSONB) - Texto completo da passagem bíblica
  - Suporta múltiplas versões/traduções
  - Formato: `{"pt": "texto...", "en": "text...", "versions": {"nvi": "...", "acf": "..."}}`

---

### 2. Models Atualizados

**`backend/src/models/Devotional.js`:**
- ✅ Todas as referências de `publication_date` → `publish_date`
- ✅ Todos os SELECT queries incluem novos campos
- ✅ Método `create()` atualizado para aceitar novos campos
- ✅ Método `update()` atualizado para aceitar novos campos
- ✅ Método `_formatDevotional()` retorna todos os novos campos estruturados

---

### 3. Controllers Atualizados

**`backend/src/controllers/admin/devotionalController.js`:**
- ✅ Resposta do `getAll()` inclui: `day_number`, `estimated_duration_minutes`, `tags`
- ✅ Substituído `publication_date` por `publish_date`

---

### 4. Rotas e Validações Atualizadas

**`backend/src/routes/admin/devotionals.js`:**
- ✅ Validação atualizada para `publish_date` (antes era `publication_date`)
- ➕ Validações adicionadas:
  - `day_number` (opcional, integer)
  - `estimated_duration_minutes` (opcional, integer)
  - `tags` (opcional, array)
  - `contents.*.teaching_content` (obrigatório)
  - `contents.*.closing_prayer` (obrigatório)
  - `contents.*.quote_author` (opcional)
  - `contents.*.quote_text` (opcional)
  - `contents.*.opening_inspiration` (opcional)
  - `contents.*.action_step` (opcional)
  - `contents.*.reflection_questions` (opcional, array)

---

## 🎨 Mudanças no Frontend (Admin Panel)

### 1. DevotionalForm.jsx

**Campos Adicionados no Formulário:**

#### Informações Gerais:
- ✅ `day_number` - "Dia do Plano"
- ✅ `estimated_duration_minutes` - "Duração (minutos)"
- ✅ `tags` - "Tags" (separadas por vírgula)
- ✅ Renomeado: "Data de Publicação" agora usa `publish_date`

#### Citação Diária:
- ✅ `quote_author` - "Autor da Citação"
- ✅ `quote_text` - "Texto da Citação" (multiline)

#### Conteúdo do Devocional:
- ✅ `opening_inspiration` - "Inspiração de Abertura" (React Quill)
- ✅ `teaching_content` - "Conteúdo de Ensino" (React Quill) - Renomeado de "Conteúdo"
- ✅ `reflection_questions` - "Perguntas de Reflexão" (textarea, uma por linha)
- ✅ `action_step` - "Passo de Ação" (textarea)
- ✅ `closing_prayer` - "Oração de Encerramento" (React Quill) - Renomeado de "Oração"

**Estrutura Visual Melhorada:**
- 🎨 Seções separadas com `<Divider />` e títulos `<Typography variant="h6">`
- 🎨 Agrupamento lógico: Citação → Conteúdo → Referências → Oração

---

### 2. DevotionalList.jsx

**Colunas Adicionadas na Tabela:**
- ✅ "Dia" - Mostra `day_number`
- ✅ "Tags" - Mostra até 2 tags + contador (+N)
- ✅ "Data Publicação" atualizada para usar `publish_date`

**Melhorias Visuais:**
- 🎨 Tags exibidas como Chips pequenos
- 🎨 Contador visual quando há mais de 2 tags

---

## 📁 Estrutura de Dados Atualizada

### Formato da API (Resposta):

```json
{
  "devotional": {
    "id": 1,
    "slug": "confianca-em-deus",
    "publish_date": "2025-12-13",
    "day_number": 1,
    "estimated_duration_minutes": 10,
    "tags": ["fé", "confiança", "mulheres"],
    "is_published": true,

    "title": "Confiança em Deus",
    "quote_author": "C.S. Lewis",
    "quote_text": "Você nunca é velho demais para definir outro objetivo...",
    "opening_inspiration": "<p>Hoje vamos refletir sobre...</p>",
    "teaching_content": "<p>O Senhor é o nosso pastor...</p>",
    "reflection_questions": [
      "Como você tem demonstrado confiança em Deus?",
      "Quais áreas da sua vida precisam de mais fé?"
    ],
    "action_step": "Ore pela manhã agradecendo a Deus por 3 bênçãos específicas.",
    "closing_prayer": "<p>Senhor, ajuda-me a confiar em Ti...</p>",

    "author": { "id": 1, "slug": "autor", "name": "Nome Autor", "bio": "..." },
    "theme": { "id": 1, "slug": "fe", "name": "Fé", "description": "..." },
    "biblical_references": [
      {
        "id": 1,
        "book": "psalms",
        "chapter": 23,
        "verse_start": 1,
        "verse_end": null,
        "reference_text": "Salmos 23:1",
        "scripture_text": {
          "pt": "O Senhor é o meu pastor...",
          "en": "The Lord is my shepherd..."
        }
      }
    ],

    "created_at": "2025-12-12T...",
    "updated_at": "2025-12-12T..."
  }
}
```

---

## 🔄 Mapeamento de Campos (GlowUp ↔ API)

| **GlowUp App** | **API de Devocionais** | **Tipo** |
|----------------|------------------------|----------|
| `title` | `title` | string |
| `publish_date` | `publish_date` | date |
| `published` | `is_published` | boolean |
| `day_number` | `day_number` | integer |
| `estimated_duration_minutes` | `estimated_duration_minutes` | integer |
| `tags` | `tags` | array |
| `quote_author` | `quote_author` | string |
| `quote_text` | `quote_text` | string |
| `scripture_reference` | `biblical_references[].reference_text` | string |
| `scripture_text` | `biblical_references[].scripture_text` | jsonb |
| `opening_inspiration` | `opening_inspiration` | text |
| `teaching_content` | `teaching_content` | text |
| `reflection_questions` | `reflection_questions` | jsonb |
| `action_step` | `action_step` | text |
| `closing_prayer` | `closing_prayer` | text |

---

## ✅ Checklist de Implementação

### Backend:
- [x] Migration 006 - Adicionar campos em `devotionals`
- [x] Migration 007 - Adicionar campos em `devotional_contents`
- [x] Migration 008 - Adicionar `scripture_text` em `biblical_references`
- [x] Atualizar Model `Devotional.js`
- [x] Atualizar Controller `devotionalController.js`
- [x] Atualizar Rotas com validações

### Frontend:
- [x] Atualizar `DevotionalForm.jsx` com todos os campos
- [x] Atualizar `DevotionalList.jsx` com novas colunas
- [x] Manter compatibilidade multi-idioma (PT/EN)

### Próximos Passos:
- [ ] Executar migrations no Supabase
- [ ] Testar CRUD completo
- [ ] Integrar com app GlowUp

---

## 🚀 Como Aplicar as Mudanças

### 1. Executar Migrations no Supabase:

```sql
-- Execute no SQL Editor do Supabase, nesta ordem:

-- 1. Migration 006
-- Cole o conteúdo de: backend/src/database/migrations/006_add_devotional_fields.sql

-- 2. Migration 007
-- Cole o conteúdo de: backend/src/database/migrations/007_add_content_fields.sql

-- 3. Migration 008
-- Cole o conteúdo de: backend/src/database/migrations/008_add_scripture_text.sql
```

### 2. Reiniciar Backend:

```bash
cd backend
npm run dev
```

### 3. Reiniciar Admin Panel:

```bash
cd admin-panel
npm run dev
```

### 4. Testar:
- Criar novo devocional com todos os campos
- Editar devocional existente
- Verificar listagem
- Testar publicação

---

## 📝 Notas Importantes

1. **Compatibilidade Retroativa**:
   - Campos antigos foram renomeados mas mantém funcionalidade
   - Novos campos são opcionais (exceto `teaching_content` e `closing_prayer`)

2. **Multi-idioma Preservado**:
   - Todos os novos campos de conteúdo suportam PT e EN
   - App GlowUp pode expandir para inglês no futuro

3. **scripture_text em JSONB**:
   - Permite armazenar múltiplas versões da Bíblia
   - Formato flexível para futuras expansões

4. **Tags para Categorização**:
   - Útil para busca e filtros no app
   - Pode ser usado para recomendações personalizadas

---

## 🎯 Compatibilidade com GlowUp

Esta API agora está **100% compatível** com a estrutura de dados do app GlowUp, incluindo:
- ✅ Citação Diária
- ✅ Passagem Bíblica com texto completo
- ✅ Estrutura completa do devocional (abertura, ensino, reflexão, ação, oração)
- ✅ Metadados (tags, duração, dia do plano)
- ✅ Suporte a `publish_date` para publicação diária

**Ready to integrate!** 🚀
