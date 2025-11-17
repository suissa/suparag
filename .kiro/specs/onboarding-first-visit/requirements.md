# Requirements Document

## Introduction

Este documento especifica os requisitos para implementar um fluxo de onboarding inteligente que detecta a primeira visita do usuário, apresenta uma tela de boas-vindas animada na página de contatos, e gerencia o estado de conexão WhatsApp de forma contextual, eliminando modais intrusivos e melhorando a experiência do usuário.

## Glossary

- **Sistema**: A aplicação web NeuroPgRag (frontend React + backend Express)
- **Usuário**: Pessoa que acessa a aplicação através do navegador
- **Primeira Visita**: Primeira vez que um usuário específico acessa a aplicação em um navegador/dispositivo
- **Token de Visita**: Valor armazenado no localStorage indicando que o usuário já visitou a aplicação
- **Tela de Onboarding**: Página de contatos (/customers) exibida na primeira visita com botão de importação
- **Botão de Importação**: Elemento UI que inicia o processo de conexão WhatsApp e importação de contatos
- **Modal de Conexão**: Componente WhatsAppConnectionModal que exibe QR code para conexão
- **Estado de Conexão**: Status booleano indicando se o WhatsApp está conectado
- **Lista de Contatos**: Coleção de customers exibida na página /customers

## Requirements

### Requirement 1

**User Story:** Como um novo usuário, eu quero ser direcionado automaticamente para a tela de contatos na minha primeira visita, para que eu possa começar a usar a aplicação de forma guiada.

#### Acceptance Criteria

1. WHEN o Sistema detecta que não existe um Token de Visita no localStorage, THE Sistema SHALL redirecionar o Usuário para a rota /customers
2. WHEN o Sistema redireciona para /customers na primeira visita, THE Sistema SHALL criar e armazenar um Token de Visita no localStorage com a chave 'neuroPgRag_hasVisited'
3. WHEN o Sistema detecta que existe um Token de Visita no localStorage, THE Sistema SHALL permitir navegação normal para a rota raiz (/)
4. WHEN o Usuário acessa a aplicação após a primeira visita, THE Sistema SHALL carregar a rota padrão (/) sem redirecionamento automático

### Requirement 2

**User Story:** Como um novo usuário na primeira visita, eu quero ver uma tela de onboarding animada com um botão centralizado, para que eu entenda claramente qual é a próxima ação a tomar.

#### Acceptance Criteria

1. WHEN a Tela de Onboarding é renderizada na primeira visita, THE Sistema SHALL exibir uma animação de fade-in com duração de 600ms
2. WHEN a Lista de Contatos está vazia, THE Sistema SHALL exibir o Botão de Importação centralizado verticalmente e horizontalmente na tela
3. WHEN o Botão de Importação é exibido, THE Sistema SHALL mostrar o texto "Importar Contatos e Visualizar Métricas"
4. WHEN o Botão de Importação é exibido, THE Sistema SHALL aplicar estilos visuais destacados (tamanho grande, cor primária, ícone de importação)
5. WHEN a Lista de Contatos contém um ou mais customers, THE Sistema SHALL ocultar o Botão de Importação e exibir a tabela de contatos normalmente

### Requirement 3

**User Story:** Como um novo usuário, eu quero que o botão de importação inicie o processo de conexão WhatsApp, para que eu possa importar meus contatos facilmente.

#### Acceptance Criteria

1. WHEN o Usuário clica no Botão de Importação, THE Sistema SHALL invocar o método connect() do contexto WhatsAppConnection
2. WHEN o método connect() é invocado, THE Sistema SHALL abrir o Modal de Conexão exibindo o QR code
3. WHEN o Modal de Conexão é aberto, THE Sistema SHALL manter a Tela de Onboarding visível ao fundo
4. WHEN a conexão WhatsApp é estabelecida com sucesso, THE Sistema SHALL fechar o Modal de Conexão automaticamente
5. WHEN o Modal de Conexão é fechado após conexão bem-sucedida, THE Sistema SHALL recarregar a Lista de Contatos para exibir os dados importados

### Requirement 4

**User Story:** Como um usuário que já possui contatos importados, eu não quero ver o botão de importação novamente, para que a interface permaneça limpa e focada na gestão de contatos.

#### Acceptance Criteria

1. WHEN a página /customers é carregada, THE Sistema SHALL consultar a quantidade de registros na Lista de Contatos
2. WHEN a Lista de Contatos retorna um ou mais customers, THE Sistema SHALL renderizar a interface padrão de tabela sem o Botão de Importação
3. WHEN a Lista de Contatos está vazia, THE Sistema SHALL renderizar o Botão de Importação centralizado
4. WHEN novos contatos são adicionados à Lista de Contatos, THE Sistema SHALL atualizar a interface automaticamente removendo o Botão de Importação

