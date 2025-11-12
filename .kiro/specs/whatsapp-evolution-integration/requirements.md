# Requirements Document

## Introduction

Este documento especifica os requisitos para a integração completa entre o dashboard NeuroPgRag e a Evolution API para gerenciamento de conexões WhatsApp. O sistema deve fornecer uma interface visual configurável (modal) que monitora o status da conexão WhatsApp, gerencia a criação de instâncias na Evolution API, exibe QR codes para autenticação e mantém sincronização em tempo real do status de conexão através de Server-Sent Events (SSE) e verificações periódicas.

## Glossary

- **Dashboard**: Interface React do usuário para gerenciamento do sistema NeuroPgRag
- **Evolution API**: Serviço externo para gerenciamento de instâncias WhatsApp
- **WhatsApp Modal**: Componente React configurável que exibe o status e QR code da conexão WhatsApp
- **Instance**: Representação de uma conexão WhatsApp na Evolution API
- **QR Code**: Código de autenticação visual para vincular dispositivo WhatsApp
- **SSE (Server-Sent Events)**: Protocolo de comunicação unidirecional servidor→cliente para atualizações em tempo real
- **Backend API**: Servidor Express que intermedia comunicação entre Dashboard e Evolution API
- **Connection Status**: Estado da conexão WhatsApp (disconnected, connecting, connected)
- **Framer Motion**: Biblioteca React para animações declarativas
- **Modal Config**: Objeto JSON que define aparência e comportamento do WhatsApp Modal
- **Theme System**: Sistema de temas claro/escuro do dashboard

## Requirements

### Requirement 1

**User Story:** Como usuário do dashboard, eu quero ver automaticamente um modal quando meu WhatsApp estiver desconectado, para que eu possa reconectar rapidamente sem navegar por menus.

#### Acceptance Criteria

1. WHEN o Dashboard carrega, THE Dashboard SHALL verificar o status da conexão WhatsApp
2. IF o status da conexão for "disconnected", THEN THE Dashboard SHALL exibir o WhatsApp Modal automaticamente
3. WHILE o WhatsApp Modal está visível, THE Dashboard SHALL bloquear interações com o conteúdo de fundo através de overlay
4. WHEN o status da conexão mudar para "connected", THEN THE Dashboard SHALL fechar o WhatsApp Modal automaticamente
5. THE WhatsApp Modal SHALL adaptar-se automaticamente ao tema vigente (claro/escuro) do Dashboard

### Requirement 2

**User Story:** Como desenvolvedor, eu quero configurar a aparência e comportamento do modal através de um arquivo JSON, para que eu possa personalizar a experiência sem modificar código do componente.

#### Acceptance Criteria

1. THE WhatsApp Modal SHALL aceitar configuração através de objeto JSON tipado
2. THE Modal Config SHALL definir propriedades de background (cor ou gradiente) com valor padrão "bg-white/95 dark:bg-slate-900/95"
3. THE Modal Config SHALL definir propriedades de fonte (cor, família, tamanho) para títulos, textos e links separadamente
4. THE Modal Config SHALL definir dimensões (largura, altura) com breakpoints responsivos (md) e limites máximos
5. THE Modal Config SHALL definir propriedades de overlay (cor, opacidade, blur, visibilidade, fechamento por clique)
6. THE Modal Config SHALL definir layout em grid (colunas e linhas) com padrão de 1 coluna e 1 linha
7. THE Modal Config SHALL definir animações de entrada, saída e hover através de objetos com propriedades scale, opacity, blur e time
8. THE Modal Config SHALL definir comportamento de fechamento por tecla ESC com padrão true
9. THE Modal Config SHALL ser exportado de arquivo ".spec.ts" localizado em "components/specs/"

### Requirement 3

**User Story:** Como usuário, eu quero que o modal exiba animações suaves ao abrir e fechar, para que a experiência seja visualmente agradável e profissional.

#### Acceptance Criteria

1. THE WhatsApp Modal SHALL utilizar Framer Motion para todas as animações
2. WHEN o modal abre, THE WhatsApp Modal SHALL animar de acordo com enterAnimation definida no Modal Config
3. WHEN o modal fecha, THE WhatsApp Modal SHALL animar de acordo com exitAnimation definida no Modal Config
4. THE WhatsApp Modal SHALL aplicar animação padrão de entrada com scale 0.9→1 e opacity 0→1 em 300ms
5. THE WhatsApp Modal SHALL aplicar animação padrão de saída com scale 1→0.9 e opacity 1→0 em 200ms
6. WHEN usuário pressiona tecla ESC e escClose é true, THEN THE WhatsApp Modal SHALL executar exitAnimation e fechar
7. WHEN usuário clica no overlay e clickClose é true, THEN THE WhatsApp Modal SHALL executar exitAnimation e fechar

### Requirement 4

**User Story:** Como usuário, eu quero iniciar a conexão WhatsApp clicando em um botão no modal, para que o sistema crie uma instância na Evolution API e exiba o QR code.

#### Acceptance Criteria

1. THE WhatsApp Modal SHALL exibir botão "Conectar WhatsApp" quando Connection Status for "disconnected"
2. WHEN usuário clica em "Conectar WhatsApp", THEN THE Dashboard SHALL enviar requisição POST para "/api/v1/whatsapp/connect"
3. THE Backend API SHALL receber requisição POST em "/api/v1/whatsapp/connect" sem corpo obrigatório
4. WHEN Backend API recebe requisição de conexão, THEN THE Backend API SHALL criar Instance na Evolution API usando sdk-evolution-chatbot
5. THE Backend API SHALL chamar "client.instance.create()" com parâmetros instanceName, token opcional e qrcode true
6. THE Backend API SHALL retornar resposta HTTP 200 imediatamente após iniciar criação, sem aguardar conclusão
7. THE Backend API SHALL estabelecer conexão SSE com Dashboard para enviar atualizações em tempo real

