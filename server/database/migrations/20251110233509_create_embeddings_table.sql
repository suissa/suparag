-- Habilitar extensão pgvector se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar tabela embeddings
CREATE TABLE IF NOT EXISTS public.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON public.embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_created_at ON public.embeddings(created_at DESC);

-- Criar índice HNSW para busca de similaridade vetorial (mais rápido que IVFFlat)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector_hnsw ON public.embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- Adicionar comentários
COMMENT ON TABLE public.embeddings IS 'Tabela de embeddings vetoriais para busca semântica RAG';
COMMENT ON COLUMN public.embeddings.id IS 'Identificador único do embedding';
COMMENT ON COLUMN public.embeddings.document_id IS 'ID do documento (FK para documents)';
COMMENT ON COLUMN public.embeddings.embedding IS 'Vetor de embedding (1536 dimensões para OpenAI)';
COMMENT ON COLUMN public.embeddings.created_at IS 'Data de criação do embedding';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública
CREATE POLICY "Enable read access for all users" ON public.embeddings
    FOR SELECT USING (true);

-- Criar política para permitir insert para usuários autenticados
CREATE POLICY "Enable insert for authenticated users only" ON public.embeddings
    FOR INSERT WITH CHECK (true);

-- Criar política para permitir delete para usuários autenticados
CREATE POLICY "Enable delete for authenticated users only" ON public.embeddings
    FOR DELETE USING (true);
