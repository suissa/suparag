# Server Repository Functionalities

Esta referência mapeia todos os módulos sob `server/src`, descrevendo cada função/endpoint e quais tabelas ou rotinas do banco (Supabase) tocam.

## Config & Bootstrap

### server/src/config/env.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `validateEnv()` | Garante que variáveis obrigatórias (Supabase, Evolution API, limites) existam e tenham formato válido antes do boot. | — |
| `env` | Objeto imutável com portas, credenciais e limites para Evolution, OpenRouter, áudio e upload. | — |

### server/src/config/supabase.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `supabase` | Cliente compartilhado do Supabase usado por todos os serviços/rotas. | Todas as tabelas referenciadas nas demais camadas |
| `Document` (tipo) | Tipagem utilizada pelos uploads de `documents`. | `documents` |

### server/src/index.ts
| Handler | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| Express bootstrap | Valida envs, registra middlewares, health check (`GET /health`) e monta todos os routers (docs, audio, charts etc.). | Depende das rotas montadas |

## Analytics, Relatórios e Scripts

### server/src/analytics/leadAnalysis.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `calculateLeadStatus(customerId)` | Classifica lead como `novo/ativo/quente/...` usando recência, volume e sentimento das mensagens. | `interactions` |
| `detectAbandonmentPoints(customerId)` | Procura gaps >7 dias nas mensagens e atribui um motivo provável para abandono. | `interactions` |
| `analyzeConversionIntent(customerId)` | Avalia probabilidade de conversão com base em palavras-chave, sentimento e engajamento. | `interactions` |
| `computeEngagementMetrics(customerId)` | Consolida métricas (tempo de resposta, sentiment, duração) e retorna score de atividade. | `interactions` |
| `analyzeAllLeads()` | Busca todos os clientes e gera ranking usando `computeEngagementMetrics`. | `customers`, `interactions` |

### server/src/reports/leadReport.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `generateLeadReport(outputDir)` | Gera `lead-insights.json/html` combinando métricas de `analyzeAllLeads`. Persistência só em disco. | Usa dados agregados de `customers/interactions` via analytics |
| `generateHTML(reportData)` | Template HTML do relatório com Chart.js. | — |

### server/src/scripts/importWhatsAppHistory.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `importWhatsAppHistory(folderPath, mappingFn)` | Lê JSONs, garante cliente, gera embeddings e injeta mensagens como interações WhatsApp. | `customers`, `interactions` |
| `findOrCreateCustomer(phone)` | Recupera cliente pelo telefone ou cria placeholder para import. | `customers` |

## Serviços de Domínio

### server/src/services/asrTranscriptionService.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `transcribe(audioPath, options, customerId?)` | Gera job em `audio_jobs`, chama provider (ElevenLabs/Whisper/Assembly) e atualiza status/resultados. | `audio_jobs` |
| `transcribeWithElevenLabs/Whisper/AssemblyAI()` | Implementações específicas para cada provedor, atualizando o job conforme resultado. | `audio_jobs` |
| `downloadAudio()` | Baixa buffer via HTTP ou filesystem antes da transcrição. | — |
| `estimateDuration()` | Estima duração do arquivo pelo tamanho. | — |
| `createAudioJob(data)` | Insere job TTS/ASR com status inicial. | `audio_jobs` |
| `updateAudioJob(id, updates)` | Persiste status, transcript, duração e metadados do job. | `audio_jobs` |

### server/src/services/elevenLabsTTSService.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `synthesize(text, options, customerId?)` | Cria job em `audio_jobs`, respeita preferências do cliente e grava o áudio no bucket configurado. | `audio_jobs`, `customers` (preferências) |
| `getCustomerPreferences(customerId)` | Busca voz, persona e comportamento de áudio do cliente. | `customers` |
| `createAudioJob()` / `updateAudioJob()` | Mesmo fluxo do serviço ASR para rastrear jobs de TTS. | `audio_jobs` |
| `saveAudioToStorage(buffer, filename)` | Persistência do binário em Supabase Storage (`audio-files/tts`). | Supabase Storage bucket |
| `estimateDuration()` | Calcula duração aproximada para metadados do job. | — |
| `listVoices()` / `getVoice(id)` | Proxy para APIs ElevenLabs para listar vozes disponíveis. | — |

