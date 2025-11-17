# Database Schema - SUPARAG

Documentação completa do schema do banco de dados PostgreSQL + pgvector.

## 📊 Estrutura das Tabelas

### 1. documents
Armazena documentos completos (PDF, TXT, MD).

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens TSVECTOR,
  section TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `id` - UUID único do documento
- `title` - Título ou nome do arquivo
- `content` - Conteúdo completo extraído
- `metadata` - Metadados (entidade, autor, fonte, tags, filename, type, size)
- `tokens` - Full-text search index (tsvector)
- `section` - Seção do documento (results, abstract, introduction)
- `source` - Origem (upload, whatsapp, api)
- `created_at` - Data de criação
- `updated_at` - Data de atualização (auto-atualizado)

### 2. chunks
Pedaços de texto dos documentos para RAG.

```sql
CREATE TABLE chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `id` - UUID único do chunk
- `document_id` - FK para documents (CASCADE DELETE)
- `chunk_index` - Ordem do chunk no documento
- `chunk_text` - Texto do chunk
- `metadata` - Metadados (tokens, embeddings, etc)
- `created_at` - Data de criação

### 3. embeddings
Vetores para busca semântica (pgvector).

```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `id` - UUID único do embedding
- `document_id` - FK para documents (CASCADE DELETE)
- `embedding` - Vetor de 1536 dimensões (OpenAI text-embedding-ada-002)
- `created_at` - Data de criação

### 4. settings
Configurações do sistema (key-value).

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `key` - Chave única da configuração
- `value` - Valor da configuração
- `created_at` - Data de criação
- `updated_at` - Data de atualização (auto-atualizado)

## 🔍 Índices

### Documents
```sql
-- Full-text search
CREATE INDEX idx_documents_tokens ON documents USING GIN(tokens);

-- JSONB search
CREATE INDEX idx_documents_metadata ON documents USING GIN(metadata);

-- Campos simples
CREATE INDEX idx_documents_title ON documents(title);
CREATE INDEX idx_documents_section ON documents(section);
CREATE INDEX idx_documents_source ON documents(source);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
```

### Chunks
```sql
CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_chunks_chunk_index ON chunks(chunk_index);
CREATE INDEX idx_chunks_document_index ON chunks(document_id, chunk_index);
CREATE INDEX idx_chunks_metadata ON chunks USING GIN(metadata);
```

### Embeddings
```sql
-- HNSW (melhor precisão)
CREATE INDEX idx_embeddings_vector_hnsw ON embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- IVFFlat (melhor para datasets grandes)
CREATE INDEX idx_embeddings_vector_ivfflat ON embeddings 
  USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

CREATE INDEX idx_embeddings_document_id ON embeddings(document_id);
```

## ⚙️ Funções e Triggers

### 1. Auto-atualizar updated_at
```sql
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicado em: documents, settings
```

### 2. Auto-atualizar tokens (full-text search)
```sql
CREATE FUNCTION documents_tsv_trigger() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.tokens := to_tsvector('portuguese', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: tsv_update (BEFORE INSERT OR UPDATE)
```

## 🔐 Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com políticas básicas:

```sql
-- Leitura pública
CREATE POLICY "Enable read access for all users" 
  ON table_name FOR SELECT USING (true);

-- Insert/Update/Delete apenas autenticados
CREATE POLICY "Enable insert for authenticated users only" 
  ON table_name FOR INSERT WITH CHECK (true);
```

## 📝 Migrações

As migrações estão em ordem cronológica:

1. `20251110231538_create_documents_table.sql`
2. `20251110232832_create_chunks_table.sql`
3. `20251110233509_create_embeddings_table.sql`
4. `20251110235206_create_settings_table.sql`
5. `20251110235800_alter_documents_add_fields.sql`
6. `20251110235900_create_additional_indexes.sql`
7. `20251111000000_create_documents_tsv_trigger.sql`

## 🔎 Exemplos de Queries

### Full-text Search
```sql
-- Buscar documentos que contenham "inteligência artificial"
SELECT * FROM documents 
WHERE tokens @@ to_tsquery('portuguese', 'inteligência & artificial');

-- Com ranking de relevância
SELECT *, ts_rank(tokens, query) AS rank
FROM documents, to_tsquery('portuguese', 'inteligência & artificial') query
WHERE tokens @@ query
ORDER BY rank DESC;

-- Com highlight
SELECT title, ts_headline('portuguese', content, query) AS snippet
FROM documents, to_tsquery('portuguese', 'inteligência') query
WHERE tokens @@ query;
```

### JSONB Search
```sql
-- Buscar por autor
SELECT * FROM documents 
WHERE metadata @> '{"author": "João Silva"}';

-- Verificar se tem tags
SELECT * FROM documents 
WHERE metadata ? 'tags';

-- Buscar por tag específica
SELECT * FROM documents 
WHERE metadata->'tags' @> '["machine-learning"]';
```

### Vector Similarity Search
```sql
-- Buscar embeddings similares (HNSW - cosine similarity)
SELECT d.title, 1 - (e.embedding <=> '[0.1, 0.2, ...]'::vector) as similarity
FROM embeddings e
JOIN documents d ON d.id = e.document_id
ORDER BY e.embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;

-- Buscar embeddings similares (IVFFlat - L2 distance)
SELECT d.title, e.embedding <-> '[0.1, 0.2, ...]'::vector as distance
FROM embeddings e
JOIN documents d ON d.id = e.document_id
ORDER BY e.embedding <-> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

### Buscar Chunks de um Documento
```sql
SELECT * FROM chunks
WHERE document_id = 'uuid-do-documento'
ORDER BY chunk_index;
```

## 🚀 Aplicar Schema

### Opção 1: Via Supabase Dashboard
1. Acesse o SQL Editor no Supabase
2. Execute o arquivo `schema.sql`

### Opção 2: Via CLI
```bash
psql $DATABASE_URL -f database/schema.sql
```

### Opção 3: Via MCP (usado neste projeto)
As migrações foram aplicadas via MCP do Supabase durante o desenvolvimento.

## 📊 Diagrama ER

```
documents (1) ──< (N) chunks
documents (1) ──< (N) embeddings

settings (standalone)
```

## 🔧 Manutenção

### Reindexar Full-text Search
```sql
UPDATE documents SET tokens = to_tsvector('portuguese', content);
```

### Vacuum e Analyze
```sql
VACUUM ANALYZE documents;
VACUUM ANALYZE chunks;
VACUUM ANALYZE embeddings;
```

### Verificar Tamanho das Tabelas
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```
