# Implementation Plan

- [x] 1. Configurar ambiente e dependências





  - Instalar dependências necessárias (framer-motion já instalado, verificar sdk-evolution-chatbot)
  - Criar arquivo .env.example com variáveis EVOLUTION_API_URL e EVOLUTION_API_KEY
  - Adicionar validação de variáveis de ambiente no startup do servidor
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 2. Implementar componente ConfigurableModal genérico





  - [x] 2.1 Criar interface ModalConfig completa em types


    - Definir tipos TypeScript para todas as propriedades de configuração
    - Exportar interface ModalConfig com valores opcionais
    - Criar type guards para validação de config
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_
  
  - [x] 2.2 Implementar componente ConfigurableModal.tsx


    - Criar componente funcional com props (open, config, onClose, children)
    - Implementar renderização condicional com AnimatePresence do Framer Motion
    - Aplicar classes CSS dinâmicas baseadas em config
    - Implementar overlay com blur e opacidade configuráveis
    - Adicionar suporte a tema claro/escuro automático
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 1.5_
  
  - [x] 2.3 Implementar animações com Framer Motion

    - Configurar motion.div para overlay com fade in/out
    - Configurar motion.div para modal com enterAnimation
    - Configurar motion.div para modal com exitAnimation
    - Mapear propriedades do config para props do Framer Motion
    - Aplicar valores padrão de animação (scale, opacity, time)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 2.4 Implementar eventos de fechamento

    - Adicionar useEffect para listener de tecla ESC
    - Implementar handler de click no overlay (se clickClose=true)
    - Chamar callback onClose ao fechar
    - Limpar event listeners no cleanup
    - _Requirements: 3.6, 3.7_
-

- [x] 3. Criar configuração do WhatsApp Modal


  - [x] 3.1 Criar arquivo whatsAppModalConfig.spec.ts


    - Exportar objeto whatsAppModalConfig com valores padrão
    - Configurar bg com suporte a dark mode
    - Configurar fonts para title, text e link
    - Configurar size com breakpoints responsivos
    - Configurar overlay com blur e clickClose
    - Configurar behavior com animações e escClose
    - _Requirements: 2.9, 1.5_

- [ ] 4. Implementar hook useSSE para Server-Sent Events

  - [ ] 4.1 Criar custom hook useSSE.ts
    - Definir interface UseSSEOptions (url, onMessage, onError, enabled)
    - Criar estado para isConnected
    - Implementar useEffect para criar EventSource quando enabled=true
    - Adicionar listeners para 'message', 'error' e 'open'
    - Implementar função close para encerrar conexão
    - Retornar { isConnected, close }
    - _Requirements: 5.2, 6.6_
  
  - [ ] 4.2 Implementar reconexão automática com backoff
    - Adicionar estado para tentativas de reconexão
    - Implementar exponential backoff (1s, 2s, 4s, 8s, max 30s)
    - Reconectar automaticamente em caso de erro
    - Limitar máximo de tentativas (ex: 10)
    - _Requirements: Error Recovery Strategy 1_

- [ ] 5. Implementar WhatsAppConnectionModal

  - [ ] 5.1 Criar componente WhatsAppConnectionModal.tsx
    - Definir interface de props (open, onClose)
    - Criar estado local ConnectionState (status, qrCode, error)
    - Renderizar ConfigurableModal com whatsAppModalConfig
    - Implementar UI condicional baseada em status
    - _Requirements: 1.2, 1.3, 7.3_
  
  - [ ] 5.2 Implementar lógica de conexão
    - Criar função handleConnect que chama POST /api/v1/whatsapp/connect
    - Atualizar status para 'connecting' ao iniciar
    - Tratar erros de requisição HTTP
    - _Requirements: 4.2, 4.6_
  
  - [ ] 5.3 Integrar hook useSSE para receber eventos
    - Usar useSSE com URL /api/v1/whatsapp/connect/stream
    - Parsear eventos SSE (qrcode, status, error)
    - Atualizar estado qrCode ao receber evento 'qrcode'
    - Atualizar status ao receber evento 'status'
    - Atualizar error ao receber evento 'error'
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 7.1_
  
  - [ ] 5.4 Implementar exibição de QR code
    - Renderizar loading spinner enquanto qrCode é null
    - Decodificar base64 e exibir imagem do QR code
    - Adicionar estilos responsivos para QR code
    - _Requirements: 5.4_
  
  - [ ] 5.5 Implementar tratamento de erros e retry
    - Exibir mensagem de erro quando status='error'
    - Adicionar botão "Tentar Novamente"
    - Limpar estado ao tentar novamente
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [ ] 6. Implementar Context Provider para conexão WhatsApp

  - [ ] 6.1 Criar WhatsAppConnectionContext.tsx
    - Definir interface WhatsAppConnectionContextValue
    - Criar Context com createContext
    - Implementar Provider component
    - Criar estado global isConnected
    - _Requirements: 7.4_
  
  - [ ] 6.2 Implementar métodos do contexto
    - Implementar checkConnection que consulta GET /api/v1/whatsapp/status
    - Implementar connect que abre o modal
    - Implementar disconnect que chama DELETE /api/v1/whatsapp/disconnect
    - _Requirements: 1.1_
  
  - [ ] 6.3 Integrar modal no Provider
    - Adicionar estado showModal no Provider
    - Renderizar WhatsAppConnectionModal dentro do Provider
    - Controlar prop open baseado em isConnected e showModal
    - Fechar modal automaticamente quando isConnected=true
    - _Requirements: 1.2, 7.2, 7.3_
  
  - [ ] 6.4 Verificar status ao montar aplicação
    - Adicionar useEffect no Provider para chamar checkConnection ao montar
    - Abrir modal automaticamente se isConnected=false
    - _Requirements: 1.1, 1.2_

