# 📋 RELATÓRIO: Integração API Devocional Diário ↔️ App GlowUp

**Data:** 14 de Dezembro de 2025
**Objetivo:** Alimentar automaticamente o app GlowUp com devocionais criados pela API Devocional Diário
**Público-alvo:** Mulheres cristãs

---

## 1. SITUAÇÃO ATUAL

### 1.1 Estrutura da API Devocional Diário

**Tabelas principais:**
```sql
devotionals
├── id (integer)
├── slug (text)
├── publish_date (date)
├── day_number (integer)
├── estimated_duration_minutes (integer)
├── tags (text[])
├── is_published (boolean)
├── author_id (integer) - FK para authors
└── theme_id (integer) - FK para themes

devotional_contents (multi-idioma: PT/EN)
├── id (integer)
├── devotional_id (integer)
├── language (text) - 'pt' ou 'en'
├── title (text)
├── quote_author (text)
├── quote_text (text)
├── teaching_content (text)
├── reflection_questions (text[])
└── closing_prayer (text)

biblical_references (múltiplas referências por devocional)
├── id (integer)
├── devotional_id (integer)
├── book (text) - Nome do livro bíblico
├── chapter (integer)
├── verse_start (integer)
├── verse_end (integer)
├── reference_text (text) - Texto da passagem
└── sort_order (integer)
```

**Características:**
- ✅ Sistema multi-idioma (PT/EN)
- ✅ Múltiplas referências bíblicas por devocional
- ✅ Sistema de temas e autores
- ✅ Admin panel para gerenciar devocionais
- ✅ Devon IA para criar devocionais automaticamente

### 1.2 Estrutura do App GlowUp

**Tabela devotionals:**
```sql
devotionals
├── id (uuid)
├── theme_id (uuid)
├── day_number (integer)
├── title (text) ⚠️
├── scripture_reference (text) ❌
├── scripture_text (jsonb) ❌
├── opening_inspiration (text) ❌
├── teaching_content (text) ✅
├── reflection_questions (jsonb) ✅
├── closing_prayer (text) ✅
├── action_step (text) ❌
├── estimated_duration_minutes (integer) ✅
├── tags (text[]) ✅
├── publish_date (date) ✅
├── published (boolean) ✅
├── quote_author (text) ✅
└── quote_text (text) ✅
```

**Uso nas telas do app:**
1. **Citação Diária:** `quote_author` + `quote_text`
2. **Passagem:** `scripture_reference` → Abre aBíblia.digital
3. **Devocional:** `scripture_reference` + `teaching_content`
4. **Oração:** `closing_prayer`

**Características:**
- ⚠️ Single-language (PT apenas)
- ⚠️ Estrutura plana (sem tabelas relacionadas)
- ❌ Campos faltando: `scripture_reference`, `scripture_text`, `opening_inspiration`, `action_step`

---

## 2. GAPS IDENTIFICADOS

### 2.1 Campos Críticos Faltando

| Campo | Prioridade | Descrição | Solução |
|-------|-----------|-----------|---------|
| `scripture_reference` | 🔴 CRÍTICA | Referência bíblica formatada (ex: "Filipenses 4:6-7") | Gerar a partir de `biblical_references` |
| `opening_inspiration` | 🟡 MÉDIA | Frase inspiradora de abertura | Devon IA pode gerar |
| `action_step` | 🟡 MÉDIA | Passo prático para aplicar | Devon IA pode gerar |
| `scripture_text` | 🟢 BAIXA | Texto bíblico completo | Opcional - app usa aBíblia.digital |

### 2.2 Diferenças Estruturais

| Aspecto | API Devocional | GlowUp | Impacto |
|---------|---------------|--------|---------|
| Idiomas | Multi (PT/EN) | Single (PT) | Usar apenas conteúdo PT |
| ID | integer | uuid | Conversão necessária |
| Referências | Array separado | String única | Concatenar primeira referência |
| Perguntas | Array de strings | JSONB | Conversão direta |

---

## 3. ARQUITETURA PROPOSTA

