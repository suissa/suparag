# Implementação do Chatbot WhatsApp com RAG

## ✅ O que foi implementado

### 1. Função de Formatação de Texto (`whatsappTextMessageFormatter`)
**Arquivo**: `server/src/routes/webhook.ts`

Formata texto para ser compatível com WhatsApp:
- Remove emojis complexos que podem causar problemas
- Normaliza quebras de linha (máximo 2 consecutivas)
- Remove espaços múltiplos
- Limita a 4000 caracteres
- Converte markdown para formato WhatsApp:
  - `**texto**` → `*texto*` (negrito)
  - `~~texto~~` → `~texto~` (tachado)
  - `` `texto` `` → ` ```texto``` ` (código)

### 2. Método de Envio de Mensagem (`sendTextMessage`)
**Arquivo**: `server/src/services/evolutionService.ts`

Envia mensagens de texto via WhatsApp:
- Busca automaticamente uma instância conectada
- Usa a SDK `sdk-evolution-chatbot`
- Logs detalhados de cada etapa
- Tratamento de erros robusto

```typescript
await evolutionService.sendTextMessage(phoneNumber, text);
```

### 3. Busca de Instância Conectada (`findConnectedInstance`)
**Arquivo**: `server/src/services/evolutionService.ts`

Busca automaticamente a primeira instância WhatsApp conectada:
- Verifica instâncias locais primeiro
- Se não encontrar, busca na Evolution API
- Retorna o `instanceName` da primeira instância conectada

### 4. Geração de Respostas com LLM (`generateCompletion`)
**Arquivo**: `server/src/services/embeddingService.ts`

Gera respostas usando GPT-3.5-turbo via OpenRouter:
- Suporta customização do modelo
- Configurável: `max_tokens`, `temperature`
- Usa mesma API key dos embeddings
- Logs detalhados

```typescript
const response = await embeddingService.generateCompletion(prompt);
```

### 5. Processamento Completo de Conversas (`processConversation`)
**Arquivo**: `server/src/routes/webhook.ts`

Implementa o fluxo RAG completo:

```
1. Extrai texto da mensagem
2. Gera embedding da pergunta (OpenRouter)
3. Busca documentos similares (Supabase pgvector)
4. Monta contexto com documentos relevantes
5. Gera resposta com LLM usando contexto
6. Formata resposta para WhatsApp
7. Envia resposta via Evolution API
```

**Parâmetros de busca**:
- `match_threshold`: 0.3 (30% de similaridade mínima)
- `match_count`: 3 (até 3 documentos)

**Tratamento de erros**:
- Envia mensagem de erro amigável ao usuário
- Logs detalhados para debugging

### 6. Script de Teste (`test-whatsapp-webhook.ts`)
**Arquivo**: `server/scripts/test-whatsapp-webhook.ts`

Script para testar o webhook sem precisar enviar mensagem real:

```bash
# Teste básico
npm --prefix server run test:webhook

# Teste com mensagem e telefone customizados
npm --prefix server run test:webhook -- "Sua pergunta" "5511999999999"
```

Simula payload da Evolution API e envia para o webhook local.

### 7. Documentação Completa
**Arquivo**: `server/WHATSAPP-CHATBOT.md`

Documentação detalhada incluindo:
- Arquitetura e fluxo de processamento
- Configuração passo a passo
- 3 métodos de teste diferentes
- Troubleshooting completo
- Informações de performance e custos
- Próximos passos e melhorias planejadas

## 🔧 Arquivos Modificados

1. **server/src/routes/webhook.ts**
   - Adicionado imports: `EvolutionService`, `embeddingService`, `supabase`
   - Criada função `whatsappTextMessageFormatter()`
   - Implementada função `processConversation()` com RAG completo

2. **server/src/services/evolutionService.ts**
   - Adicionado método `sendTextMessage()`
   - Adicionado método privado `findConnectedInstance()`

3. **server/src/services/embeddingService.ts**
   - Adicionado método `generateCompletion()`
   - Corrigidos tipos TypeScript
   - Removido import não utilizado

4. **server/package.json**
   - Adicionado script `test:webhook`

## 📋 Como Usar

### Passo 1: Configurar Variáveis de Ambiente

Certifique-se de ter no `.env`:

```env
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key
OPENROUTER_API_KEY=sk-or-v1-...
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
```

### Passo 2: Ter uma Instância WhatsApp Conectada

O sistema busca automaticamente qualquer instância conectada. Você pode:

**Opção A**: Criar nova instância
```bash
curl -X POST http://localhost:4000/api/v1/whatsapp/connect \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "minha-sessao"}'
```

**Opção B**: Vincular instância existente
```bash
curl -X POST http://localhost:4000/api/v1/whatsapp/link \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "minha-sessao",
    "instanceName": "neuropgrag_1234567890_abc123"
  }'
```

### Passo 3: Configurar Webhook na Evolution API

Configure o webhook para apontar para:
```
POST http://seu-servidor:4000/api/v1/webhook
```

### Passo 4: Testar

