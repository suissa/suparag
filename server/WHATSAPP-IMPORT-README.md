# 📱 WhatsApp History Import & Lead Analysis

Sistema completo de ingestão e análise de históricos do WhatsApp com integração ao Supabase.

## 🎯 Funcionalidades

### 1. Importação de Históricos
- ✅ Leitura automática de arquivos `{phone}.json`
- ✅ Mapeamento flexível de campos
- ✅ Geração de embeddings sintéticos (1536D)
- ✅ Análise de sentimento automática
- ✅ Criação automática de clientes
- ✅ Inserção em batch no Supabase

### 2. Análises Comportamentais
- ✅ Classificação de status do lead (novo, ativo, quente, em negociação, convertido, frio)
- ✅ Detecção de pontos de abandono
- ✅ Cálculo de probabilidade de conversão
- ✅ Métricas de engajamento
- ✅ Análise de sentimento ao longo do tempo

### 3. Funções SQL Analíticas
- ✅ `get_lead_metrics()` - Métricas agregadas por lead
- ✅ `get_conversation_gaps()` - Detecta gaps de tempo
- ✅ `get_conversion_probabilities()` - Ranking de conversão
- ✅ `get_hot_leads()` - Leads quentes
- ✅ `get_cold_leads()` - Leads frios
- ✅ `get_sentiment_trend()` - Evolução do sentimento
- ✅ `detect_conversion_keywords()` - Palavras-chave de conversão

### 4. Relatórios Automáticos
- ✅ Relatório HTML interativo com gráficos
- ✅ Export JSON com snapshot das métricas
- ✅ Visualização de KPIs
- ✅ Top 10 leads prioritários

## 📋 Pré-requisitos

- Node.js 20+
- Conta Supabase
- PostgreSQL com extensão pgvector

## 🚀 Instalação

### 1. Instalar Dependências

```bash
cd server
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` no diretório `server/`:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_KEY=sua-chave-de-servico

# OpenAI (opcional - para embeddings reais)
OPENAI_API_KEY=sua-chave-openai

# Servidor
PORT=4000
NODE_ENV=development
```

### 3. Criar Funções SQL no Supabase

Execute o arquivo `sql/create_functions.sql` no SQL Editor do Supabase:

```bash
# Copie o conteúdo de sql/create_functions.sql e execute no Supabase
```

Ou use o CLI do Supabase:

```bash
supabase db push
```

### 4. Preparar Estrutura de Tabelas

Certifique-se de que as tabelas `customers` e `interactions` existem:

```sql
-- Tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de interações
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  channel TEXT NOT NULL,
  content TEXT NOT NULL,
  sentiment NUMERIC,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_interactions_customer ON interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_channel ON interactions(channel);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at);
```

## 📖 Uso

### Formato dos Arquivos JSON

Os arquivos devem seguir o formato `{phone}.json`:

```json
{
  "phone": "5511999999999",
  "messages": [
    {
      "from": "cliente",
      "text": "Olá, quero saber mais sobre o produto",
      "timestamp": "2025-11-12T12:03:22Z"
    },
    {
      "from": "atendente",
      "text": "Olá! Como posso ajudar?",
      "timestamp": "2025-11-12T12:05:00Z"
    }
  ]
}
```

### Comandos CLI

#### 1. Importar Históricos

```bash
# Importação básica
npm run import -- import --path ./data/whatsapp_histories

# Com função de mapeamento customizada
npm run import -- import --path ./data/whatsapp_histories --mapping ./scripts/mapFields.js
```

#### 2. Gerar Análises

```bash
# Gerar relatórios
npm run import -- analyze

# Especificar diretório de saída
npm run import -- analyze --output ./my-reports
```

#### 3. Pipeline Completo

```bash
# Importação + Análises
npm run import -- full --path ./data/whatsapp_histories

# Com todas as opções
npm run import -- full \
  --path ./data/whatsapp_histories \
  --mapping ./scripts/mapFields.js \
  --output ./reports