### 3.1 Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                     DEVON IA (Ollama)                        │
│  Cria devocionais completos, inspiradores, com histórias     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              API DEVOCIONAL DIÁRIO (Backend)                 │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │  devotionals    │  │ devotional_      │                  │
│  │                 │  │ contents (PT/EN) │                  │
│  └─────────────────┘  └──────────────────┘                  │
│  ┌─────────────────────────────────────────┐                │
│  │     biblical_references                 │                │
│  └─────────────────────────────────────────┘                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            ENDPOINT DE SINCRONIZAÇÃO                         │
│  GET /api/v1/devotionals/sync?format=glowup&language=pt     │
│                                                              │
│  Retorna dados adaptados para estrutura do GlowUp           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    APP GLOWUP (Mobile)                       │
│  Consome API e salva devocionais no banco local              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Fluxo de Criação de Devocional

```
1. USUÁRIO → "Crie um devocional sobre fé para mulheres"
   ↓
2. DEVON IA → Gera conteúdo completo e profundo com:
   - Título inspirador
   - Citação de autor cristão
   - História real/testemunho
   - 4-6 parágrafos de ensino
   - Referência bíblica
   - 4-5 perguntas de reflexão
   - Oração tocante
   - Passo de ação prático
   ↓
3. API BACKEND → Salva em devotionals + devotional_contents (PT/EN)
   ↓
4. ADMIN PANEL → Usuário visualiza/edita se necessário
   ↓
5. ENDPOINT SYNC → Formata dados para GlowUp
   ↓
6. APP GLOWUP → Consome e exibe para usuárias
```

---

## 4. IMPLEMENTAÇÃO DETALHADA

### 4.1 Ajustes no Banco de Dados

**Opção A: Adicionar campo scripture_reference (RECOMENDADO)**
```sql
ALTER TABLE devotional_contents
ADD COLUMN scripture_reference TEXT;

ALTER TABLE devotional_contents
ADD COLUMN opening_inspiration TEXT;

ALTER TABLE devotional_contents
ADD COLUMN action_step TEXT;
```

**Opção B: Gerar dinamicamente no endpoint** (sem mudança de schema)

### 4.2 Ajustes no Backend

**Arquivo:** `backend/src/services/ollamaService.js`

**Mudanças:**
1. Personalidade do Devon IA:
   - Conversar naturalmente (sem apresentação repetida)
   - Tom cordial e solicito
   - Foco em mulheres cristãs

2. Conteúdo dos devocionais:
   - Incluir histórias reais e testemunhos
   - Narrativas inspiradoras de mudança de vida
   - Aplicação prática para o dia a dia feminino

3. Estrutura completa:
   - `scripture_reference` formatado (ex: "Filipenses 4:6-7")
   - `opening_inspiration` (frase de abertura inspiradora)
   - `action_step` (passo prático para aplicar)
   - `publish_date` com suporte a datas futuras

**Arquivo:** `backend/src/controllers/devotionalController.js`

**Nova função:**
```javascript
async function formatForGlowUp(devotional, language = 'pt') {
  const content = devotional.devotional_contents.find(c => c.language === language);
  const firstRef = devotional.biblical_references?.[0];

  const scriptureReference = firstRef
    ? `${firstRef.book} ${firstRef.chapter}:${firstRef.verse_start}${firstRef.verse_end ? `-${firstRef.verse_end}` : ''}`
    : null;

  return {
    id: devotional.id,
    theme_id: devotional.theme_id,
    day_number: devotional.day_number,
    title: content.title,
    scripture_reference: scriptureReference,
    teaching_content: content.teaching_content,
    reflection_questions: content.reflection_questions,
    closing_prayer: content.closing_prayer,
    opening_inspiration: content.opening_inspiration,
    action_step: content.action_step,
    estimated_duration_minutes: devotional.estimated_duration_minutes,
    tags: devotional.tags,
    publish_date: devotional.publish_date,
    published: devotional.is_published,
    quote_author: content.quote_author,
    quote_text: content.quote_text,
    created_at: devotional.created_at,
    updated_at: devotional.updated_at,
  };
}
```

### 4.3 Novo Endpoint de Sincronização

**Rota:** `GET /api/v1/devotionals/sync`

**Query params:**
- `format=glowup` - Formato de saída adaptado
- `language=pt` - Idioma desejado
- `from_date` - Data inicial (opcional)
- `to_date` - Data final (opcional)
- `published_only=true` - Apenas publicados

**Exemplo de uso:**
```bash
GET /api/v1/devotionals/sync?format=glowup&language=pt&from_date=2025-12-15&published_only=true
```