### Requirement 5

**User Story:** Como usuário, eu quero ver o QR code atualizado em tempo real no modal, para que eu possa escaneá-lo com meu WhatsApp e completar a autenticação.

#### Acceptance Criteria

1. WHEN Backend API recebe QR code da Evolution API, THEN THE Backend API SHALL enviar QR code base64 via SSE para Dashboard
2. THE Dashboard SHALL estabelecer conexão SSE com endpoint "/api/v1/whatsapp/connect/stream"
3. WHEN Dashboard recebe evento SSE com QR code, THEN THE WhatsApp Modal SHALL exibir imagem do QR code decodificada
4. THE WhatsApp Modal SHALL exibir indicador de carregamento enquanto aguarda primeiro QR code
5. WHEN QR code é atualizado pela Evolution API, THEN THE Backend API SHALL enviar novo QR code via SSE
6. THE WhatsApp Modal SHALL substituir QR code anterior por novo QR code sem piscar ou recarregar página

### Requirement 6

**User Story:** Como sistema, eu quero verificar periodicamente o status da conexão WhatsApp, para que eu possa detectar quando a autenticação for concluída ou falhar.

#### Acceptance Criteria

1. WHEN Backend API inicia processo de conexão, THEN THE Backend API SHALL configurar Instance usando "client.setInstance()"
2. THE Backend API SHALL verificar status da conexão a cada 30 segundos usando método de verificação da SDK
3. WHEN status da conexão mudar para "connected", THEN THE Backend API SHALL enviar evento SSE "connected=true" para Dashboard
4. WHEN status da conexão mudar para "connected", THEN THE Backend API SHALL encerrar verificações periódicas
5. IF após 5 minutos o status não for "connected", THEN THE Backend API SHALL enviar evento SSE "connected=false" e encerrar verificações
6. THE Backend API SHALL encerrar conexão SSE após enviar status final (connected=true ou connected=false)

### Requirement 7

**User Story:** Como usuário, eu quero que o modal feche automaticamente quando meu WhatsApp conectar com sucesso, para que eu possa continuar usando o dashboard sem ações manuais.

#### Acceptance Criteria

1. WHEN Dashboard recebe evento SSE "connected=true", THEN THE Dashboard SHALL atualizar Connection Status para "connected"
2. WHEN Connection Status muda para "connected", THEN THE Dashboard SHALL executar exitAnimation do WhatsApp Modal
3. WHEN exitAnimation completa, THEN THE Dashboard SHALL remover WhatsApp Modal da interface
4. THE Dashboard SHALL armazenar Connection Status em estado global ou contexto React
5. WHEN Dashboard recebe evento SSE "connected=false", THEN THE Dashboard SHALL exibir mensagem de erro no WhatsApp Modal

### Requirement 8

**User Story:** Como desenvolvedor, eu quero que o componente modal seja genérico e reutilizável, para que eu possa usá-lo em outros contextos além de WhatsApp com diferentes configurações.

#### Acceptance Criteria

1. THE WhatsApp Modal SHALL ser implementado como componente React genérico "ConfigurableModal"
2. THE ConfigurableModal SHALL aceitar prop "open" do tipo boolean para controlar visibilidade
3. THE ConfigurableModal SHALL aceitar prop "config" do tipo ModalConfig para personalização
4. THE ConfigurableModal SHALL aceitar prop "children" do tipo ReactNode para conteúdo customizável
5. THE ConfigurableModal SHALL aceitar prop "onClose" do tipo função callback para notificar fechamento
6. THE ConfigurableModal SHALL aplicar todas as classes CSS do Modal Config dinamicamente usando template strings
7. THE ConfigurableModal SHALL funcionar independentemente do contexto de WhatsApp quando usado com diferentes configs

### Requirement 9

**User Story:** Como sistema, eu quero que a API backend gerencie credenciais e configurações da Evolution API de forma segura, para que informações sensíveis não sejam expostas no frontend.

#### Acceptance Criteria

1. THE Backend API SHALL carregar credenciais da Evolution API de variáveis de ambiente
2. THE Backend API SHALL validar presença de variáveis EVOLUTION_API_URL e EVOLUTION_API_KEY ao iniciar
3. THE Backend API SHALL inicializar cliente sdk-evolution-chatbot com credenciais carregadas
4. THE Backend API SHALL gerar instanceName único para cada requisição de conexão usando timestamp ou UUID
5. THE Backend API SHALL armazenar mapeamento entre sessionId do Dashboard e instanceName da Evolution
6. THE Backend API SHALL retornar erro HTTP 500 se inicialização do cliente Evolution falhar
7. THE Backend API SHALL registrar logs de todas as interações com Evolution API para auditoria

### Requirement 10

**User Story:** Como usuário, eu quero ver mensagens de erro claras quando a conexão falhar, para que eu possa entender o problema e tentar novamente.

#### Acceptance Criteria

1. WHEN Backend API falha ao criar Instance, THEN THE Backend API SHALL enviar evento SSE com tipo "error" e mensagem descritiva
2. WHEN Dashboard recebe evento SSE de erro, THEN THE WhatsApp Modal SHALL exibir mensagem de erro em destaque
3. THE WhatsApp Modal SHALL exibir botão "Tentar Novamente" quando erro ocorrer
4. WHEN usuário clica em "Tentar Novamente", THEN THE Dashboard SHALL reiniciar processo de conexão
5. THE WhatsApp Modal SHALL limpar QR code anterior quando erro ocorrer
6. THE Backend API SHALL incluir código de erro e timestamp em eventos SSE de erro para debugging