### Requirement 5

**User Story:** Como desenvolvedor, eu quero remover o modal automático de conexão WhatsApp do contexto global, para que ele apareça apenas quando explicitamente solicitado pelo usuário.

#### Acceptance Criteria

1. WHEN o WhatsAppConnectionProvider é montado, THE Sistema SHALL verificar o status da conexão sem abrir o Modal de Conexão automaticamente
2. WHEN o estado isConnected é false durante a inicialização, THE Sistema SHALL manter o Modal de Conexão fechado
3. WHEN o método connect() é invocado explicitamente, THE Sistema SHALL abrir o Modal de Conexão
4. WHEN o Usuário fecha o Modal de Conexão manualmente, THE Sistema SHALL respeitar a ação e não reabrir o modal automaticamente
5. WHEN a aplicação é recarregada e o WhatsApp está desconectado, THE Sistema SHALL manter o Modal de Conexão fechado até que o Usuário solicite conexão

### Requirement 6

**User Story:** Como um usuário, eu quero que a animação de entrada seja suave e profissional, para que a experiência de primeira visita seja agradável e moderna.

#### Acceptance Criteria

1. WHEN a Tela de Onboarding é renderizada, THE Sistema SHALL aplicar uma transição CSS de opacity de 0 para 1
2. WHEN a animação de fade-in é executada, THE Sistema SHALL completar a transição em 600 milissegundos
3. WHEN a animação de fade-in é executada, THE Sistema SHALL usar uma função de easing ease-out para suavidade
4. WHEN o Botão de Importação é renderizado, THE Sistema SHALL aplicar uma animação de scale de 0.95 para 1 com duração de 400ms
5. WHEN o Usuário interage com o Botão de Importação (hover), THE Sistema SHALL aplicar uma transição de scale para 1.05 em 200ms

### Requirement 7

**User Story:** Como um usuário que acabou de conectar o WhatsApp, eu quero que o sistema importe automaticamente meus contatos e mensagens, para que eu possa começar a usar o CRM imediatamente.

#### Acceptance Criteria

1. WHEN a conexão WhatsApp é estabelecida com sucesso, THE Sistema SHALL iniciar automaticamente o processo de importação de contatos
2. WHEN o processo de importação é iniciado, THE Sistema SHALL buscar o máximo possível de contatos da conta WhatsApp conectada
3. WHEN contatos são importados, THE Sistema SHALL também importar as mensagens associadas a cada contato
4. WHEN a importação é concluída, THE Sistema SHALL atualizar a Lista de Contatos automaticamente
5. WHEN a importação falha, THE Sistema SHALL exibir mensagem de erro e permitir retry manual

### Requirement 8

**User Story:** Como um usuário, eu quero acessar a listagem de documentos em uma página separada, para que a interface principal fique mais limpa e focada no chat.

#### Acceptance Criteria

1. WHEN o Dashboard é renderizado, THE Sistema SHALL remover a coluna de listagem de documentos do lado esquerdo
2. WHEN o Usuário acessa a rota /documents, THE Sistema SHALL exibir a página completa de documentos
3. WHEN a Sidebar é renderizada, THE Sistema SHALL exibir um link "Documentos" apontando para /documents
4. WHEN o Usuário clica no link "Documentos" na sidebar, THE Sistema SHALL navegar para a página /documents
5. WHEN a página /documents é carregada, THE Sistema SHALL exibir a lista completa de documentos com opções de visualização e exclusão

### Requirement 9

**User Story:** Como desenvolvedor, eu quero validar que o sistema RAG está funcionando corretamente com os documentos, para garantir que as respostas do chat são precisas e relevantes.

#### Acceptance Criteria

1. WHEN um documento é carregado no sistema, THE Sistema SHALL processar e indexar o conteúdo para busca RAG
2. WHEN o Usuário faz uma pergunta no chat sobre conteúdo de um documento, THE Sistema SHALL buscar informações relevantes no documento
3. WHEN o Sistema encontra informações relevantes, THE Sistema SHALL incluir essas informações na resposta do chat
4. WHEN o Sistema responde uma pergunta, THE Sistema SHALL garantir que a resposta condiz com o conteúdo real do documento
5. WHEN não há informações relevantes nos documentos, THE Sistema SHALL indicar claramente que não encontrou informações