### server/src/services/chartExplanationService.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `createExplanation(request)` | Gera texto (ou usa fornecido), insere linha em `chart_explanations` e, se possível, gera áudio com TTS atualizando o registro. | `chart_explanations`, `audio_jobs` (via TTS) |
| `generateExplanationText(metricSnapshot)` | Cria narrativa textual heurística sobre métricas. | — |
| `createExplanationRecord()` | Inserção inicial do texto e snapshot. | `chart_explanations` |
| `updateExplanationAudio()` / `addUserAudioComment()` | Atualiza campos de áudio automático ou comentário do usuário. | `chart_explanations` |
| `getExplanation(id)` / `listUserExplanations(userId)` | Recupera histórico de explicações filtrados por usuário/chart. | `chart_explanations` |

### server/src/services/whatsAppAudioProcessor.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `processAudioMessage(audioMessage, customerId?)` | Baixa áudio do Evolution, valida formato, salva no bucket, transcreve via ASR e cria interação textual. | `audio_jobs`, `interactions` |
| `downloadAudioFromWhatsApp(url)` | Efetua download do arquivo do Evolution API. | — |
| `validateAudioFormat(mime)` | Checa se o MIME está na allowlist. | — |
| `saveAudioToStorage(buffer, filename)` | Grava áudio bruto em Supabase Storage (`audio-files/whatsapp`). | Supabase Storage bucket |
| `createInteraction(data)` | Persiste transcript, caminho do áudio e metadados do canal. | `interactions` |
| `getCustomerAudioBehavior(customerId)` | Consulta preferência de tratamento de áudio. | `customers` |

### server/src/services/evolutionService.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `createInstance(sessionId)` | Cria instância WhatsApp via Evolution SDK e guarda em memória. | — |
| `getInstanceName(sessionId)` / `getInstanceData()` / `listInstances()` | Acessores para o mapa local de instâncias. | — |
| `checkStatus(instanceName)` | Consulta Evolution API e devolve estado (OPEN/CLOSED). | — |
| `getQRCode(instanceName)` | Obtém QR base64 necessário para pareamento. | — |
| `deleteInstance(instanceName)` | Remove instância da Evolution API e do cache in-memory. | — |

### server/src/services/logger.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `Logger.error/warn/info/debug()` | Logging estruturado com timestamp, contexto e formatação customizada. | — |
| `Logger.child(context)` | Cria logger filho com contexto adicional. | — |
| `createLogger(name, level?)` / `logger` | Factory e instância default usada nas integrações WhatsApp. | — |

### server/src/services/sseManager.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `addConnection(sessionId, res)` | Configura headers SSE e cadastra conexão. | — |
| `sendEvent(sessionId, event)` | Serializa evento no formato SSE (`event:`/`data:`) e envia. | — |
| `broadcast(event, sessionIds?)` | Dispara evento para múltiplas sessões. | — |
| `closeConnection(sessionId, finalEvent?)` / `closeAllConnections()` | Finaliza streams ativos. | — |
| `hasConnection()` / `getConnectionCount()` / `getActiveSessions()` | Utilidades de monitoramento. | — |

### server/src/services/statusChecker.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `startChecking(instanceName, sessionId, callback)` | Agenda interval/timeout para checar status via EvolutionService. | — |
| `performCheck()` | Chamada periódica que compara estados e aciona callback em mudanças. | — |
| `stopChecking(instanceName)` / `stopAllCheckings()` | Limpa intervalos/timeouts e remove do mapa interno. | — |
| `isChecking()` / `getCheckingInfo()` / `getActiveCheckings()` / `getCheckingCount()` | Acompanhamento da fila de verificações. | — |

## Rotas e Controladores

### server/src/routes/audio.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `POST /api/audio/tts` | Valida payload e chama `ElevenLabsTTSService` para gerar job/áudio. | `audio_jobs`, `customers` |
| `POST /api/audio/asr` | Aceita upload/URL, salva no bucket e executa `ASRTranscriptionService`. | `audio_jobs` |
| `POST /api/audio/whatsapp/audio` | Normaliza áudio vindo do Evolution, transcreve e cria interação. | `interactions`, `audio_jobs`, `customers` |

### server/src/routes/charts.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `POST /api/charts/:chartId/explain/audio` | Usa o serviço de explicação para inserir texto/áudio para um gráfico. | `chart_explanations`, `audio_jobs` |
| `GET /api/charts/:chartId/explanations` | Lista explicações do usuário para o gráfico informado. | `chart_explanations` |
| `GET /api/charts/explanations/:id` | Busca explicação específica (texto, áudios e snapshots). | `chart_explanations` |