**Método 1: Script de teste**
```bash
npm --prefix server run test:webhook -- "Qual é o horário?" "5511999999999"
```

**Método 2: Enviar mensagem real**
Envie uma mensagem WhatsApp para o número conectado e aguarde a resposta.

## 🎯 Fluxo de Dados

```
┌─────────────┐
│  WhatsApp   │
│   Usuário   │
└──────┬──────┘
       │ Mensagem
       ▼
┌─────────────┐
│ Evolution   │
│     API     │
└──────┬──────┘
       │ Webhook
       ▼
┌─────────────────────────────────────────┐
│  processConversation()                  │
│  ┌───────────────────────────────────┐  │
│  │ 1. Extrai texto                   │  │
│  │ 2. Gera embedding (OpenRouter)    │  │
│  │ 3. Busca docs (Supabase pgvector) │  │
│  │ 4. Monta contexto                 │  │
│  │ 5. Gera resposta (LLM)            │  │
│  │ 6. Formata para WhatsApp          │  │
│  │ 7. Envia resposta                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│ Evolution   │
│     API     │
└──────┬──────┘
       │ Resposta
       ▼
┌─────────────┐
│  WhatsApp   │
│   Usuário   │
└─────────────┘
```

## 📊 Performance

Tempo médio de processamento por mensagem:
- Embedding: ~1-2 segundos
- Busca RAG: ~100-300ms
- LLM: ~2-5 segundos
- **Total: ~5-10 segundos**

## 💰 Custos Estimados

Usando OpenRouter com GPT-3.5-turbo:
- Embedding: ~$0.0001 por mensagem
- LLM: ~$0.001-0.002 por mensagem
- **Total: ~$0.0015 por mensagem**

Para 1000 mensagens/mês: **~$1.50**

## 🔍 Logs de Exemplo

```
💬 Processando conversa: Qual é o horário de funcionamento?
📱 Telefone: 5511999999999
🔄 Gerando embedding da pergunta...
✅ Embedding gerado: 1536 dimensões
🔍 Buscando documentos similares...
📚 Encontrados 3 documentos relevantes
🤖 Gerando resposta com LLM...
✅ Resposta gerada pelo LLM
📝 Resposta formatada (245 caracteres)
📤 Enviando resposta via WhatsApp...
✅ Resposta enviada com sucesso!
```

## 🐛 Troubleshooting

### Erro: "Nenhuma instância WhatsApp conectada"
✅ **Solução**: Conecte ou vincule uma instância WhatsApp

### Erro: "API key do OpenRouter não configurada"
✅ **Solução**: Configure `OPENROUTER_API_KEY` no `.env`

### Mensagem não chega no WhatsApp
✅ **Soluções**:
1. Verifique logs do servidor
2. Confirme que o número está no formato correto: `5511999999999`
3. Teste com o script primeiro: `npm --prefix server run test:webhook`

### Resposta vazia ou genérica
✅ **Soluções**:
1. Verifique se há documentos carregados
2. Ajuste o `match_threshold` (padrão: 0.3)
3. Aumente o `match_count` para buscar mais documentos

## 🚀 Próximos Passos

Melhorias sugeridas:
- [ ] Suporte a mensagens de imagem (OCR)
- [ ] Suporte a mensagens de áudio (transcrição com Whisper)
- [ ] Cache de respostas frequentes
- [ ] Histórico de conversas por usuário
- [ ] Múltiplos idiomas
- [ ] Respostas em streaming
- [ ] Analytics e métricas de uso
- [ ] Rate limiting por usuário
- [ ] Validação de assinatura do webhook

## 📝 Notas Técnicas

### Formatação WhatsApp
- Remove emojis complexos para evitar problemas de encoding
- Limita a 4000 caracteres (WhatsApp suporta até 65536)
- Converte markdown para formato nativo do WhatsApp

### Busca RAG
- Usa threshold de 0.3 (30% de similaridade)
- Busca até 3 documentos mais relevantes
- Monta contexto formatado com relevância percentual

### LLM
- Modelo padrão: `openai/gpt-3.5-turbo`
- Max tokens: 500 (respostas concisas)
- Temperature: 0.7 (equilíbrio entre criatividade e precisão)

### Segurança
- Mensagens de grupo são ignoradas
- Mensagens próprias são ignoradas
- Números são sanitizados
- Texto é limitado para evitar overflow
- ⚠️ Webhook não valida assinatura (adicionar em produção)

## ✅ Checklist de Implementação

- [x] Função de formatação de texto para WhatsApp
- [x] Método de envio de mensagem via Evolution API
- [x] Busca automática de instância conectada
- [x] Geração de respostas com LLM
- [x] Processamento completo de conversas com RAG
- [x] Script de teste do webhook
- [x] Documentação completa
- [x] Tratamento de erros robusto
- [x] Logs detalhados para debugging
- [x] Commit com mensagem descritiva

## 🎉 Resultado

Sistema de chatbot WhatsApp totalmente funcional com busca RAG integrada, pronto para receber mensagens, processar com contexto de documentos e responder automaticamente!
