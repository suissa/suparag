-- ============================================
-- Criar índices adicionais para performance
-- ============================================

-- Nota: A tabela documents não tem coluna embedding
-- Os embeddings estão na tabela embeddings separada

-- ============================================
-- Índices GIN (já existem, mas garantindo)
-- ============================================

-- Full-text search index (já criado anteriormente)
CREATE INDEX IF NOT EXISTS idx_documents_tokens ON public.documents USING GIN(tokens);

-- JSONB search index (já criado anteriormente)
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON public.documents USING GIN(metadata);

-- ============================================
-- Índice IVFFlat para busca vetorial
-- ============================================

-- IVFFlat é uma alternativa ao HNSW para datasets muito grandes
-- HNSW: Melhor precisão, mais rápido para datasets pequenos/médios
-- IVFFlat: Melhor para datasets muito grandes (milhões de vetores)

CREATE INDEX IF NOT EXISTS idx_embeddings_vector_ivfflat ON public.embeddings 
  USING ivfflat (embedding vector_l2_ops)
  WITH (lists = 100);

-- ============================================
-- Comentários sobre os índices
-- ============================================

COMMENT ON INDEX idx_documents_tokens IS 'Full-text search index usando GIN';
COMMENT ON INDEX idx_documents_metadata IS 'JSONB search index usando GIN';
COMMENT ON INDEX idx_embeddings_vector_hnsw IS 'Vector similarity search usando HNSW (melhor precisão)';
COMMENT ON INDEX idx_embeddings_vector_ivfflat IS 'Vector similarity search usando IVFFlat (melhor para datasets grandes)';

-- ============================================
-- Notas sobre uso dos índices
-- ============================================

-- Full-text search (tokens):
-- SELECT * FROM documents WHERE tokens @@ to_tsquery('portuguese', 'palavra');

-- JSONB search (metadata):
-- SELECT * FROM documents WHERE metadata @> '{"author": "João"}';
-- SELECT * FROM documents WHERE metadata ? 'tags';

-- Vector similarity (HNSW - mais preciso):
-- SELECT * FROM embeddings ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector LIMIT 10;

-- Vector similarity (IVFFlat - mais rápido para datasets grandes):
-- SELECT * FROM embeddings ORDER BY embedding <-> '[0.1, 0.2, ...]'::vector LIMIT 10;
