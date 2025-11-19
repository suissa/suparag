# Chatbot WhatsApp com RAG

Sistema de chatbot integrado ao WhatsApp que utiliza busca semântica (RAG) para responder perguntas baseadas em documentos carregados.

## Arquitetura

```
WhatsApp → Evolution API → Webhook → RAG Search → LLM → WhatsApp
```

### Fluxo de Processamento

1. **Recebimento**: Mensagem chega via webhook da Evolution API
2. **Extração**: Texto é extraído da mensagem
3. **Embedding**: Gera embedding da pergunta usando OpenRouter
4. **Busca RAG**: Busca documentos similares no Supabase usando pgvector
5. **Contexto**: Monta contexto com os documentos mais relevantes
6. **LLM**: Gera resposta usando GPT-3.5-turbo com o contexto
7. **Formatação**: Formata texto para WhatsApp (remove emojis complexos, ajusta markdown)
8. **Envio**: Envia resposta de volta via Evolution API

## Arquivos Principais

### `server/src/routes/webhook.ts`
- Recebe webhooks da Evolution API
- Processa diferentes tipos de mensagem (texto, imagem, áudio)
- Função `processConversation()`: implementa o fluxo RAG completo
- Função `whatsappTextMessageFormatter()`: formata texto para WhatsApp

### `server/src/services/evolutionService.ts`
- Gerencia instâncias WhatsApp
- Método `sendTextMessage()`: envia mensagens de texto
- Método `findConnectedInstance()`: busca instância conectada automaticamente

### `server/src/services/embeddingService.ts`
- Gera embeddings usando OpenRouter
- Método `generateCompletion()`: gera respostas com LLM

## Configuração

### 1. Variáveis de Ambiente

Certifique-se de ter no `.env`:

```env
# Evolution API
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE_PREFIX=neuropgrag

# OpenRouter (para embeddings e LLM)
OPENROUTER_API_KEY=sk-or-v1-...

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
```

### 2. Webhook da Evolution API

Configure o webhook na Evolution API para apontar para:

```
POST http://seu-servidor:4000/api/v1/webhook
```

### 3. Instância WhatsApp

Você precisa ter uma instância WhatsApp conectada. Use uma das opções:

**Opção A: Criar nova instância**
```bash
curl -X POST http://localhost:4000/api/v1/whatsapp/connect \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "minha-sessao"}'
```

**Opção B: Vincular instância existente**
```bash
curl -X POST http://localhost:4000/api/v1/whatsapp/link \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "minha-sessao",
    "instanceName": "neuropgrag_1234567890_abc123"
  }'
```

## Testando o Chatbot

### Método 1: Script de Teste

Use o script fornecido para simular uma mensagem:

```bash
# Usando valores padrão
npm --prefix server run test:webhook

# Com mensagem e telefone customizados
npm --prefix server run test:webhook -- "Qual é o horário de funcionamento?" "5511999999999"
```

### Método 2: Enviar Mensagem Real

1. Certifique-se de que o servidor está rodando:
```bash
npm --prefix server run dev
```

2. Envie uma mensagem WhatsApp para o número conectado

3. Aguarde a resposta (processamento leva ~5-10 segundos)

### Método 3: cURL Direto

```bash
curl -X POST http://localhost:4000/api/v1/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "test",
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "TEST123"
      },
      "pushName": "Teste",
      "message": {
        "conversation": "Olá, como você pode me ajudar?"
      },
      "messageType": "conversation",
      "messageTimestamp": 1234567890
    }
  }'
```

## Formatação de Texto WhatsApp

O sistema formata automaticamente o texto para WhatsApp:

### Suportado
- **Negrito**: `*texto*`
- _Itálico_: `_texto_`
- ~Tachado~: `~texto~`
- ```Código```: ` ```texto``` `

### Removido Automaticamente
- Emojis complexos (podem causar problemas)
- Múltiplas quebras de linha (máximo 2)
- Espaços múltiplos
- Caracteres especiais não suportados

### Limites
- Máximo de 4000 caracteres por mensagem
- Texto é truncado se exceder o limite

## Logs e Debugging

O sistema gera logs detalhados em cada etapa:

```
💬 Processando conversa: [texto da mensagem]
📱 Telefone: [número]
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

## Troubleshooting

### Erro: "Nenhuma instância WhatsApp conectada"
- Verifique se há uma instância conectada: `GET /api/v1/whatsapp/status`
- Conecte uma nova instância ou vincule uma existente

### Erro: "API key do OpenRouter não configurada"
- Verifique se `OPENROUTER_API_KEY` está no `.env`
- Ou configure no banco de dados na tabela `settings`

### Erro: "Falha ao gerar embedding"
- Verifique sua API key do OpenRouter
- Verifique se tem créditos disponíveis
- Verifique conectividade com `https://openrouter.ai`

### Mensagem não chega no WhatsApp
- Verifique logs do servidor para erros
- Verifique se o número está no formato correto: `5511999999999`
- Verifique se a instância está realmente conectada
- Teste com o script de teste primeiro

### Resposta vazia ou genérica
- Verifique se há documentos carregados no sistema
- Verifique o threshold de similaridade (padrão: 0.3)
- Aumente o `match_count` para buscar mais documentos

## Próximos Passos

### Melhorias Planejadas
- [ ] Suporte a mensagens de imagem (OCR)
- [ ] Suporte a mensagens de áudio (transcrição)
- [ ] Cache de respostas frequentes
- [ ] Histórico de conversas
- [ ] Múltiplos idiomas
- [ ] Respostas em streaming
- [ ] Analytics e métricas

### Customização
- Ajuste o prompt no `processConversation()` para mudar o comportamento
- Ajuste `match_threshold` para controlar relevância mínima
- Ajuste `match_count` para controlar quantidade de contexto
- Ajuste `max_tokens` no LLM para respostas mais longas/curtas
- Ajuste `temperature` para respostas mais criativas/conservadoras

## Segurança

- Webhook não valida assinatura (adicionar em produção)
- Mensagens de grupo são ignoradas automaticamente
- Mensagens próprias são ignoradas automaticamente
- Números são sanitizados antes do processamento
- Texto é limitado para evitar overflow

## Performance

- Embedding: ~1-2 segundos
- Busca RAG: ~100-300ms
- LLM: ~2-5 segundos
- Total: ~5-10 segundos por mensagem

## Custos

Usando OpenRouter com GPT-3.5-turbo:
- Embedding: ~$0.0001 por mensagem
- LLM: ~$0.001-0.002 por mensagem
- Total: ~$0.0015 por mensagem

Para 1000 mensagens/mês: ~$1.50
