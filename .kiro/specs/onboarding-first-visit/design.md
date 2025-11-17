# Design Document

## Overview

Este documento descreve o design técnico para implementar um sistema de onboarding inteligente que detecta a primeira visita do usuário, apresenta uma experiência guiada na página de contatos, e gerencia o estado de conexão WhatsApp de forma contextual. A solução elimina modais intrusivos, melhora a UX através de animações suaves, e utiliza localStorage para persistência de estado.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              App.tsx (Router)                       │    │
│  │  - FirstVisitGuard (HOC)                           │    │
│  │  - Detecta primeira visita                         │    │
│  │  - Redireciona para /customers                     │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │         CustomersPage (/customers)                  │    │
│  │  - OnboardingView (primeira visita)                │    │
│  │  - NormalView (visitas subsequentes)               │    │
│  │  - Lógica condicional baseada em customers.length  │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │    WhatsAppConnectionContext (modificado)          │    │
│  │  - Remove modal automático                         │    │
│  │  - Mantém apenas método connect()                  │    │
│  │  - Modal controlado externamente                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/SSE
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Backend (Express)                          │
│  - /api/v1/whatsapp/connect                                  │
│  - /api/v1/whatsapp/status                                   │
│  - /api/v1/whatsapp/connect/stream (SSE)                     │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Primeira Visita**:
   ```
   User → App.tsx → FirstVisitGuard → localStorage.getItem('neuroPgRag_hasVisited')
   → null → Redirect(/customers) → localStorage.setItem('neuroPgRag_hasVisited', 'true')
   ```

2. **Renderização Condicional**:
   ```
   CustomersPage → useCustomers() → customers.length === 0
   → Render OnboardingView (botão centralizado)
   → customers.length > 0 → Render NormalView (tabela)
   ```

3. **Fluxo de Conexão**:
   ```
   User Click → handleConnect() → useWhatsAppConnection().connect()
   → WhatsAppConnectionModal (open) → POST /whatsapp/connect
   → SSE Stream → QR Code → Scan → Connected → Modal Close
   → Reload customers → Hide button
   ```

## Components and Interfaces

### 1. FirstVisitGuard (HOC)

**Localização**: `app/src/guards/FirstVisitGuard.tsx`

**Responsabilidade**: Detectar primeira visita e redirecionar para /customers

```typescript
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const VISIT_TOKEN_KEY = 'neuroPgRag_hasVisited';

export function FirstVisitGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hasVisited = localStorage.getItem(VISIT_TOKEN_KEY);
    
    // Se é primeira visita e não está em /customers
    if (!hasVisited && location.pathname === '/') {
      // Marcar como visitado
      localStorage.setItem(VISIT_TOKEN_KEY, 'true');
      
      // Redirecionar para /customers
      navigate('/customers', { replace: true });
    }
  }, [navigate, location]);

  return <>{children}</>;
}
```

**Integração no App.tsx**:
```typescript
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CRMProvider>
        <WhatsAppConnectionProvider>
          <BrowserRouter>
            <FirstVisitGuard>
              <Routes>
                {/* ... rotas ... */}
              </Routes>
            </FirstVisitGuard>
          </BrowserRouter>
        </WhatsAppConnectionProvider>
      </CRMProvider>
    </QueryClientProvider>
  );
}
```

### 2. OnboardingView Component

**Localização**: `app/src/components/OnboardingView.tsx`

**Responsabilidade**: Exibir tela de boas-vindas com botão de importação

```typescript
import { motion } from 'framer-motion';
import { Button } from './Button';
import { useWhatsAppConnection } from '../contexts/WhatsAppConnectionContext';

interface OnboardingViewProps {
  onConnect: () => void;
}

export function OnboardingView({ onConnect }: OnboardingViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-center max-w-2xl"
      >
        {/* Ícone decorativo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-5xl">
              contacts
            </span>
          </div>
        </motion.div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Bem-vindo ao NeuroPgRag
        </h1>

        {/* Descrição */}
        <p className="text-lg text-white/70 mb-8">
          Conecte seu WhatsApp para importar seus contatos e começar a visualizar métricas detalhadas sobre suas interações.
        </p>

        {/* Botão de importação */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            icon="cloud_download"
            onClick={onConnect}
            className="text-lg px-8 py-4"
          >
            Importar Contatos e Visualizar Métricas
          </Button>
        </motion.div>

        {/* Informação adicional */}
        <p className="text-sm text-white/50 mt-6">
          Você precisará escanear um QR code com seu WhatsApp
        </p>
      </motion.div>
    </motion.div>
  );
}
```

### 3. CustomersPage (Modificado)

**Localização**: `app/src/pages/customers/index.tsx`