### server/src/routes/chat.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `POST /api/v1/chat` | Obtém settings, gera embedding via OpenRouter, consulta `match_chunks`, chama LLM e grava histórico opcional na tabela de conversas. | `settings`, `rpc match_chunks` (sobre `chunks`), `conversations` |

### server/src/routes/chunks.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `GET /api/v1/chunks` | Lista chunks com filtro opcional por documento. | `chunks` |
| `GET /api/v1/chunks/:id` | Recupera chunk específico. | `chunks` |
| `POST /api/v1/chunks` | Cria novo chunk (texto + metadata). | `chunks` |
| `DELETE /api/v1/chunks/:id` | Remove chunk por ID. | `chunks` |

### server/src/routes/customers.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `GET /api/v1/customers` / `GET /:id` | Lista ou retorna cliente individual. | `customers` |
| `POST /api/v1/customers` | Cria cliente com campos básicos de CRM. | `customers` |
| `PUT /api/v1/customers/:id` | Atualiza dados gerais (nome, churn_risk, etc.). | `customers` |
| `DELETE /api/v1/customers/:id` | Remove cliente. | `customers` |
| `PATCH /api/v1/customers/:id/audio-settings` | Atualiza somente preferências de áudio/persona. | `customers` |

### server/src/routes/docs.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `POST /api/v1/docs` | Faz upload (PDF/TXT/MD), extrai texto e grava conteúdo/metadata. | `documents` |
| `GET /api/v1/docs` | Lista documentos; suporta busca fuzzy via `search_documents_fuzzy` ou fallback `ILIKE`. | `documents`, `rpc search_documents_fuzzy` |
| `GET /api/v1/docs/:id` | Retorna documento completo. | `documents` |
| `DELETE /api/v1/docs/:id` | Deleta documento. | `documents` |

### server/src/routes/evaluations.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `GET /api/v1/evaluations` / `GET /:id` | Lista avaliações de respostas com filtros por interação/rating. | `answer_evaluations` |
| `POST /api/v1/evaluations` | Usa `rpc_record_evaluation` para registrar avaliação e criar flag se preciso. | `rpc_record_evaluation` (toca `answer_evaluations`, `semantic_flags`) |
| `GET /api/v1/evaluations/stats/overview` | Consolida aprovação e severidades, consultando também `answer_quality_counters`. | `answer_evaluations`, `answer_quality_counters` |

### server/src/routes/graph.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `POST /api/v1/graph` | Cria aresta dirigida entre nós. | `graph_edges` |
| `GET /api/v1/graph` / `:id` | Lista arestas com filtros ou retorna uma específica. | `graph_edges` |
| `GET /api/v1/graph/neighbors/:nodeId` | Busca arestas incidente ao nó (in/out). | `graph_edges` |
| `GET /api/v1/graph/path/:from/:to` | Usa função `find_path` para descobrir caminho entre nós. | `rpc find_path` |
| `GET /api/v1/graph/subgraph/:nodeId` | Retorna subgrafo conectado via `get_subgraph`. | `rpc get_subgraph` |
| `GET /api/v1/graph/degree/:nodeId` | Calcula grau via `get_node_degree`. | `rpc get_node_degree` |
| `GET /api/v1/graph/related/:nodeId/:relation` | Filtra vizinhos por tipo através de `get_related_by_relation`. | `rpc get_related_by_relation` |
| `DELETE /api/v1/graph/:id` | Remove aresta. | `graph_edges` |

### server/src/routes/interactions.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `GET /api/v1/interactions` / `:id` | Lista interações (filtro por cliente) ou carrega uma específica. | `interactions` |
| `POST /api/v1/interactions` | Insere mensagem com canal e embedding opcional. | `interactions` |
| `DELETE /api/v1/interactions/:id` | Remove interação. | `interactions` |

### server/src/routes/metrics.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `GET /api/v1/metrics` | Consolida KPIs gerais (clientes, tickets, sentimento). | `customers`, `interactions`, `tickets` |
| `GET /api/v1/metrics/kpis` | Retorna subset rápido (clientes, tickets abertos/resolvidos, sentimento médio). | `customers`, `tickets`, `interactions` |
| `GET /api/v1/metrics/charts` | Dados para gráficos de tickets por status e canais. | `tickets`, `interactions` |
| `GET /api/v1/metrics/leads` | Proxy para `analyzeAllLeads`. | `customers`, `interactions` |
| `GET /api/v1/metrics/leads/:customerId` | Retorna métricas profundas, pontos de abandono e análise de conversão do lead. | `interactions` |
| `GET /api/v1/metrics/leads/:customerId/status` | Usa `calculateLeadStatus`. | `interactions` |

