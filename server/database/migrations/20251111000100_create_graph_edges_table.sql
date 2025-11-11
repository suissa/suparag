-- ============================================
-- Criar tabela graph_edges
-- Grafo de conhecimento (Knowledge Graph)
-- ============================================

CREATE TABLE IF NOT EXISTS public.graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node UUID NOT NULL,
  to_node UUID NOT NULL,
  relation TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Criar índices para melhor performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_graph_edges_from_node ON public.graph_edges(from_node);
CREATE INDEX IF NOT EXISTS idx_graph_edges_to_node ON public.graph_edges(to_node);
CREATE INDEX IF NOT EXISTS idx_graph_edges_relation ON public.graph_edges(relation);
CREATE INDEX IF NOT EXISTS idx_graph_edges_metadata ON public.graph_edges USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_graph_edges_created_at ON public.graph_edges(created_at DESC);

-- Índice composto para buscar relações entre dois nós
CREATE INDEX IF NOT EXISTS idx_graph_edges_nodes ON public.graph_edges(from_node, to_node);

-- ============================================
-- Comentários
-- ============================================

COMMENT ON TABLE public.graph_edges IS 'Tabela de arestas do grafo de conhecimento (relações entre entidades)';
COMMENT ON COLUMN public.graph_edges.id IS 'Identificador único da aresta';
COMMENT ON COLUMN public.graph_edges.from_node IS 'UUID do nó de origem';
COMMENT ON COLUMN public.graph_edges.to_node IS 'UUID do nó de destino';
COMMENT ON COLUMN public.graph_edges.relation IS 'Tipo de relação (ex: "mentions", "references", "related_to")';
COMMENT ON COLUMN public.graph_edges.metadata IS 'Metadados da relação (peso, contexto, etc)';
COMMENT ON COLUMN public.graph_edges.created_at IS 'Data de criação da aresta';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.graph_edges
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.graph_edges
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.graph_edges
    FOR DELETE USING (true);

-- ============================================
-- Exemplos de uso
-- ============================================

-- Criar uma relação entre dois documentos
-- INSERT INTO graph_edges (from_node, to_node, relation, metadata)
-- VALUES (
--   'uuid-doc-1',
--   'uuid-doc-2',
--   'references',
--   '{"weight": 0.8, "context": "citação direta"}'
-- );

-- Buscar todas as relações de um documento
-- SELECT * FROM graph_edges WHERE from_node = 'uuid-doc-1';

-- Buscar relações bidirecionais
-- SELECT * FROM graph_edges 
-- WHERE from_node = 'uuid-doc-1' OR to_node = 'uuid-doc-1';

-- Buscar por tipo de relação
-- SELECT * FROM graph_edges WHERE relation = 'mentions';

-- Buscar relações com peso alto
-- SELECT * FROM graph_edges 
-- WHERE (metadata->>'weight')::float > 0.7;