**Modificações**:
- Adicionar lógica condicional para renderizar OnboardingView ou NormalView
- Integrar com useWhatsAppConnection para abrir modal

```typescript
export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const { connect } = useWhatsAppConnection();
  
  // ... resto do código existente ...

  // Determinar se deve mostrar onboarding
  const showOnboarding = !isLoading && customers.length === 0;

  return (
    <DashboardLayout>
      {showOnboarding ? (
        <OnboardingView onConnect={connect} />
      ) : (
        <div className="space-y-6">
          {/* Interface normal de tabela */}
          {/* ... código existente ... */}
        </div>
      )}
    </DashboardLayout>
  );
}
```

### 4. WhatsAppConnectionContext (Modificado)

**Localização**: `app/src/contexts/WhatsAppConnectionContext.tsx`

**Modificações**:
- Remover lógica de abertura automática do modal
- Manter apenas verificação de status
- Modal controlado externamente via método connect()

```typescript
export function WhatsAppConnectionProvider({ children }: WhatsAppConnectionProviderProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sessionId] = useState<string>(() => {
    const stored = localStorage.getItem('whatsapp_session_id');
    if (stored) return stored;
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('whatsapp_session_id', newSessionId);
    return newSessionId;
  });

  const checkConnection = async (): Promise<void> => {
    try {
      const response = await api.get('/whatsapp/status', {
        params: { sessionId }
      });
      setIsConnected(response.data.connected === true);
    } catch (error: any) {
      setIsConnected(false);
      throw new Error(error.response?.data?.message || 'Erro ao verificar status');
    }
  };

  const connect = async (): Promise<void> => {
    console.log('[WhatsAppConnectionContext] Abrindo modal de conexão...');
    setShowModal(true);
  };

  const disconnect = async (): Promise<void> => {
    try {
      await api.delete('/whatsapp/disconnect', {
        params: { sessionId }
      });
      setIsConnected(false);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao desconectar');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // MODIFICAÇÃO: Remover abertura automática do modal
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        await checkConnection();
        // NÃO abrir modal automaticamente
      } catch (error) {
        console.error('[WhatsAppConnectionContext] Erro ao inicializar:', error);
        // NÃO abrir modal em caso de erro
      }
    };
    
    initializeConnection();
  }, []);

  // Fechar modal automaticamente quando conectar
  useEffect(() => {
    if (isConnected && showModal) {
      setTimeout(() => {
        setShowModal(false);
      }, 1500);
    }
  }, [isConnected, showModal]);

  const contextValue: WhatsAppConnectionContextValue = {
    isConnected,
    sessionId,
    checkConnection,
    connect,
    disconnect,
  };

  return (
    <WhatsAppConnectionContext.Provider value={contextValue}>
      {children}
      
      {/* Modal controlado externamente */}
      <WhatsAppConnectionModal
        open={showModal}
        onClose={handleCloseModal}
        sessionId={sessionId}
      />
    </WhatsAppConnectionContext.Provider>
  );
}
```

## Data Models

### LocalStorage Schema

```typescript
interface LocalStorageSchema {
  // Token de primeira visita
  neuroPgRag_hasVisited: 'true' | null;
  
  // Session ID do WhatsApp (já existente)
  whatsapp_session_id: string;
}
```

### Component State

```typescript
// OnboardingView - sem estado próprio, apenas props

// CustomersPage
interface CustomersPageState {
  customers: Customer[];
  isLoading: boolean;
  searchQuery: string;
  isModalOpen: boolean;
  formData: CustomerFormData;
}

// FirstVisitGuard - sem estado, apenas efeito colateral
```

## Error Handling

### 1. Erro ao Verificar Primeira Visita

**Cenário**: localStorage não disponível ou bloqueado

**Tratamento**:
```typescript
try {
  const hasVisited = localStorage.getItem(VISIT_TOKEN_KEY);
  // ... lógica ...
} catch (error) {
  console.error('[FirstVisitGuard] Erro ao acessar localStorage:', error);
  // Continuar sem redirecionamento
  // Usuário verá rota padrão
}
```

### 2. Erro ao Conectar WhatsApp

**Cenário**: Falha na API ou timeout

**Tratamento**: Já implementado no WhatsAppConnectionModal
- Exibe mensagem de erro
- Botão "Tentar Novamente"
- Timeout de 5 minutos

### 3. Erro ao Carregar Customers

**Cenário**: Falha ao buscar lista de contatos

**Tratamento**:
```typescript
const { data: customers = [], isLoading, error } = useCustomers();

if (error) {
  return (
    <DashboardLayout>
      <div className="text-center py-12">
        <p className="text-red-500">Erro ao carregar contatos</p>
        <Button onClick={() => refetch()}>Tentar Novamente</Button>
      </div>
    </DashboardLayout>
  );
}
```