- [ ] 7. Implementar backend - EvolutionService

  - [ ] 7.1 Criar classe EvolutionService
    - Inicializar cliente sdk-evolution-chatbot com credenciais do .env
    - Criar Map para armazenar instâncias ativas
    - Implementar método createInstance(sessionId)
    - Gerar instanceName único usando timestamp ou UUID
    - Chamar client.instance.create() com parâmetros corretos
    - Armazenar mapeamento sessionId → instanceName
    - Retornar instanceName criado
    - _Requirements: 4.3, 4.4, 4.5, 9.4, 9.5_
  
  - [ ] 7.2 Implementar método checkStatus
    - Chamar client.setInstance(instanceName)
    - Consultar status da instância usando SDK
    - Retornar objeto com status (connected, disconnected, etc)
    - _Requirements: 6.1, 6.2_
  
  - [ ] 7.3 Implementar método getQRCode
    - Consultar QR code da instância usando SDK
    - Retornar string base64 do QR code
    - _Requirements: 5.1_
  
  - [ ] 7.4 Implementar método deleteInstance
    - Remover instância do Map local
    - Chamar método de deleção da SDK (se disponível)
    - _Requirements: Deployment Notes 4_

- [ ] 8. Implementar backend - SSEManager

  - [ ] 8.1 Criar classe SSEManager
    - Criar Map para armazenar conexões ativas (sessionId → Response)
    - Implementar método addConnection(sessionId, res)
    - Configurar headers SSE corretos (Content-Type, Cache-Control, Connection)
    - _Requirements: 4.7_
  
  - [ ] 8.2 Implementar método sendEvent
    - Formatar evento no padrão SSE (event: tipo\ndata: json\n\n)
    - Enviar evento para Response específico via res.write()
    - Tratar erros de envio (conexão fechada)
    - _Requirements: 5.1, 6.3, 10.1_
  
  - [ ] 8.3 Implementar método closeConnection
    - Enviar evento final antes de fechar
    - Chamar res.end() para encerrar stream
    - Remover conexão do Map
    - _Requirements: 6.6_

- [ ] 9. Implementar backend - StatusChecker

  - [ ] 9.1 Criar classe StatusChecker
    - Criar Map para armazenar intervalos ativos (instanceName → Timeout)
    - Implementar método startChecking(instanceName, sessionId, callback)
    - Configurar setInterval para verificar a cada 30 segundos
    - Configurar setTimeout para timeout de 5 minutos
    - _Requirements: 6.2, 6.5_
  
  - [ ] 9.2 Implementar lógica de verificação periódica
    - Chamar evolutionService.checkStatus() a cada intervalo
    - Comparar status atual com status anterior
    - Chamar callback apenas quando status mudar
    - _Requirements: 6.2, 6.3_
  
  - [ ] 9.3 Implementar parada de verificação
    - Parar verificação quando status='connected'
    - Parar verificação quando timeout de 5min for atingido
    - Limpar interval e timeout
    - Remover do Map
    - _Requirements: 6.4, 6.5_
  
  - [ ] 9.4 Implementar método stopChecking
    - Buscar interval no Map
    - Chamar clearInterval e clearTimeout
    - Remover do Map
    - _Requirements: 6.4_

