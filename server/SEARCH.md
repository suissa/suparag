# Sistema de Busca - NeuroPgRag

Documentação completa do sistema de busca com suporte a fuzzy search (pg_trgm).

## 🔍 Tipos de Busca

### 1. Busca Normal (Listagem)
Retorna todos os documentos ordenados por data.

```bash
GET /api/v1/docs
```

**Resposta:**
```json
{
  "success": true,
  "count": 10,
  "documents": [...]
}
```

### 2. Busca Fuzzy (Similaridade)
Busca com tolerância a erros de digitação usando pg_trgm.

```bash
GET /api/v1/docs?search=dipironna&fuzzy=true
```

**Resposta:**
```json
{
  "success": true,
  "count": 5,
  "searchTerm": "dipironna",
  "searchType": "fuzzy",
  "documents": [
    {
      "id": "uuid",
      "title": "Medicamentos.pdf",
      "contentPreview": "...dipirona...",
      "score": 0.85,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 3. Busca com ILIKE
Busca parcial com ordenação por similaridade.

```bash
GET /api/v1/docs?search=analg&fuzzy=true
```

### 4. Busca Híbrida (Trigrama + Vector) ⭐
Combina fuzzy search com busca semântica para melhores resultados.

**Fase 1:** Filtra candidatos com trigrama (fuzzy)  
**Fase 2:** Rerank com embedding (semântica)

```sql
-- Exemplo: Buscar "dipironna" (com erro de digitação)
SELECT * FROM search_documents_hybrid(
  'dipironna',                    -- termo de busca
  '[0.1, 0.2, ...]'::vector(1536), -- embedding de referência
  50,                             -- candidatos trigrama
  10                              -- resultados finais
);
```

## 📊 Comparação de Métodos

| Método | Velocidade | Precisão | Tolera Erros | Uso |
|--------|-----------|----------|--------------|-----|
| **Fuzzy (%)** | Rápida | Alta | ✅ Sim | Busca com erros de digitação |
| **ILIKE** | Muito Rápida | Média | ❌ Não | Busca parcial exata |
| **Full-text** | Rápida | Alta | ❌ Não | Busca por palavras completas |
| **Vector** | Média | Muito Alta | ✅ Sim | Busca semântica |
| **Híbrida** ⭐ | Rápida | Muito Alta | ✅ Sim | Melhor dos dois mundos |

## 🎯 Exemplos de Uso

### JavaScript/TypeScript
```typescript
// Busca fuzzy
const response = await fetch('/api/v1/docs?search=dipironna&fuzzy=true');
const data = await response.json();

console.log(`Encontrados ${data.count} documentos`);
data.documents.forEach(doc => {
  console.log(`${doc.title} - Score: ${doc.score}`);
});
```

### cURL
```bash
# Busca fuzzy
curl "http://localhost:4000/api/v1/docs?search=dipironna&fuzzy=true"

# Busca normal
curl "http://localhost:4000/api/v1/docs"
```

## 🔧 Funções SQL Disponíveis

### 1. search_documents_fuzzy(search_term)
Busca usando operador `%` (similaridade).

```sql
SELECT * FROM search_documents_fuzzy('dipironna');
```

**Retorna:**
- id, title, content, metadata
- created_at, updated_at
- **score** (0.0 a 1.0) - quanto maior, mais similar

### 2. search_documents_ilike(search_term)
Busca usando ILIKE com ordenação por similaridade.

```sql
SELECT * FROM search_documents_ilike('analg');
```

### 3. search_documents_hybrid(search_term, embedding, limits) ⭐
Busca híbrida: trigrama + vector.

```sql
SELECT * FROM search_documents_hybrid(
  'dipironna',
  '[0.1, 0.2, ...]'::vector(1536),
  50,  -- candidatos trigrama
  10   -- resultados finais
);
```

**Retorna:**
- Todos os campos do documento
- **trigram_score** - Score do fuzzy search
- **vector_distance** - Distância vetorial
- **combined_score** - Score combinado (70% trigrama + 30% vector)

### 4. search_documents_hybrid_ids(search_term, reference_doc_id)
Busca híbrida usando documento de referência.

```sql
SELECT * FROM search_documents_hybrid_ids(
  'dipironna',
  'uuid-do-documento-referencia'
);
```

## 📈 Score de Similaridade

O score varia de **0.0** (nenhuma similaridade) a **1.0** (idêntico).

**Interpretação:**
- `0.8 - 1.0` - Muito similar (excelente match)
- `0.6 - 0.8` - Similar (bom match)
- `0.4 - 0.6` - Parcialmente similar (match razoável)
- `0.0 - 0.4` - Pouco similar (match fraco)

## 🎨 Exemplos Práticos

### Busca com Erros de Digitação

**Termo buscado:** `dipironna` (errado)  
**Termo correto:** `dipirona`  
**Score:** `0.85` ✅

```sql
SELECT id, similarity(content, 'dipironna') as score
FROM documents
WHERE content % 'dipironna'
ORDER BY score DESC;
```

### Busca Parcial

**Termo buscado:** `analg`  
**Encontra:** `analgésico`, `analgesia`  
**Score:** `0.72` ✅

```sql
SELECT *
FROM documents
WHERE content ILIKE '%analg%'
ORDER BY similarity(content, 'analg') DESC;
```

### Busca Híbrida (Exemplo Completo) ⭐

**Cenário:** Buscar "dipironna" com rerank semântico

```sql
-- Passo 1: Filtrar candidatos com trigrama
WITH candid AS (
  SELECT id, content
  FROM documents
  WHERE content % 'dipironna'
  ORDER BY similarity(content, 'dipironna') DESC
  LIMIT 50
)
-- Passo 2: Rerank com embedding
SELECT 
  c.id,
  similarity(c.content, 'dipironna') AS trigram_score,
  e.embedding <=> ref.embedding AS vector_distance
