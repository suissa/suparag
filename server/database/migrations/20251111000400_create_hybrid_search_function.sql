-- ============================================
-- Busca Híbrida: Trigrama + Vector
-- Combina fuzzy search (pg_trgm) com semantic search (pgvector)
-- ============================================

-- ============================================
-- Função 1: Busca híbrida com embedding de referência
-- ============================================

CREATE OR REPLACE FUNCTION search_documents_hybrid(
  search_term TEXT,
  reference_embedding VECTOR(1536),
  trigram_limit INTEGER DEFAULT 50,
  final_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  trigram_score REAL,
  vector_distance REAL,
  combined_score REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    -- Fase 1: Filtrar com trigrama (fuzzy search)
    SELECT 
      d.id,
      d.title,
      d.content,
      d.metadata,
      d.created_at,
      d.updated_at,
      similarity(d.content, search_term) AS trgm_score
    FROM documents d
    WHERE d.content % search_term
    ORDER BY trgm_score DESC
    LIMIT trigram_limit
  ),
  ranked AS (
    -- Fase 2: Rerank com embedding (semantic search)
    SELECT 
      c.*,
      e.embedding <=> reference_embedding AS vec_dist,
      -- Score combinado: 70% trigrama + 30% vector (invertido)
      (c.trgm_score * 0.7) + ((1 - (e.embedding <=> reference_embedding)) * 0.3) AS comb_score
    FROM candidates c
    LEFT JOIN embeddings e ON e.document_id = c.id
  )
  SELECT 
    r.id,
    r.title,
    r.content,
    r.metadata,
    r.created_at,
    r.updated_at,
    r.trgm_score AS trigram_score,
    r.vec_dist AS vector_distance,
    r.comb_score AS combined_score
  FROM ranked r
  ORDER BY r.comb_score DESC
  LIMIT final_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_documents_hybrid IS 'Busca híbrida: filtra com trigrama, rerank com embedding';

-- ============================================
-- Função 2: Busca híbrida simplificada
-- ============================================

CREATE OR REPLACE FUNCTION search_documents_hybrid_simple(
  search_term TEXT,
  search_embedding VECTOR(1536),
  trigram_limit INTEGER DEFAULT 50,
  final_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  trigram_score REAL,
  vector_distance REAL,
  combined_score REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    -- Fase 1: Filtrar com trigrama
    SELECT 
      d.id,
      d.title,
      d.content,
      d.metadata,
      d.created_at,
      d.updated_at,
      similarity(d.content, search_term) AS trgm_score
    FROM documents d
    WHERE d.content % search_term
    ORDER BY trgm_score DESC
    LIMIT trigram_limit
  )
  SELECT 
    c.id,
    c.title,
    c.content,
    c.metadata,
    c.created_at,
    c.updated_at,
    c.trgm_score AS trigram_score,
    e.embedding <=> search_embedding AS vector_distance,
    -- Score combinado: 60% trigrama + 40% vector
    (c.trgm_score * 0.6) + ((1 - (e.embedding <=> search_embedding)) * 0.4) AS combined_score
  FROM candidates c
  LEFT JOIN embeddings e ON e.document_id = c.id
  ORDER BY combined_score DESC
  LIMIT final_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_documents_hybrid_simple IS 'Busca híbrida simplificada com embedding da query';

-- ============================================
-- Função 3: Busca híbrida apenas com IDs
-- ============================================

CREATE OR REPLACE FUNCTION search_documents_hybrid_ids(
  search_term TEXT,
  reference_doc_id UUID,
  trigram_limit INTEGER DEFAULT 50,
  final_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  trigram_score REAL,
  vector_distance REAL,
  combined_score REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH reference AS (
    -- Obter embedding do documento de referência
    SELECT embedding FROM embeddings WHERE document_id = reference_doc_id
  ),
  candidates AS (
    -- Fase 1: Filtrar com trigrama
    SELECT 
      d.id,
      similarity(d.content, search_term) AS trgm_score
    FROM documents d
    WHERE d.content % search_term
    ORDER BY trgm_score DESC
    LIMIT trigram_limit
  )
  SELECT 
    c.id,
    c.trgm_score AS trigram_score,
    e.embedding <=> r.embedding AS vector_distance,
    (c.trgm_score * 0.7) + ((1 - (e.embedding <=> r.embedding)) * 0.3) AS combined_score
  FROM candidates c
  LEFT JOIN embeddings e ON e.document_id = c.id
  CROSS JOIN reference r
  ORDER BY combined_score DESC
  LIMIT final_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_documents_hybrid_ids IS 'Busca híbrida usando ID de documento de referência';

-- ============================================
-- Exemplos de uso
-- ============================================

-- Exemplo 1: Busca híbrida com embedding customizado
-- SELECT * FROM search_documents_hybrid(
--   'dipironna',
--   '[0.1, 0.2, ...]'::vector(1536),
--   50,  -- candidatos trigrama
--   10   -- resultados finais
-- );

-- Exemplo 2: Busca híbrida simplificada
-- SELECT * FROM search_documents_hybrid_simple(
--   'analgesico',
--   '[0.1, 0.2, ...]'::vector(1536)
-- );

-- Exemplo 3: Busca híbrida com documento de referência
-- SELECT * FROM search_documents_hybrid_ids(
--   'dipironna',
--   'uuid-do-documento-referencia'
-- );

-- Exemplo 4: SQL direto (como no exemplo fornecido)
-- WITH candid AS (
--   SELECT id, content
--   FROM documents
--   WHERE content % 'dipironna'
--   ORDER BY similarity(content, 'dipironna') DESC
--   LIMIT 50
-- )
-- SELECT c.id, e.embedding <=> ref.embedding AS distance
-- FROM candid c
-- JOIN embeddings e ON e.document_id = c.id
-- CROSS JOIN (SELECT embedding FROM embeddings WHERE document_id = 'ref-uuid') ref
-- ORDER BY distance ASC;

-- ============================================
-- Ajustar pesos do score combinado
-- ============================================

-- Para dar mais peso ao trigrama (fuzzy):
-- (trgm_score * 0.8) + ((1 - vector_distance) * 0.2)

-- Para dar mais peso ao vector (semântica):
-- (trgm_score * 0.4) + ((1 - vector_distance) * 0.6)

-- Balanceado (padrão):
-- (trgm_score * 0.5) + ((1 - vector_distance) * 0.5)
