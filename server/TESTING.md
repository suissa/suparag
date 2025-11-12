# 🧪 Guia de Testes - CRM API

## Problema com WSL + Windows

Devido a limitações do npm com caminhos UNC do WSL (`\\wsl.localhost\...`), os testes devem ser executados **dentro do ambiente WSL/Linux**, não do PowerShell do Windows.

## Como Executar os Testes

### 1. Acesse o WSL/Linux

```bash
# No PowerShell do Windows, entre no WSL:
wsl

# Navegue até o diretório do projeto:
cd ~/projetos/novos/NeuroPgRag/server
```

### 2. Execute os Testes

```bash
# Executar todos os testes com coverage
npm run test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage detalhado
npm run test:coverage

# Gerar relatório HTML completo (testes + snapshot do Supabase)
npm run report

# Gerar apenas snapshot do Supabase
npm run snapshot
```

## Estrutura de Testes

```
server/src/tests/
├── setup.ts                 # Configuração global dos testes
├── customers.test.ts        # 7 testes - CRUD + validações
├── interactions.test.ts     # 8 testes - CRUD + filtros + embeddings
├── tickets.test.ts          # 9 testes - CRUD + filtros + status
└── rag.test.ts             # 12 testes - CRUD + busca semântica
```

**Total: 36 testes automatizados**

## Cobertura de Testes

### Customers API
- ✅ POST - Criar customer com validação
- ✅ POST - Erro quando falta campo obrigatório
- ✅ GET - Listar todos os customers
- ✅ GET /:id - Buscar customer por ID
- ✅ GET /:id - Erro 404 para ID inexistente
- ✅ PUT /:id - Atualizar customer
- ✅ DELETE /:id - Deletar customer

### Interactions API
- ✅ POST - Criar interaction com embedding
- ✅ POST - Erro quando faltam campos obrigatórios
- ✅ POST - Criar com sentiment padrão (0)
- ✅ GET - Listar todas as interactions
- ✅ GET ?customer_id - Filtrar por customer
- ✅ GET /:id - Buscar interaction por ID
- ✅ GET /:id - Erro 404 para ID inexistente
- ✅ DELETE /:id - Deletar interaction

### Tickets API
- ✅ POST - Criar ticket
- ✅ POST - Criar com status padrão (open)
- ✅ POST - Erro quando faltam campos obrigatórios
- ✅ GET - Listar todos os tickets
- ✅ GET ?customer_id - Filtrar por customer
- ✅ GET ?status - Filtrar por status
- ✅ GET /:id - Buscar ticket por ID
- ✅ GET /:id - Erro 404 para ID inexistente
- ✅ PUT /:id - Atualizar ticket completo
- ✅ PUT /:id - Atualizar apenas campos específicos
- ✅ DELETE /:id - Deletar ticket

### RAG API
- ✅ POST /documents - Criar documento RAG
- ✅ POST /documents - Erro quando faltam campos
- ✅ GET /documents - Listar todos os documentos
- ✅ GET /documents/:id - Buscar documento por ID
- ✅ GET /documents/:id - Erro 404 para ID inexistente
- ✅ POST /search/documents - Busca semântica em documentos
- ✅ POST /search/documents - Erro quando falta embedding
- ✅ POST /search/documents - Erro quando embedding não é array
- ✅ POST /search/interactions - Busca semântica em interactions
- ✅ POST /search/interactions - Usar threshold e limit padrão
- ✅ DELETE /documents/:id - Deletar documento
- ✅ Embeddings - generateSyntheticEmbedding consistente
- ✅ Embeddings - generateSyntheticEmbedding diferente para textos diferentes
- ✅ Embeddings - generateRandomEmbedding tamanho correto
- ✅ Embeddings - generateRandomEmbedding sempre diferente

## Relatórios Gerados

### 1. Relatório HTML (Jest)
- **Localização**: `server/reports/test-report.html`
- **Conteúdo**:
  - Resultados de todos os testes
  - Tempo de execução
  - Logs de console
  - Mensagens de erro detalhadas

### 2. Snapshot do Supabase (JSON)
- **Localização**: `server/reports/supabase-snapshot.json`
- **Conteúdo**:
  - Dados completos de todas as tabelas
  - Estatísticas agregadas
  - Timestamp da captura

### 3. Relatório HTML Aprimorado
Quando você executa `npm run report`, o script:
1. Executa todos os testes
2. Gera snapshot do Supabase
3. Injeta os dados do Supabase no relatório HTML
4. Adiciona gráficos e estatísticas visuais

**Visualização inclui**:
- 📊 Cards com totais (customers, interactions, tickets, documents)
- 📈 Distribuição de tickets por status
- 📈 Distribuição de interactions por canal
- 📋 Dados JSON completos (expandível)
- 🕐 Timestamp da captura

## Configuração do Jest

O arquivo `jest.config.js` está configurado com:
- **Preset**: ts-jest (suporte TypeScript)
- **Timeout**: 30 segundos (para operações com Supabase)
- **Coverage**: Todos os arquivos `.ts` exceto testes
- **Reporters**: Console + HTML
- **Setup**: Carrega variáveis de ambiente do `.env`

## Variáveis de Ambiente Necessárias

Certifique-se de que o arquivo `.env` contém:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
```

## Troubleshooting

### Erro: "Cannot find module '../config/supabase'"
- **Causa**: Jest não está resolvendo os módulos corretamente
- **Solução**: Execute dentro do WSL, não do PowerShell

### Erro: "EISDIR: illegal operation on a directory"
- **Causa**: npm no Windows com caminho UNC do WSL
- **Solução**: Execute `wsl` e rode os comandos dentro do Linux

### Testes falhando por timeout
- **Causa**: Conexão lenta com Supabase
- **Solução**: Aumente o timeout em `jest.config.js` (linha `testTimeout`)

### Erro de autenticação Supabase
- **Causa**: Variáveis de ambiente não carregadas
- **Solução**: Verifique se o `.env` existe e está correto

## Próximos Passos

1. **CI/CD**: Integrar testes no pipeline (GitHub Actions, GitLab CI)
2. **Testes E2E**: Adicionar testes de integração completos
3. **Mocks**: Criar mocks do Supabase para testes offline
4. **Performance**: Adicionar testes de carga e stress
5. **Segurança**: Testes de autenticação e autorização

## Comandos Úteis

```bash
# Limpar cache do Jest
npm run test -- --clearCache

# Executar apenas um arquivo de teste
npm run test -- customers.test.ts

# Executar testes com padrão no nome
npm run test -- --testNamePattern="should create"

# Ver coverage detalhado no terminal
npm run test:coverage -- --verbose

# Gerar apenas relatório HTML sem executar testes
npm run snapshot
```

## Estrutura de Resposta Padrão

Todos os endpoints seguem o padrão:

**Sucesso:**
```json
{
  "success": true,
  "data": {
    "customer": { ... },
    "customers": [ ... ],
    // ou outros dados
  }
}
```

**Erro:**
```json
{
  "success": false,
  "message": "Descrição do erro",
  "error": { ... } // opcional
}
```

---

**Desenvolvido com ❤️ para garantir qualidade e confiabilidade da API CRM**
