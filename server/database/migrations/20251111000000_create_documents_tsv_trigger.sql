-- ============================================
-- Criar função e trigger para atualizar tokens
-- Full-text search automático
-- ============================================

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_update_documents_tokens ON public.documents;
DROP TRIGGER IF EXISTS tsv_update ON public.documents;

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS update_documents_tokens();

-- ============================================
-- Criar função para atualizar tokens (tsvector)
-- ============================================

CREATE OR REPLACE FUNCTION documents_tsv_trigger() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.tokens := to_tsvector('portuguese', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Criar trigger para atualizar tokens automaticamente
-- ============================================

CREATE TRIGGER tsv_update
    BEFORE INSERT OR UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE PROCEDURE documents_tsv_trigger();

-- ============================================
-- Comentários
-- ============================================

COMMENT ON FUNCTION documents_tsv_trigger() IS 'Atualiza automaticamente o campo tokens (tsvector) para full-text search';
COMMENT ON TRIGGER tsv_update ON public.documents IS 'Trigger que executa documents_tsv_trigger() antes de insert/update';

-- ============================================
-- Atualizar tokens para documentos existentes
-- ============================================

UPDATE public.documents
SET tokens = to_tsvector('portuguese', COALESCE(content, ''))
WHERE tokens IS NULL OR tokens = ''::tsvector;

-- ============================================
-- Exemplo de uso
-- ============================================

-- Buscar documentos que contenham a palavra "inteligência"
-- SELECT * FROM documents WHERE tokens @@ to_tsquery('portuguese', 'inteligência');

-- Buscar com ranking (relevância)
-- SELECT *, ts_rank(tokens, query) AS rank
-- FROM documents, to_tsquery('portuguese', 'inteligência & artificial') query
-- WHERE tokens @@ query
-- ORDER BY rank DESC;

-- Buscar com highlight (destacar palavras encontradas)
-- SELECT title, ts_headline('portuguese', content, query) AS snippet
-- FROM documents, to_tsquery('portuguese', 'inteligência') query
-- WHERE tokens @@ query;
