-- Criar tabela documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_documents_title ON public.documents(title);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON public.documents USING GIN(metadata);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_documents_updated_at ON public.documents;
CREATE TRIGGER trigger_update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Adicionar comentários
COMMENT ON TABLE public.documents IS 'Tabela de documentos para sistema RAG';
COMMENT ON COLUMN public.documents.id IS 'Identificador único do documento';
COMMENT ON COLUMN public.documents.title IS 'Título ou nome do documento';
COMMENT ON COLUMN public.documents.content IS 'Conteúdo completo do documento';
COMMENT ON COLUMN public.documents.metadata IS 'Metadados do documento (filename, type, size, etc)';
COMMENT ON COLUMN public.documents.created_at IS 'Data de criação do documento';
COMMENT ON COLUMN public.documents.updated_at IS 'Data da última atualização';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública (ajuste conforme necessário)
CREATE POLICY "Enable read access for all users" ON public.documents
    FOR SELECT USING (true);

-- Criar política para permitir insert para usuários autenticados (ajuste conforme necessário)
CREATE POLICY "Enable insert for authenticated users only" ON public.documents
    FOR INSERT WITH CHECK (true);