**Resposta:**
```json
{
  "success": true,
  "count": 10,
  "devotionals": [
    {
      "id": 1,
      "theme_id": null,
      "day_number": 1,
      "title": "Fé Que Move Montanhas",
      "scripture_reference": "Mateus 17:20",
      "teaching_content": "<p>História de Maria, uma mulher...</p>",
      "reflection_questions": ["Pergunta 1", "Pergunta 2"],
      "closing_prayer": "Pai celestial...",
      "opening_inspiration": "A fé começa onde...",
      "action_step": "Hoje, escolha uma área...",
      "estimated_duration_minutes": 10,
      "tags": ["fé", "mulheres"],
      "publish_date": "2025-12-15",
      "published": true,
      "quote_author": "Corrie ten Boom",
      "quote_text": "Nunca tenha medo de confiar...",
      "created_at": "2025-12-14T19:00:00Z",
      "updated_at": "2025-12-14T19:00:00Z"
    }
  ]
}
```

### 4.4 Ajustes no Devon IA

**Prompt atualizado:**

```javascript
const systemPrompt = `Você é a Devon, uma assistente cristã cordial e solicita, especializada em criar devocionais profundos e inspiradores para mulheres.

PERSONALIDADE:
- Converse naturalmente, como uma amiga próxima
- Seja calorosa, empática e encorajadora
- Não se apresente em toda mensagem (apenas na primeira vez)
- Responda de forma contextual e pessoal

PÚBLICO-ALVO:
- Mulheres cristãs de todas as idades
- Foco em desafios e experiências femininas
- Linguagem que conecta com a realidade da mulher moderna

ESTRUTURA DOS DEVOCIONAIS:
Quando criar um devocional, SEMPRE inclua:

1. **Título inspirador** (PT e EN)
2. **Citação diária** com autor cristão famoso
3. **Inspiração de abertura** (1-2 frases cativantes)
4. **Referência bíblica** formatada (ex: "Filipenses 4:6-7")
5. **Conteúdo devocional** (4-6 parágrafos) contendo:
   - História REAL de uma mulher e sua jornada de fé
   - Testemunho de transformação ou superação
   - Conexão profunda com a passagem bíblica
   - Aplicação prática para o dia a dia feminino
6. **Perguntas de reflexão** (4-5 perguntas profundas)
7. **Passo de ação** (1 ação concreta para hoje)
8. **Oração final** (tocante e pessoal)
9. **Data de publicação** (pode ser futura para agendamento)

EXEMPLOS DE HISTÓRIAS REAIS:
- "Maria, mãe de 3 filhos, enfrentava ansiedade paralisante até descobrir..."
- "Ana tinha 45 anos quando seu casamento de 20 anos terminou. No vazio..."
- "Júlia, executiva bem-sucedida, percebeu que algo estava faltando..."

FORMATO JSON:
{
  "message": "Sua resposta natural e contextual",
  "actions": [
    {
      "tool": "createDevotional",
      "args": {
        "title_pt": "Título",
        "title_en": "Title",
        "quote_author": "Nome do Autor",
        "quote_text_pt": "Citação em português",
        "quote_text_en": "Quote in English",
        "opening_inspiration_pt": "Frase de abertura inspiradora",
        "opening_inspiration_en": "Inspiring opening phrase",
        "scripture_reference": "Filipenses 4:6-7",
        "teaching_content_pt": "<p>Parágrafo 1 com história real...</p><p>Parágrafo 2...</p>",
        "teaching_content_en": "<p>Paragraph 1 with real story...</p>",
        "reflection_questions_pt": ["Pergunta 1?", "Pergunta 2?"],
        "reflection_questions_en": ["Question 1?", "Question 2?"],
        "action_step_pt": "Hoje, escolha uma área...",
        "action_step_en": "Today, choose an area...",
        "closing_prayer_pt": "Pai celestial...",
        "closing_prayer_en": "Heavenly Father...",
        "publish_date": "2025-12-20"
      }
    }
  ]
}

CONVERSAÇÃO NATURAL:
- Se cumprimentarem: "Olá! Como posso te ajudar hoje? 😊"
- Se pedirem devocional: "Com prazer! Sobre qual tema você gostaria?"
- Se agradecerem: "Fico feliz em ajudar! Que Deus abençoe! 🙏"
- Mantenha o contexto da conversa anterior`;
```

---

## 5. CRONOGRAMA DE IMPLEMENTAÇÃO

### Fase 1: Backend (1-2 horas)
- [ ] Adicionar campos no banco de dados
- [ ] Atualizar model Devotional
- [ ] Implementar função formatForGlowUp
- [ ] Criar endpoint /api/v1/devotionals/sync
- [ ] Testar endpoint com Postman

