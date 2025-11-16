# 🎯 CRM Frontend - NeuroPgRag

Interface completa do CRM com RAG integrada ao Supabase, construída com React + TypeScript + TailwindCSS.

## 🚀 Stack Tecnológico

- **Framework**: React 18+
- **Linguagem**: TypeScript
- **Styling**: TailwindCSS + Custom Theme
- **Animações**: Framer Motion
- **State Management**: React Query + Context API
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Gráficos**: Recharts
- **Testes**: Playwright (em desenvolvimento)

## 📁 Estrutura do Projeto

```
app/src/
├── components/          # Componentes reutilizáveis
│   ├── Button.tsx      # Botão com variantes e loading
│   ├── Card.tsx        # Card com animações
│   ├── Input.tsx       # Input com label e erro
│   ├── Modal.tsx       # Modal com animações
│   └── Table.tsx       # Tabela com animações e loading
├── contexts/           # Contextos globais
│   └── CRMContext.tsx  # Estado global do CRM
├── hooks/              # Hooks customizados
│   ├── useCustomers.ts
│   ├── useInteractions.ts
│   ├── useTickets.ts
│   ├── useRagDocs.ts
│   └── useMetrics.ts
├── layouts/            # Layouts
│   └── DashboardLayout.tsx
├── pages/              # Páginas
│   ├── customers/
│   │   ├── index.tsx   # Listagem
│   │   └── [id].tsx    # Detalhes
│   ├── interactions/
│   │   └── index.tsx
│   ├── tickets/
│   │   └── index.tsx
│   ├── rag/
│   │   └── index.tsx
│   └── metrics/
│       └── index.tsx
└── services/
    └── supabaseClient.ts
```

## 🎨 Páginas Implementadas

### 1. **Clientes** (`/customers`)
- ✅ Listagem com busca e filtros
- ✅ CRUD completo
- ✅ Detalhes do cliente com histórico
- ✅ Métricas individuais (gasto total, churn risk)
- ✅ Timeline de interações e tickets

### 2. **Interações** (`/interactions`)
- ✅ Listagem de todas as interações
- ✅ Filtros por canal (chat, email, whatsapp, phone)
- ✅ Análise de sentimento visual
- ✅ Criação de novas interações
- ✅ Animações com Framer Motion

### 3. **Tickets** (`/tickets`)
- ✅ Gerenciamento completo de tickets
- ✅ Filtros por status
- ✅ Status coloridos com animações
- ✅ Ação rápida para resolver tickets
- ✅ Avaliação de satisfação

### 4. **Documentos RAG** (`/rag`)
- ✅ Base de conhecimento
- ✅ Upload de documentos
- ✅ **Busca semântica** com embeddings
- ✅ Visualização de similaridade
- ✅ Integração com vetores 1536D

### 5. **Métricas** (`/metrics`)
- ✅ Dashboard com KPIs principais
- ✅ Gráficos de pizza (Recharts)
- ✅ Distribuição de tickets por status
- ✅ Distribuição de interações por canal
- ✅ Métricas agregadas em tempo real

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto `app/`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_API_URL=http://localhost:4000/api/v1
```

### 2. Instalação

```bash
cd app
npm install
```

### 3. Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

### 4. Build

```bash
npm run build
```

## 🎯 Funcionalidades Principais

### Busca Semântica (RAG)
A busca semântica utiliza embeddings de 1536 dimensões para encontrar documentos similares:

```typescript
// Exemplo de uso
const results = await semanticSearch.mutateAsync({ 
  query: "Como configurar o sistema?",
  threshold: 0.5,  // Similaridade mínima
  limit: 10        // Máximo de resultados
});
```

### React Query
Todas as requisições utilizam React Query para cache e sincronização:

```typescript
const { data: customers, isLoading } = useCustomers();
const createCustomer = useCreateCustomer();
```

### Animações
Componentes animados com Framer Motion:

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
>
  {/* Conteúdo */}
</motion.div>
```

## 📊 Integração com Supabase

### Tabelas Utilizadas
- `customers` - Dados dos clientes
- `interactions` - Histórico de comunicações
- `tickets` - Tickets de suporte
- `rag_documents` - Base de conhecimento

### Realtime (Opcional)
O Supabase Realtime está configurado para atualizações automáticas:

```typescript
supabase
  .channel('customers')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'customers' 
  }, (payload) => {
    // Atualizar UI
  })
  .subscribe();
```

## 🎨 Tema e Estilo

### Cores Principais
- **Primary**: `#13a4ec` (Azul)
- **Background Dark**: `#101c22`
- **Background Card**: `#111c22`

### Componentes Reutilizáveis
Todos os componentes seguem o padrão do design system:

```typescript
<Button variant="primary" icon="add" loading={isLoading}>
  Criar
</Button>

<Input 
  label="Nome" 
  icon="person" 
  error="Campo obrigatório"
/>

<Card title="Título" icon="analytics">
  {/* Conteúdo */}
</Card>
```

## 🧪 Testes (Em Desenvolvimento)

### Playwright
Testes E2E serão implementados com Playwright:

```bash
npm run test:e2e
```

### Cenários de Teste
- [ ] Criação de cliente
- [ ] Busca semântica
- [ ] Filtros e paginação
- [ ] Criação de tickets
- [ ] Visualização de métricas

## 📈 Performance

### Otimizações Implementadas
- ✅ React Query com cache de 5 minutos
- ✅ Lazy loading de componentes
- ✅ Debounce em buscas
- ✅ Virtualização de listas grandes (futuro)
- ✅ Code splitting por rota

## 🔐 Segurança

- ✅ Variáveis de ambiente para credenciais
- ✅ Validação de formulários
- ✅ Sanitização de inputs
- ✅ Row Level Security (RLS) no Supabase

## 📱 Responsividade

Todas as páginas são responsivas com breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🚀 Próximos Passos

1. **Testes Playwright** - Cobertura completa E2E
2. **Relatório HTML** - Dashboard de testes
3. **Autenticação** - Login e permissões
4. **Notificações** - Toast messages
5. **Export de Dados** - CSV, PDF
6. **Filtros Avançados** - Datas, ranges
7. **Paginação** - Infinite scroll
8. **Dark/Light Mode** - Toggle de tema

## 📝 Notas de Desenvolvimento

### Convenções de Código
- Componentes em PascalCase
- Hooks com prefixo `use`
- Tipos exportados do `supabaseClient.ts`
- Commits semânticos com emojis

### Estrutura de Commits
```
✨ feat: Nova funcionalidade
🐛 fix: Correção de bug
📝 docs: Documentação
🎨 style: Estilo/formatação
♻️ refactor: Refatoração
⚡️ perf: Performance
✅ test: Testes
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m '✨ feat: Nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com ❤️ usando React + Supabase + TypeScript**