### server/src/routes/rag.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `GET/POST /api/v1/rag/documents` (listar/criar) | Manipula documentos específicos para o workflow RAG. | `documents` |
| `GET /api/v1/rag/documents/:id` | Busca documento completo. | `documents` |
| `POST /api/v1/rag/search/documents` | Chama `match_documents` para recuperar passagens relevantes. | `rpc match_documents` |
| `POST /api/v1/rag/search/interactions` | Usa `match_interactions` para encontrar conversas semelhantes. | `rpc match_interactions` |

### server/src/routes/semantic-flags.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `GET /api/v1/semantic-flags` | Usa `rpc_list_flags` para trazer flags pendentes/aprovados. | `rpc list_flags`, `semantic_flags` |
| `GET /api/v1/semantic-flags/:id` | Retorna flag específico. | `semantic_flags` |
| `PATCH /api/v1/semantic-flags/:id/status` | Atualiza status através de `rpc_update_flag_status`. | `rpc update_flag_status`, `semantic_flags` |
| `GET /api/v1/semantic-flags/stats/overview` | Estatísticas agregadas por status/razão. | `semantic_flags` |

### server/src/routes/settings.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `GET /api/v1/settings` / `GET /:key` | Lista configurações em formato chave/valor ou recupera uma. | `settings` |
| `POST /api/v1/settings` | Upsert de configuração (key/value). | `settings` |
| `PUT /api/v1/settings/:key` | Atualização direta de uma chave. | `settings` |
| `DELETE /api/v1/settings/:key` | Remove a configuração. | `settings` |

### server/src/routes/tickets.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `GET /api/v1/tickets` / `:id` | Lista/filtra tickets de suporte. | `tickets` |
| `POST /api/v1/tickets` | Cria ticket, default `status=open`. | `tickets` |
| `PUT /api/v1/tickets/:id` | Atualiza status, satisfação e resolved_at. | `tickets` |
| `DELETE /api/v1/tickets/:id` | Remove ticket. | `tickets` |

### server/src/routes/webhook.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `POST /api/v1/webhook` | Recebe eventos Evolution/WhatsApp, identifica tipo de mensagem e delega processamento (sem persistência ainda). | — |
| `GET /api/v1/webhook` | Endpoint informativo para healthcheck do webhook. | — |

### server/src/routes/whatsapp.ts
| Endpoint | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `POST /api/v1/whatsapp/connect` | Cria instância WhatsApp via Evolution e retorna `sessionId` + `instanceName`. | — |
| `GET /api/v1/whatsapp/connect/stream` | Mantém conexão SSE enviando QR codes e status até a conexão estabilizar/timeout. | — |
| `GET /api/v1/whatsapp/status` | Consulta Evolution e devolve estado atual da instância. | — |
| `DELETE /api/v1/whatsapp/disconnect` | Para StatusChecker, fecha SSE e deleta instância remota. | — |

## Utilidades

### server/src/utils/embeddings.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `generateSyntheticEmbedding(text)` | Gera vetor determinístico para ambientes sem API externa. | — |
| `generateRealEmbedding(text)` | Usa OpenRouter/OpenAI para obter embedding real; fallback para versão sintética. | — |
| `cosineSimilarity(a, b)` | Calcula similaridade entre dois vetores. | — |

### server/src/utils/files.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `readJsonFiles(folderPath)` | Carrega todos os `.json` de um diretório e devolve metadata + conteúdo. | — |
| `ensureDirectory(path)` | Cria diretório recursivamente. | — |
| `writeJsonFile(path, data)` | Serializa objeto em JSON com identação. | — |

### server/src/utils/sentiment.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| `analyzeSentiment(text)` | Score heurístico (-1 a 1) baseado em palavras-chave PT-BR. | — |
| `classifySentiment(score)` | Converte score em `positivo/neutro/negativo`. | — |
| `averageSentiment(texts)` | Média aritmética dos scores individuais. | — |
| `sentimentTrend(messages)` | Compara primeira x segunda metade para dizer se sentimento melhora ou piora. | — |

## Testes e Setup

### server/src/tests/setup.ts
| Função | O que faz | Tabelas/Procedures |
| --- | --- | --- |
| Test bootstrap | Configura NODE_ENV=test, carrega `.env`, ajusta timeout e logs globais do Jest. | — |