- [ ] 10. Implementar backend - WhatsApp Router

  - [ ] 10.1 Criar arquivo routes/whatsapp.ts
    - Criar Express Router
    - Inicializar instâncias de EvolutionService, SSEManager e StatusChecker
    - Exportar router
    - _Requirements: 4.3_
  
  - [ ] 10.2 Implementar endpoint POST /connect
    - Gerar sessionId único (ou receber do body/header)
    - Chamar evolutionService.createInstance(sessionId)
    - Retornar resposta 200 imediatamente com { sessionId, instanceName }
    - Tratar erros e retornar 500 com mensagem
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 9.6_
  
  - [ ] 10.3 Implementar endpoint GET /connect/stream (SSE)
    - Extrair sessionId de query params ou header
    - Adicionar conexão ao SSEManager
    - Buscar instanceName do sessionId
    - Iniciar loop para obter QR code da Evolution
    - Enviar evento 'qrcode' via SSE quando QR estiver disponível
    - Iniciar StatusChecker para verificação periódica
    - Enviar evento 'status' quando status mudar
    - Fechar conexão SSE após enviar status final
    - _Requirements: 4.7, 5.1, 5.5, 6.2, 6.3, 6.6_
  
  - [ ] 10.4 Implementar endpoint GET /status
    - Extrair sessionId de query params
    - Buscar instanceName do sessionId
    - Chamar evolutionService.checkStatus()
    - Retornar JSON com { connected: boolean, status: string }
    - _Requirements: 1.1_
  
  - [ ] 10.5 Implementar endpoint DELETE /disconnect
    - Extrair sessionId de query params ou body
    - Buscar instanceName do sessionId
    - Parar StatusChecker
    - Chamar evolutionService.deleteInstance()
    - Retornar 200 com { success: true }
    - _Requirements: Deployment Notes 4_

- [ ] 11. Integrar router no servidor Express

  - Importar whatsappRouter em server/src/index.ts
  - Adicionar app.use('/api/v1/whatsapp', whatsappRouter)
  - Adicionar log de inicialização do endpoint
  - _Requirements: 4.3_

- [ ] 12. Integrar Provider no App.tsx

  - Importar WhatsAppConnectionProvider
  - Envolver aplicação com Provider
  - Verificar que modal aparece automaticamente ao carregar desconectado
  - _Requirements: 1.1, 1.2_

- [ ] 13. Adicionar variáveis de ambiente

  - Criar arquivo .env.example com EVOLUTION_API_URL e EVOLUTION_API_KEY
  - Documentar variáveis opcionais (EVOLUTION_INSTANCE_PREFIX, etc)
  - Adicionar validação no startup do servidor
  - _Requirements: 9.1, 9.2_

- [ ] 14. Implementar logging e monitoramento

  - Adicionar logs em todas as operações críticas (createInstance, status changes)
  - Incluir timestamps em todos os logs
  - Logar erros com stack trace completo
  - _Requirements: 9.7_

- [ ]* 15. Testes e validação
  - [ ]* 15.1 Criar testes unitários para ConfigurableModal
    - Testar renderização com diferentes configs
    - Testar eventos de fechamento (ESC, click overlay)
    - Testar animações
    - _Requirements: Testing Strategy - Unit Tests_
  
  - [ ]* 15.2 Criar testes unitários para useSSE
    - Testar conexão e recebimento de eventos
    - Testar reconexão automática
    - Testar cleanup
    - _Requirements: Testing Strategy - Unit Tests_
  
  - [ ]* 15.3 Criar testes unitários para EvolutionService
    - Mockar SDK Evolution
    - Testar criação de instância
    - Testar consulta de status
    - _Requirements: Testing Strategy - Unit Tests_
  
  - [ ]* 15.4 Criar testes de integração
    - Testar fluxo completo de conexão com mock da Evolution API
    - Testar cenário de timeout
    - Testar tratamento de erros
    - _Requirements: Testing Strategy - Integration Tests_
  
  - [ ]* 15.5 Realizar testes E2E manuais
    - Testar abertura automática do modal
    - Testar exibição de QR code
    - Testar fechamento ao conectar
    - Testar tema claro/escuro
    - Testar eventos de fechamento (ESC, click)
    - _Requirements: Testing Strategy - E2E Tests_

- [ ]* 16. Documentação
  - [ ]* 16.1 Criar README para componente ConfigurableModal
    - Documentar props e interface ModalConfig
    - Adicionar exemplos de uso
    - Documentar valores padrão
    - _Requirements: 8.7_
  
  - [ ]* 16.2 Documentar API endpoints
    - Documentar POST /connect com exemplos
    - Documentar GET /connect/stream (SSE) com formato de eventos
    - Documentar GET /status
    - Documentar DELETE /disconnect
    - _Requirements: 4.2, 4.7_
  
  - [ ]* 16.3 Criar guia de configuração
    - Documentar variáveis de ambiente necessárias
    - Explicar como obter credenciais da Evolution API
    - Adicionar troubleshooting comum
    - _Requirements: 9.1, 9.2_
