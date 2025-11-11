-- ============================================
-- Criar funções de busca fuzzy
-- ============================================

-- Função 1: Busca fuzzy usando operador % (pg_trgm)
CREATE OR REPLACE FUNCTION search_documents_fuzzy(search_term TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    d.metadata,
    d.created_at,
    d.updated_at,
    similarity(d.content, search_term) AS score
  FROM documents d
  WHERE d.content % search_term
  ORDER BY score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_documents_fuzzy(TEXT) IS 'Busca fuzzy em documentos usando pg_trgm (similaridade)';

-- ============================================
-- Função 2: Busca com ILIKE + ordenação por similaridade
-- ============================================

CREATE OR REPLACE FUNCTION search_documents_ilike(search_term TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    d.metadata,
    d.created_at,
    d.updated_at,
    similarity(d.content, search_term) AS score
  FROM documents d
  WHERE d.content ILIKE '%' || search_term || '%'
  ORDER BY similarity(d.content, search_term) DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_documents_ilike(TEXT) IS 'Busca com ILIKE + ordenação por similaridade (pg_trgm)';

-- ============================================
-- Exemplos de uso
-- ============================================

-- Busca fuzzy (tolera erros de digitação)
-- SELECT * FROM search_documents_fuzzy('dipironna');

-- Busca com ILIKE (mais flexível)
-- SELECT * FROM search_documents_ilike('analg');

-- Busca SQL direta
-- SELECT id, similarity(content, 'dipironna') as score
-- FROM documents
-- WHERE content % 'dipironna'
-- ORDER BY score DESC;

-- ILIKE + trgm index (rápido)
-- SELECT *
-- FROM documents
-- WHERE content ILIKE '%analg%'
-- ORDER BY similarity(content, 'analg') DESC;