```

### Função de Mapeamento Customizada

Crie um arquivo JS com a função de mapeamento:

```javascript
// mapFields.js
module.exports = function mapFields(fields) {
  return {
    phone: fields.phone || fields.phoneNumber,
    message: fields.text || fields.message,
    timestamp: fields.timestamp || fields.date,
    from: fields.from || fields.sender
  };
};
```

## 📊 Análises Disponíveis

### Status do Lead

- **novo**: Menos de 3 mensagens
- **ativo**: Mensagens regulares, última interação < 7 dias
- **quente**: Alto engajamento, sentimento positivo, última interação < 3 dias
- **em_negociacao**: Palavras-chave de conversão, sentimento positivo
- **convertido**: Lead fechado
- **frio**: Sem interação há mais de 30 dias

### Probabilidade de Conversão

Calculada com base em:
- Palavras-chave de conversão (30 pontos)
- Sentimento positivo (25 pontos)
- Frequência de interações (20 pontos)
- Recência (15 pontos)
- Perguntas sobre funcionalidades (10 pontos)

### Pontos de Abandono

Detecta gaps de tempo > 7 dias entre mensagens e analisa:
- Sentimento antes do abandono
- Última mensagem enviada
- Motivo provável do abandono

## 🔍 Consultas SQL

### Métricas de um Lead

```sql
SELECT * FROM get_lead_metrics('uuid-do-cliente');
```

### Leads Quentes (>70% conversão)

```sql
SELECT * FROM get_hot_leads(70);
```

### Leads Frios (>30 dias inativos)

```sql
SELECT * FROM get_cold_leads(30);
```

### Ranking de Conversão

```sql
SELECT * FROM get_conversion_probabilities()
ORDER BY conversion_probability DESC
LIMIT 10;
```

### Gaps de Conversação

```sql
SELECT * FROM get_conversation_gaps('uuid-do-cliente');
```

### Tendência de Sentimento

```sql
SELECT * FROM get_sentiment_trend('uuid-do-cliente');
```

### Palavras-chave de Conversão

```sql
SELECT * FROM detect_conversion_keywords('uuid-do-cliente');
```

## 📈 Relatórios

### Relatório HTML

Gerado automaticamente em `reports/lead-insights.html`:

- 📊 KPIs principais (total de leads, leads quentes, etc.)
- 📉 Gráfico de distribuição por status
- 📊 Gráfico de top 10 leads por conversão
- 📋 Tabela com leads prioritários

### Relatório JSON

Gerado em `reports/lead-insights.json`:

```json
{
  "generatedAt": "2025-11-12T...",
  "summary": {
    "totalLeads": 150,
    "hotLeads": 25,
    "activeLeads": 80,
    "coldLeads": 20,
    "avgConversionProbability": 45.5
  },
  "leads": [...]
}
```

## 🧪 Testes

### Executar Testes

```bash
npm test
```

### Testes Incluídos

- ✅ Importação de arquivos JSON
- ✅ Tratamento de erros
- ✅ Geração de métricas
- ✅ Geração de relatórios
- ✅ Funções SQL

## 🔧 Desenvolvimento

### Estrutura de Arquivos

```
server/
├── src/
│   ├── scripts/
│   │   └── importWhatsAppHistory.ts    # Script principal de importação
│   ├── analytics/
│   │   └── leadAnalysis.ts             # Análises comportamentais
│   ├── reports/
│   │   └── leadReport.ts               # Geração de relatórios
│   └── utils/
│       ├── files.ts                    # Utilitários de arquivos
│       ├── embeddings.ts               # Geração de embeddings
│       └── sentiment.ts                # Análise de sentimento
├── scripts/
│   ├── run-import.ts                   # CLI principal
│   └── mapFields.example.js            # Exemplo de mapeamento
├── sql/
│   └── create_functions.sql            # Funções SQL
├── data/
│   └── example/                        # Dados de exemplo
└── reports/                            # Relatórios gerados
```

### Adicionar Nova Análise

1. Criar função em `src/analytics/leadAnalysis.ts`
2. Adicionar ao relatório em `src/reports/leadReport.ts`
3. Criar função SQL correspondente em `sql/create_functions.sql`

## 🚨 Troubleshooting

### Erro: "Supabase connection failed"

Verifique as variáveis de ambiente no `.env`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

### Erro: "pgvector extension not found"

Execute no SQL Editor do Supabase:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Erro: "Function not found"

Execute o arquivo `sql/create_functions.sql` no Supabase.

### Arquivos JSON não encontrados

Verifique:
- O caminho está correto
- Os arquivos têm extensão `.json`
- O formato do JSON está correto

## 📝 Exemplos

### Exemplo 1: Importação Simples

```bash
# 1. Colocar arquivos JSON em data/whatsapp_histories/
# 2. Executar importação
npm run import -- import --path ./data/whatsapp_histories

# 3. Gerar relatórios
npm run import -- analyze
```

### Exemplo 2: Pipeline Completo

```bash
npm run import -- full --path ./data/whatsapp_histories --output ./reports
```

### Exemplo 3: Consulta SQL

```sql
-- Buscar top 5 leads quentes
SELECT 
  customer_name,
  customer_phone,
  conversion_probability,
  total_messages
FROM get_hot_leads(70)
LIMIT 5;
```

## 🎯 Roadmap

- [ ] Integração com OpenAI para embeddings reais
- [ ] Suporte a múltiplos idiomas
- [ ] Dashboard web interativo
- [ ] Notificações automáticas para leads quentes
- [ ] Integração com CRM externo
- [ ] Análise de imagens e áudios
- [ ] Chatbot para respostas automáticas

## 📄 Licença

MIT

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Consulte a documentação
- Entre em contato com a equipe

---

**Desenvolvido com ❤️ para o NeuroPgRag CRM**