## Testing Strategy

### Unit Tests

**FirstVisitGuard.test.tsx**:
```typescript
describe('FirstVisitGuard', () => {
  it('deve redirecionar para /customers na primeira visita', () => {
    // Mock localStorage vazio
    // Renderizar com rota /
    // Verificar redirecionamento para /customers
  });

  it('deve criar token no localStorage', () => {
    // Mock localStorage vazio
    // Renderizar
    // Verificar localStorage.setItem chamado
  });

  it('não deve redirecionar em visitas subsequentes', () => {
    // Mock localStorage com token
    // Renderizar com rota /
    // Verificar que permanece em /
  });
});
```

**OnboardingView.test.tsx**:
```typescript
describe('OnboardingView', () => {
  it('deve renderizar com animação', () => {
    // Renderizar componente
    // Verificar presença de motion.div
  });

  it('deve chamar onConnect ao clicar no botão', () => {
    // Mock onConnect
    // Renderizar
    // Clicar no botão
    // Verificar onConnect chamado
  });
});
```

**CustomersPage.test.tsx**:
```typescript
describe('CustomersPage - Onboarding', () => {
  it('deve mostrar OnboardingView quando não há contatos', () => {
    // Mock useCustomers retornando []
    // Renderizar
    // Verificar OnboardingView presente
  });

  it('deve mostrar tabela quando há contatos', () => {
    // Mock useCustomers retornando [customer1, customer2]
    // Renderizar
    // Verificar tabela presente
  });
});
```

### Integration Tests

**Onboarding Flow (E2E)**:
```typescript
describe('Onboarding Flow', () => {
  it('deve completar fluxo de primeira visita', async () => {
    // 1. Limpar localStorage
    // 2. Navegar para /
    // 3. Verificar redirecionamento para /customers
    // 4. Verificar OnboardingView visível
    // 5. Clicar em "Importar Contatos"
    // 6. Verificar modal WhatsApp aberto
    // 7. Mock conexão bem-sucedida
    // 8. Verificar modal fechado
    // 9. Verificar tabela de contatos visível
  });
});
```

### Manual Testing Checklist

- [ ] Primeira visita redireciona para /customers
- [ ] Token criado no localStorage
- [ ] OnboardingView exibido com animação suave
- [ ] Botão centralizado e responsivo
- [ ] Click no botão abre modal WhatsApp
- [ ] Modal não abre automaticamente ao carregar app
- [ ] Após importar contatos, botão desaparece
- [ ] Tabela de contatos exibida corretamente
- [ ] Visitas subsequentes não mostram onboarding
- [ ] Animações funcionam em diferentes navegadores

## Performance Considerations

### 1. Lazy Loading

Não necessário para FirstVisitGuard (componente pequeno), mas OnboardingView pode ser lazy loaded:

```typescript
const OnboardingView = lazy(() => import('../components/OnboardingView'));
```

### 2. Memoization

```typescript
const showOnboarding = useMemo(
  () => !isLoading && customers.length === 0,
  [isLoading, customers.length]
);
```

### 3. Animation Performance

- Usar `transform` e `opacity` (GPU-accelerated)
- Evitar animações em `width`, `height`, `top`, `left`
- Framer Motion já otimiza automaticamente

## Security Considerations

### 1. LocalStorage

- Não armazenar dados sensíveis
- Token de visita é apenas flag booleana
- SessionId já está sendo usado de forma segura

### 2. XSS Prevention

- React já escapa strings automaticamente
- Não usar `dangerouslySetInnerHTML`

### 3. CSRF

- Não aplicável (apenas leitura de localStorage)
- Conexão WhatsApp já protegida por sessionId

## Accessibility

### 1. Keyboard Navigation

```typescript
<Button
  size="lg"
  icon="cloud_download"
  onClick={onConnect}
  aria-label="Importar contatos do WhatsApp"
  tabIndex={0}
>
  Importar Contatos e Visualizar Métricas
</Button>
```

### 2. Screen Readers

```typescript
<motion.div
  role="main"
  aria-label="Tela de boas-vindas"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  {/* ... conteúdo ... */}
</motion.div>
```

### 3. Focus Management

- Botão deve receber foco automaticamente ao renderizar
- Modal deve capturar foco ao abrir

## Deployment Considerations

### 1. Rollback Strategy

Se houver problemas:
1. Remover FirstVisitGuard do App.tsx
2. Reverter modificações no WhatsAppConnectionContext
3. Remover OnboardingView

### 2. Feature Flag

Opcional: adicionar feature flag para controlar onboarding:

```typescript
const ENABLE_ONBOARDING = import.meta.env.VITE_ENABLE_ONBOARDING === 'true';

{ENABLE_ONBOARDING && <FirstVisitGuard>...</FirstVisitGuard>}
```