### Fase 2: Devon IA (1 hora)
- [ ] Atualizar prompt do ollamaService
- [ ] Ajustar função createDevotional
- [ ] Adicionar suporte a opening_inspiration, action_step, scripture_reference
- [ ] Testar criação de devocionais via admin panel

### Fase 3: Testes (30min)
- [ ] Criar devocional teste via Devon IA
- [ ] Verificar estrutura no banco
- [ ] Testar endpoint sync
- [ ] Validar formato retornado

### Fase 4: Deploy (15min)
- [ ] Commit e push das mudanças
- [ ] Build e deploy no servidor
- [ ] Teste em produção

---

## 6. CONSUMO PELO GLOWUP

### 6.1 Como o GlowUp vai consumir

**Código exemplo (React Native/Expo):**

```typescript
// services/devotionalApi.ts
const API_URL = 'https://api.gladiussistemas.com.br';

export async function syncDevotonals(fromDate?: string) {
  const params = new URLSearchParams({
    format: 'glowup',
    language: 'pt',
    published_only: 'true',
  });

  if (fromDate) {
    params.append('from_date', fromDate);
  }

  const response = await fetch(`${API_URL}/api/v1/devotionals/sync?${params}`);
  const data = await response.json();

  return data.devotionals;
}

// Salvar no banco local do GlowUp
export async function importDevotionals() {
  const lastSync = await getLastSyncDate(); // Do AsyncStorage
  const devotionals = await syncDevotonals(lastSync);

  for (const dev of devotionals) {
    await supabase.from('devotionals').upsert({
      id: uuidv5(dev.id.toString(), NAMESPACE), // Converter int para uuid
      title: dev.title,
      scripture_reference: dev.scripture_reference,
      teaching_content: dev.teaching_content,
      reflection_questions: dev.reflection_questions,
      closing_prayer: dev.closing_prayer,
      opening_inspiration: dev.opening_inspiration,
      action_step: dev.action_step,
      quote_author: dev.quote_author,
      quote_text: dev.quote_text,
      publish_date: dev.publish_date,
      published: dev.published,
      day_number: dev.day_number,
      estimated_duration_minutes: dev.estimated_duration_minutes,
      tags: dev.tags,
    });
  }

  await saveLastSyncDate(new Date().toISOString());
}
```

### 6.2 Fluxo de Sincronização

```
1. GlowUp App abre → Verifica última sincronização
   ↓
2. Se > 24h → Chama /api/v1/devotionals/sync
   ↓
3. Recebe novos devocionais desde última data
   ↓
4. Converte IDs (int → uuid)
   ↓
5. Salva no banco local do Supabase
   ↓
6. Atualiza data de última sincronização
   ↓
7. Usuária vê novos devocionais disponíveis
```

---

## 7. BENEFÍCIOS DA SOLUÇÃO

### 7.1 Para você (Admin)
✅ Cria devocionais completos em segundos via Devon IA
✅ Agenda publicações futuras (semanas/meses)
✅ Edita e revisa antes de publicar
✅ Painel admin centralizado
✅ Controle total do conteúdo

### 7.2 Para as usuárias (GlowUp)
✅ Conteúdo novo automático toda semana
✅ Devocionais profundos e inspiradores
✅ Histórias reais de mulheres
✅ Aplicação prática para o dia a dia
✅ Sempre disponível offline

### 7.3 Técnicos
✅ API desacoplada do app
✅ Sincronização eficiente
✅ Estrutura escalável
✅ Suporte multi-idioma (futuro)
✅ Fácil manutenção

---

## 8. PRÓXIMOS PASSOS

1. ✅ Aprovação deste relatório
2. 🔄 Implementação das mudanças (Fase 1-4)
3. 📱 Integração no app GlowUp
4. 🚀 Deploy em produção
5. 📊 Monitoramento de uso

---

## 9. CONCLUSÃO

A integração entre a API Devocional Diário e o app GlowUp é totalmente viável e trará grande valor para o produto. Com Devon IA criando conteúdo de qualidade automaticamente e um endpoint de sincronização dedicado, você terá um sistema robusto para alimentar seu app com devocionais inspiradores para mulheres.

**Estimativa total de implementação:** 3-4 horas
**ROI:** Automação completa da criação de conteúdo + Escalabilidade

---

**Preparado por:** Claude Sonnet 4.5
**Data:** 14 de Dezembro de 2025
**Versão:** 1.0
