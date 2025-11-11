-- ============================================
-- Funções para busca e travessia no grafo
-- Graph Search & Traversal Functions
-- ============================================

-- 1. Buscar vizinhos diretos de um nó
CREATE OR REPLACE FUNCTION get_neighbors(
  node_id UUID,
  direction TEXT DEFAULT 'both'
)
RETURNS TABLE (
  edge_id UUID,
  neighbor_id UUID,
  relation TEXT,
  metadata JSONB,
  direction_type TEXT
) AS $$
BEGIN
  IF direction = 'outgoing' THEN
    RETURN QUERY
    SELECT id, to_node, relation, metadata, 'outgoing'::TEXT
    FROM graph_edges
    WHERE from_node = node_id;
  ELSIF direction = 'incoming' THEN
    RETURN QUERY
    SELECT id, from_node, relation, metadata, 'incoming'::TEXT
    FROM graph_edges
    WHERE to_node = node_id;
  ELSE -- both
    RETURN QUERY
    SELECT id, to_node, relation, metadata, 'outgoing'::TEXT
    FROM graph_edges
    WHERE from_node = node_id
    UNION ALL
    SELECT id, from_node, relation, metadata, 'incoming'::TEXT
    FROM graph_edges
    WHERE to_node = node_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Encontrar caminho mais curto entre dois nós (BFS)
CREATE OR REPLACE FUNCTION find_path(
  start_node UUID,
  end_node UUID,
  max_depth INTEGER DEFAULT 5
)
RETURNS TABLE (
  path_length INTEGER,
  path UUID[],
  relations TEXT[]
) AS $$
WITH RECURSIVE graph_path AS (
  -- Caso base: nó inicial
  SELECT 
    from_node,
    to_node,
    relation,
    ARRAY[from_node, to_node] AS path,
    ARRAY[relation] AS relations,
    1 AS depth
  FROM graph_edges
  WHERE from_node = start_node
  
  UNION ALL
  
  -- Caso recursivo: expandir caminho
  SELECT 
    e.from_node,
    e.to_node,
    e.relation,
    gp.path || e.to_node,
    gp.relations || e.relation,
    gp.depth + 1
  FROM graph_edges e
  INNER JOIN graph_path gp ON e.from_node = gp.to_node
  WHERE 
    e.to_node <> ALL(gp.path) -- Evitar ciclos
    AND gp.depth < max_depth
    AND gp.to_node <> end_node
)
SELECT 
  depth AS path_length,
  path,
  relations
FROM graph_path
WHERE to_node = end_node
ORDER BY depth
LIMIT 1;
$$ LANGUAGE sql;

-- 3. Buscar nós relacionados por tipo de relação
CREATE OR REPLACE FUNCTION get_related_by_relation(
  node_id UUID,
  relation_type TEXT
)
RETURNS TABLE (
  related_node UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT to_node, metadata, created_at
  FROM graph_edges
  WHERE from_node = node_id AND relation = relation_type
  UNION
  SELECT from_node, metadata, created_at
  FROM graph_edges
  WHERE to_node = node_id AND relation = relation_type;
END;
$$ LANGUAGE plpgsql;

-- 4. Contar grau de um nó (número de conexões)
CREATE OR REPLACE FUNCTION get_node_degree(
  node_id UUID
)
RETURNS TABLE (
  outgoing_degree INTEGER,
  incoming_degree INTEGER,
  total_degree INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM graph_edges WHERE from_node = node_id) AS outgoing_degree,
    (SELECT COUNT(*)::INTEGER FROM graph_edges WHERE to_node = node_id) AS incoming_degree,
    (SELECT COUNT(*)::INTEGER FROM graph_edges WHERE from_node = node_id OR to_node = node_id) AS total_degree;
END;
$$ LANGUAGE plpgsql;

-- 5. Buscar subgrafo (nós conectados até N níveis)
CREATE OR REPLACE FUNCTION get_subgraph(
  root_node UUID,
  max_depth INTEGER DEFAULT 2
)
RETURNS TABLE (
  node_id UUID,
  depth INTEGER,
  relation TEXT,
  parent_node UUID
) AS $$
WITH RECURSIVE subgraph AS (
  -- Caso base: nó raiz
  SELECT 
    root_node AS node_id,
    0 AS depth,
    NULL::TEXT AS relation,
    NULL::UUID AS parent_node
  
  UNION ALL
  
  -- Caso recursivo: expandir vizinhos
  SELECT 
    e.to_node AS node_id,
    sg.depth + 1 AS depth,
    e.relation,
    e.from_node AS parent_node
  FROM graph_edges e
  INNER JOIN subgraph sg ON e.from_node = sg.node_id
  WHERE sg.depth < max_depth
)
SELECT DISTINCT * FROM subgraph;
$$ LANGUAGE sql;

-- ============================================
-- Comentários
-- ============================================

COMMENT ON FUNCTION get_neighbors(UUID, TEXT) IS 'Retorna vizinhos diretos de um nó';
COMMENT ON FUNCTION find_path(UUID, UUID, INTEGER) IS 'Encontra o caminho mais curto entre dois nós (BFS)';
COMMENT ON FUNCTION get_related_by_relation(UUID, TEXT) IS 'Retorna nós relacionados por tipo de relação específico';
COMMENT ON FUNCTION get_node_degree(UUID) IS 'Retorna o grau (número de conexões) de um nó';
COMMENT ON FUNCTION get_subgraph(UUID, INTEGER) IS 'Retorna subgrafo conectado até N níveis de profundidade';

-- ============================================
-- Exemplos de uso
-- ============================================

-- 1. Buscar vizinhos
-- SELECT * FROM get_neighbors('uuid-do-no', 'both');

-- 2. Encontrar caminho
-- SELECT * FROM find_path('uuid-origem', 'uuid-destino', 5);

-- 3. Buscar por relação
-- SELECT * FROM get_related_by_relation('uuid-do-no', 'references');

-- 4. Grau do nó
-- SELECT * FROM get_node_degree('uuid-do-no');

-- 5. Subgrafo
-- SELECT * FROM get_subgraph('uuid-raiz', 2);
