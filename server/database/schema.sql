-- ============================================
-- NeuroPgRag Database Schema
-- Sistema de Chat AI com RAG + WhatsApp
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Tabela: documents
-- Armazena documentos completos (PDF, TXT, MD)
-- ============================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Tabela: chunks
-- Pedaços de texto dos documentos para RAG
-- ============================================
CREATE TABLE IF NOT EXISTS public.chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Tabela: embeddings
-- Vetores para busca semântica (pgvector)
-- ============================================
CREATE TABLE IF NOT EXISTS public.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Tabela: settings
-- Configurações do sistema (key-value)
-- ============================================
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Índices
-- ============================================

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_title ON public.documents(title);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON public.documents USING GIN(metadata);

-- Chunks
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON public.chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_index ON public.chunks(chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_created_at ON public.chunks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chunks_metadata ON public.chunks USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_chunks_document_index ON public.chunks(document_id, chunk_index);

-- Embeddings
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON public.embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_created_at ON public.embeddings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector_hnsw ON public.embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- Settings
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON public.settings(updated_at DESC);

-- ============================================
-- Funções e Triggers
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para documents
DROP TRIGGER IF EXISTS trigger_update_documents_updated_at ON public.documents;
CREATE TRIGGER trigger_update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para settings
DROP TRIGGER IF EXISTS trigger_update_settings_updated_at ON public.settings;
CREATE TRIGGER trigger_update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (ajuste conforme necessário)
-- Documents
CREATE POLICY "Enable read access for all users" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.documents FOR INSERT WITH CHECK (true);

-- Chunks
CREATE POLICY "Enable read access for all users" ON public.chunks FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.chunks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.chunks FOR DELETE USING (true);

-- Embeddings
CREATE POLICY "Enable read access for all users" ON public.embeddings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.embeddings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.embeddings FOR DELETE USING (true);

-- Settings
CREATE POLICY "Enable read access for all users" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.settings FOR DELETE USING (true);

-- ============================================
-- Dados Iniciais
-- ============================================

-- Configurações padrão
INSERT INTO public.settings (key, value) VALUES
  ('openrouter_api_key', ''),
  ('selected_model', 'gpt-4'),
  ('system_prompt', 'Você é um assistente útil e prestativo.')
ON CONFLICT (key) DO NOTHING;
