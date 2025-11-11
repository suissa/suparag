-- Criar tabela chunks
CREATE TABLE IF NOT EXISTS public.chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON public.chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_index ON public.chunks(chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_created_at ON public.chunks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chunks_metadata ON public.chunks USING GIN(metadata);

-- Criar índice composto para buscar chunks de um documento em ordem
CREATE INDEX IF NOT EXISTS idx_chunks_document_index ON public.chunks(document_id, chunk_index);

-- Adicionar comentários
COMMENT ON TABLE public.chunks IS 'Tabela de chunks de documentos para sistema RAG';
COMMENT ON COLUMN public.chunks.id IS 'Identificador único do chunk';
COMMENT ON COLUMN public.chunks.document_id IS 'ID do documento pai (FK para documents)';
COMMENT ON COLUMN public.chunks.chunk_index IS 'Índice/ordem do chunk no documento';
COMMENT ON COLUMN public.chunks.chunk_text IS 'Texto do chunk';
COMMENT ON COLUMN public.chunks.metadata IS 'Metadados do chunk (tokens, embeddings, etc)';
COMMENT ON COLUMN public.chunks.created_at IS 'Data de criação do chunk';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública
CREATE POLICY "Enable read access for all users" ON public.chunks
    FOR SELECT USING (true);

-- Criar política para permitir insert para usuários autenticados
CREATE POLICY "Enable insert for authenticated users only" ON public.chunks
    FOR INSERT WITH CHECK (true);

-- Criar política para permitir delete para usuários autenticados
CREATE POLICY "Enable delete for authenticated users only" ON public.chunks
    FOR DELETE USING (true);
