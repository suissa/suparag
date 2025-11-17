# Implementation Plan

- [x] 1. Criar componente FirstVisitGuard
  - Implementar HOC que detecta primeira visita via localStorage
  - Adicionar lógica de redirecionamento para /customers
  - Criar e armazenar token 'neuroPgRag_hasVisited' no localStorage
  - Integrar com react-router-dom (useNavigate, useLocation)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Integrar FirstVisitGuard no App.tsx
  - Importar FirstVisitGuard component
  - Envolver Routes com FirstVisitGuard dentro do BrowserRouter
  - Manter hierarquia de providers (QueryClient, CRM, WhatsAppConnection)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Adicionar tratamento de erros no FirstVisitGuard
  - Adicionar try-catch no FirstVisitGuard para localStorage bloqueado
  - Adicionar logs de erro apropriados
  - _Requirements: 3.4, 3.5_

- [x] 4. Criar componente OnboardingView



  - Criar arquivo app/src/components/OnboardingView.tsx
  - Implementar layout centralizado com animações Framer Motion
  - Adicionar animação de fade-in (opacity 0→1, 600ms, ease-out)
  - Adicionar animação de scale no botão (0.95→1, 400ms)
  - Implementar ícone decorativo com animação spring
  - Criar botão de importação com texto "Importar Contatos e Visualizar Métricas"
  - Adicionar hover effect (scale 1.05) e tap effect (scale 0.95)
  - Implementar prop onConnect para callback de conexão
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Modificar WhatsAppConnectionContext para remover modal automático





  - Remover lógica de abertura automática do modal no useEffect de inicialização
  - Manter apenas verificação de status (checkConnection)
  - Garantir que showModal permanece false após checkConnection
  - Manter método connect() que abre modal sob demanda
  - Preservar lógica de fechamento automático após conexão bem-sucedida
  - Modificar condição do modal para `open={showModal}` (remover `&& !isConnected`)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Modificar CustomersPage para renderização condicional


  - Adicionar lógica para determinar se deve mostrar onboarding (customers.length === 0)
  - Importar OnboardingView component
  - Importar e integrar useWhatsAppConnection hook
  - Renderizar OnboardingView quando não há contatos
  - Passar método connect() como prop onConnect para OnboardingView
  - Manter renderização normal da tabela quando há contatos
  - Garantir que isLoading é considerado na lógica condicional
  - Adicionar fallback para erro ao carregar customers com botão "Tentar Novamente"
  - _Requirements: 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Implementar importação automática após conexão WhatsApp

  - Adicionar useEffect no WhatsAppConnectionContext para detectar conexão bem-sucedida
  - Implementar chamada POST /api/v1/whatsapp/import após conexão
  - Passar sessionId no payload da requisição
  - Adicionar tratamento de erro para importação
  - Adicionar logs de sucesso/erro da importação
  - Garantir que importação ocorre após modal fechar (delay de 2s)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Remover coluna de documentos do Dashboard

  - Abrir arquivo app/src/pages/Dashboard.tsx
  - Remover div "Document Management Panel" (coluna esquerda)
  - Manter apenas ChatPanel em tela cheia
  - Ajustar classes CSS para ChatPanel ocupar 100% da largura
  - Remover imports não utilizados (LayoutDashboard, Settings, HelpCircle, Link)
  - Remover estados relacionados a documentos (documents, loading, searchQuery, uploading)
  - Remover funções relacionadas a documentos (loadDocuments, handleFileSelect, handleUpload, handleDelete)
  - _Requirements: 8.1_

- [x] 9. Validar link de Documentos na sidebar
  - Link "/documents" já existe em DashboardLayout.tsx
  - Rota está configurada em App.tsx
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ]* 10. Criar testes unitários
  - Escrever testes para FirstVisitGuard (redirecionamento, token, visitas subsequentes)
  - Escrever testes para OnboardingView (renderização, animação, callback)
  - Escrever testes para CustomersPage (renderização condicional)
  - Escrever testes para WhatsAppConnectionContext (modal não automático)
  - _Requirements: Todos_

- [ ]* 11. Criar testes de integração E2E
  - Implementar teste de fluxo completo de onboarding
  - Testar redirecionamento → onboarding → conexão → importação
  - Validar que botão desaparece após importação
  - Testar visitas subsequentes não mostram onboarding
  - _Requirements: Todos_

- [ ]* 12. Testar funcionalidade RAG com documentos
  - Fazer upload de documento de teste com conteúdo conhecido
  - Fazer perguntas específicas sobre o conteúdo no chat
  - Validar que respostas incluem informações corretas do documento
  - Testar perguntas sobre conteúdo não presente nos documentos
  - Validar que sistema indica quando não encontra informação
  - Documentar casos de teste e resultados
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 13. Validação e ajustes finais
  - Testar responsividade em diferentes tamanhos de tela
  - Validar animações em diferentes navegadores
  - Verificar acessibilidade (keyboard navigation, screen readers)
  - Testar com localStorage bloqueado
  - Validar que modal não abre automaticamente em nenhum cenário
  - Testar fluxo completo: primeira visita → onboarding → conexão → importação → documentos
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, Todos_