### 3. Monitoring

Adicionar analytics para rastrear:
- Taxa de conclusão do onboarding
- Tempo médio até primeira conexão
- Taxa de abandono no modal WhatsApp

```typescript
// Exemplo com Google Analytics
const handleConnect = () => {
  gtag('event', 'onboarding_connect_clicked');
  connect();
};
```

## Migration Path

### Fase 1: Preparação
1. Criar FirstVisitGuard
2. Criar OnboardingView
3. Adicionar testes unitários

### Fase 2: Integração
1. Modificar WhatsAppConnectionContext
2. Modificar CustomersPage
3. Integrar FirstVisitGuard no App.tsx

### Fase 3: Validação
1. Testes E2E
2. QA manual
3. Deploy em staging

### Fase 4: Produção
1. Deploy gradual (feature flag)
2. Monitoramento de métricas
3. Ajustes baseados em feedback


## Additional Features

### 1. Auto-Import After WhatsApp Connection

**Localização**: `app/src/contexts/WhatsAppConnectionContext.tsx`

**Modificação**: Adicionar trigger de importação após conexão bem-sucedida

```typescript
useEffect(() => {
  if (isConnected && showModal) {
    // Fechar modal
    setTimeout(() => {
      setShowModal(false);
    }, 1500);
    
    // Iniciar importação automática
    setTimeout(async () => {
      try {
        console.log('[WhatsAppConnectionContext] Iniciando importação automática...');
        await api.post('/whatsapp/import', { sessionId });
        console.log('[WhatsAppConnectionContext] Importação concluída');
      } catch (error) {
        console.error('[WhatsAppConnectionContext] Erro na importação:', error);
      }
    }, 2000);
  }
}, [isConnected, showModal, sessionId]);
```

**Backend Endpoint**: `POST /api/v1/whatsapp/import`
- Busca todos os contatos da conta WhatsApp
- Importa mensagens de cada contato
- Armazena no Supabase (tables: customers, interactions)
- Retorna status da importação

### 2. Remove Document List from Dashboard

**Localização**: `app/src/pages/Dashboard.tsx`

**Modificação**: Remover coluna de documentos do lado esquerdo

```typescript
export default function Dashboard() {
  // ... código existente ...

  return (
    <DashboardLayout>
      <div className="relative flex h-screen w-full flex-row overflow-hidden">
        {/* REMOVER: Document Management Panel */}
        
        {/* Manter apenas: RAG Chat Panel em tela cheia */}
        <div className="flex h-full w-full">
          <ChatPanel />
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### 3. Update Sidebar with Documents Link

**Localização**: `app/src/layouts/DashboardLayout.tsx`

**Modificação**: Link já existe, apenas garantir que está visível e funcional

```typescript
const navItems = [
  { path: '/', icon: 'dashboard', label: 'Dashboard', exact: true },
  { path: '/customers', icon: 'people', label: 'Clientes' },
  { path: '/interactions', icon: 'chat', label: 'Interações' },
  { path: '/tickets', icon: 'confirmation_number', label: 'Tickets' },
  { path: '/rag', icon: 'description', label: 'Documentos RAG' },
  { path: '/metrics', icon: 'analytics', label: 'Métricas' },
  { path: '/documents', icon: 'folder', label: 'Documentos' }, // ← Este link
  { path: '/settings', icon: 'settings', label: 'Configurações' },
];
```

### 4. RAG Testing Strategy

**Objetivo**: Validar que respostas do chat condizem com documentos

**Abordagem**:
1. Fazer upload de documento de teste com conteúdo conhecido
2. Fazer perguntas específicas sobre o conteúdo
3. Validar que a resposta inclui informações corretas do documento
4. Testar casos onde não há informação relevante

**Exemplo de Teste Manual**:
```typescript
// 1. Upload documento "produto-x.txt" com conteúdo:
// "O Produto X custa R$ 299,90 e tem garantia de 2 anos"

// 2. Perguntar no chat:
// "Qual o preço do Produto X?"

// 3. Validar resposta:
// Deve mencionar "R$ 299,90"

// 4. Perguntar sobre algo não documentado:
// "Qual a cor do Produto Y?"

// 5. Validar resposta:
// Deve indicar que não encontrou informação
```

**Testes Automatizados** (opcional):
```typescript
describe('RAG Integration', () => {
  it('deve responder corretamente sobre documento', async () => {
    // Upload documento
    await documentsAPI.upload(testDocument);
    
    // Fazer pergunta
    const response = await chatAPI.ask('Qual o preço do Produto X?');
    
    // Validar resposta
    expect(response.answer).toContain('R$ 299,90');
  });
});
```