FROM candid c
JOIN embeddings e ON e.document_id = c.id
CROSS JOIN (
  SELECT embedding FROM embeddings WHERE document_id = 'ref-uuid'
) ref
ORDER BY e.embedding <=> ref.embedding ASC
LIMIT 10;
```

**Resultado:** Documentos similares tanto no texto quanto no significado!

### Busca com Threshold Customizado

```sql
-- Definir threshold mínimo de similaridade
SET pg_trgm.similarity_threshold = 0.3;

-- Buscar apenas resultados com score >= 0.3
SELECT * FROM documents WHERE content % 'machine lerning';
```

## 🚀 Performance

### Índices Criados
```sql
-- GIN para pg_trgm (fuzzy search)
CREATE INDEX idx_documents_title_trgm ON documents USING GIN (title gin_trgm_ops);
CREATE INDEX idx_documents_content_trgm ON documents USING GIN (content gin_trgm_ops);

-- GIN para full-text search
CREATE INDEX idx_documents_tokens ON documents USING GIN(tokens);
```

### Dicas de Performance

1. **Use fuzzy search para termos curtos** (< 20 caracteres)
2. **Use full-text search para frases completas**
3. **Use vector search para busca semântica**
4. **Combine métodos para melhores resultados**

## 🔄 Busca Híbrida (Recomendado)

Combine diferentes métodos para melhores resultados:

```typescript
async function searchDocuments(query: string) {
  // 1. Tentar fuzzy search primeiro
  const fuzzyResults = await fetch(`/api/v1/docs?search=${query}&fuzzy=true`);
  
  // 2. Se poucos resultados, tentar full-text
  if (fuzzyResults.count < 3) {
    const fullTextResults = await searchFullText(query);
    return [...fuzzyResults.documents, ...fullTextResults];
  }
  
  return fuzzyResults.documents;
}
```

## 📝 Configurações

### Ajustar Threshold de Similaridade

```sql
-- Mais permissivo (aceita matches mais fracos)
SET pg_trgm.similarity_threshold = 0.2;

-- Mais restritivo (apenas matches fortes)
SET pg_trgm.similarity_threshold = 0.5;

-- Padrão
SET pg_trgm.similarity_threshold = 0.3;
```

### Ver Trigramas de um Texto

```sql
SELECT show_trgm('dipirona');
-- Resultado: {" d"," di",dip,iro,iro,na ",ona,pir,ron}
```

## 🐛 Troubleshooting

### Busca não retorna resultados

1. Verificar se pg_trgm está habilitado:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';
```

2. Verificar índices:
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'documents';
```

3. Ajustar threshold:
```sql
SET pg_trgm.similarity_threshold = 0.1;
```

### Busca muito lenta

1. Verificar se índices existem
2. Usar LIMIT para limitar resultados
3. Considerar usar cache (Redis)

## 📚 Referências

- [pg_trgm Documentation](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Supabase Full-text Search](https://supabase.com/docs/guides/database/full-text-search)
- [PostgreSQL Text Search](https://www.postgresql.org/docs/current/textsearch.html)
