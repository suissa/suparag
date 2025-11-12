# 🚀 Guia de Configuração - WhatsApp Import com Embeddings Reais

## 📋 Pré-requisitos

- Node.js 20+
- Conta Supabase (gratuita)
- Chave API OpenRouter ou OpenAI (para embeddings reais)

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` no diretório `server/`:

```env
# Supabase (obrigatório)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_KEY=sua-chave-de-servico

# OpenRouter/OpenAI (opcional - para embeddings reais)
OPENROUTER_API_KEY=sua-chave-openrouter
# OU
OPENAI_API_KEY=sua-chave-openai

# Servidor
PORT=4000
NODE_ENV=development
```

**Nota:** Se não configurar as chaves de API, o sistema usará embeddings sintéticos automaticamente.

### 2. Instalar Dependências

```bash
cd server
npm install
```

### 3. Configurar Banco de Dados

Execute no SQL Editor do Supabase:

```sql
-- 1. Habilitar pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Criar/verificar tabelas
-- (customers e interactions já devem existir)

-- 3. Criar funções SQL
-- Copie e execute todo o conteúdo de sql/create_functions.sql
```

## 🎯 Uso

### Importação Básica

```bash
# Testar com dados de exemplo
npm run import:example

# Importar seus dados
npm run import -- full --path ./seus-dados
```

### API de Métricas

Inicie o servidor:

```bash
npm run dev
```

Endpoints disponíveis:

```
GET http://localhost:4000/api/v1/metrics
GET http://localhost:4000/api/v1/metrics/kpis
GET http://localhost:4000/api/v1/metrics/charts
GET http://localhost:4000/api/v1/metrics/leads
GET http://localhost:4000/api/v1/metrics/leads/:customerId
GET http://localhost:4000/api/v1/metrics/leads/:customerId/status
```

### Testes

```bash
# Executar todos os testes
npm test

# Executar testes específicos
npm test -- whatsapp-import

# Gerar relatório de cobertura
npm run test:coverage
```

## 📊 Embeddings

### Embeddings Reais (Recomendado)

O sistema usa **OpenAI text-embedding-3-small** via OpenRouter:

- ✅ Melhor qualidade de busca semântica
- ✅ Dimensões: 1536
- ✅ Custo: ~$0.00002 por 1K tokens
- ✅ Fallback automático se falhar

**Como obter chave OpenRouter:**
1. Acesse https://openrouter.ai
2. Crie uma conta
3. Gere uma API key
4. Adicione ao `.env`: `OPENROUTER_API_KEY=sk-or-...`

### Embeddings Sintéticos (Fallback)

Se não houver chave API configurada:

- ⚠️ Qualidade inferior
- ✅ Gratuito
- ✅ Funciona offline
- ✅ Bom para desenvolvimento/testes

## 🔍 Verificação

### 1. Testar Conexão Supabase

```bash
curl http://localhost:4000/health
```

### 2. Testar Importação

```bash
npm run import:example
```

Deve exibir:

```
✅ Importação concluída!
   - Clientes: 2
   - Mensagens: 18
✅ Análises geradas!
📄 Arquivos gerados:
   - reports/lead-insights.json
   - reports/lead-insights.html
```

### 3. Testar API de Métricas

```bash
curl http://localhost:4000/api/v1/metrics/kpis
```

Deve retornar JSON com KPIs.

## 🐛 Troubleshooting

### Erro: "supabaseUrl is required"

**Solução:** Verifique se o arquivo `.env` existe e contém `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`.

### Erro: "Cannot find module 'commander'"

**Solução:**
```bash
npm install commander
```

### Embeddings sintéticos sendo usados

**Causa:** Chave API não configurada ou inválida.

**Solução:** Adicione `OPENROUTER_API_KEY` ou `OPENAI_API_KEY` ao `.env`.

### Erro ao gerar embedding

**Sintoma:** Mensagem "⚠️ Usando embedding sintético como fallback"

**Causa:** API key inválida ou limite de requisições atingido.

**Solução:** 
1. Verifique a chave API
2. Verifique saldo/créditos
3. Sistema continua funcionando com embeddings sintéticos

## 📈 Métricas Disponíveis

### KPIs Principais

- Total de clientes
- Tickets abertos
- Taxa de resolução
- Tempo médio de resposta
- Sentimento médio

### Análise de Leads

- Status (novo, ativo, quente, em_negociacao, convertido, frio)
- Probabilidade de conversão (0-100%)
- Total de mensagens
- Sentimento médio
- Dias desde última interação
- Score de atividade

### Gráficos

- Distribuição de tickets por status
- Interações por canal
- Evolução do sentimento
- Top leads por conversão

## 🎯 Próximos Passos

1. ✅ Configure as variáveis de ambiente
2. ✅ Execute a importação de exemplo
3. ✅ Verifique o relatório HTML gerado
4. ✅ Teste a API de métricas
5. ✅ Importe seus dados reais
6. ✅ Integre com seu frontend

## 📚 Documentação Adicional

- [README Completo](./WHATSAPP-IMPORT-README.md)
- [Quick Start](./QUICK-START-WHATSAPP.md)
- [Funções SQL](./sql/create_functions.sql)

---

**Pronto para começar!** 🚀

Se tiver dúvidas, consulte a documentação completa ou abra uma issue.
