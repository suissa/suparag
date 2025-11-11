-- Adicionar novos campos na tabela documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS tokens tsvector,
  ADD COLUMN IF NOT EXISTS section TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT;

-- Atualizar comentários dos campos
COMMENT ON COLUMN public.documents.metadata IS 'Metadados do documento (entidade, autor, fonte, tags, filename, type, size, etc)';
COMMENT ON COLUMN public.documents.tokens IS 'Full-text search index (tsvector)';
COMMENT ON COLUMN public.documents.section IS 'Seção do documento (results, abstract, introduction, etc)';
COMMENT ON COLUMN public.documents.source IS 'Origem do documento (upload, whatsapp, api)';

-- Criar índice GIN para full-text search
CREATE INDEX IF NOT EXISTS idx_documents_tokens ON public.documents USING GIN(tokens);

-- Criar índice para section
CREATE INDEX IF NOT EXISTS idx_documents_section ON public.documents(section);

-- Criar índice para source
CREATE INDEX IF NOT EXISTS idx_documents_source ON public.documents(source);

-- Criar função para atualizar tokens automaticamente
CREATE OR REPLACE FUNCTION update_documents_tokens()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tokens = to_tsvector('portuguese', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar tokens
DROP TRIGGER IF EXISTS trigger_update_documents_tokens ON public.documents;
CREATE TRIGGER trigger_update_documents_tokens
    BEFORE INSERT OR UPDATE OF title, content ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_tokens();

-- Atualizar tokens para documentos existentes
UPDATE public.documents
SET tokens = to_tsvector('portuguese', COALESCE(title, '') || ' ' || COALESCE(content, ''))
WHERE tokens IS NULL;
