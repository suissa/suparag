-- ============================================
-- Habilitar extensão pg_trgm
-- Busca de similaridade de texto (fuzzy search)
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMENT ON EXTENSION pg_trgm IS 'Extensão para busca de similaridade de texto usando trigramas';

-- ============================================
-- Criar índices GIN com pg_trgm
-- ============================================

-- Índice para busca fuzzy no título
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON public.documents 
  USING GIN (title gin_trgm_ops);

-- Índice para busca fuzzy no conteúdo
CREATE INDEX IF NOT EXISTS idx_documents_content_trgm ON public.documents 
  USING GIN (content gin_trgm_ops);

-- Comentários
COMMENT ON INDEX idx_documents_title_trgm IS 'Índice trigram para busca fuzzy no título';
COMMENT ON INDEX idx_documents_content_trgm IS 'Índice trigram para busca fuzzy no conteúdo';

-- ============================================
-- Exemplos de uso
-- ============================================

-- 1. Busca por similaridade (fuzzy search)
-- Encontra textos similares mesmo com erros de digitação
-- SELECT title, similarity(title, 'inteligencia artificial') AS sim
-- FROM documents
-- WHERE title % 'inteligencia artificial'
-- ORDER BY sim DESC
-- LIMIT 10;

-- 2. Busca com threshold customizado
-- SET pg_trgm.similarity_threshold = 0.3;
-- SELECT * FROM documents WHERE title % 'machine lerning';

-- 3. Busca com LIKE otimizado (usando índice)
-- SELECT * FROM documents WHERE title ILIKE '%intelig%';

-- 4. Busca com distância de similaridade
-- SELECT title, word_similarity('AI', title) AS sim
-- FROM documents
-- WHERE 'AI' <% title
-- ORDER BY sim DESC;

-- 5. Busca combinada (full-text + trigram)
-- SELECT 
--   title,
--   ts_rank(tokens, query) AS rank,
--   similarity(title, 'inteligencia') AS sim
-- FROM documents, to_tsquery('portuguese', 'inteligencia') query
-- WHERE tokens @@ query OR title % 'inteligencia'
-- ORDER BY rank DESC, sim DESC;

-- ============================================
-- Operadores disponíveis
-- ============================================

-- %   - Similaridade (retorna true se similar)
-- <%  - Word similarity (palavra similar)
-- %>  - Word similarity (reverso)
-- <-> - Distância (menor = mais similar)
-- <<-> - Word distance
-- <->> - Word distance (reverso)

-- ============================================
-- Funções disponíveis
-- ============================================

-- similarity(text, text) -> float4
--   Retorna similaridade entre 0 e 1

-- word_similarity(text, text) -> float4
--   Similaridade de palavra

-- strict_word_similarity(text, text) -> float4
--   Similaridade estrita de palavra

-- show_trgm(text) -> text[]
--   Mostra os trigramas de um texto

-- show_limit() -> float4
--   Mostra o threshold atual

-- set_limit(float4) -> float4
--   Define o threshold de similaridade
