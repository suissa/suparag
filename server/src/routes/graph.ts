import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Interface para graph edge
interface GraphEdge {
  id?: string;
  from_node: string;
  to_node: string;
  relation: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

// POST /api/v1/graph - Criar aresta (relação)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { from_node, to_node, relation, metadata } = req.body;

    if (!from_node || !to_node || !relation) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Os campos "from_node", "to_node" e "relation" são obrigatórios'
      });
    }

    const edgeData: GraphEdge = {
      from_node,
      to_node,
      relation,
      metadata: metadata || {}
    };

    const { data, error } = await supabase
      .from('graph_edges')
      .insert([edgeData])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar aresta: ${error.message}`);
    }

    console.log(`✅ Aresta criada: ${data.id} (${relation})`);

    return res.status(201).json({
      success: true,
      message: 'Aresta criada com sucesso',
      edge: data
    });
  } catch (error: any) {
    console.error('Erro ao criar aresta:', error);
    return res.status(500).json({
      error: 'Failed to create edge',
      message: error.message
    });
  }
});

// GET /api/v1/graph - Listar arestas (com filtros opcionais)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { from_node, to_node, relation, node } = req.query;

    let query = supabase.from('graph_edges').select('*');

    // Filtrar por nó de origem
    if (from_node) {
      query = query.eq('from_node', from_node as string);
    }

    // Filtrar por nó de destino
    if (to_node) {
      query = query.eq('to_node', to_node as string);
    }

    // Filtrar por tipo de relação
    if (relation) {
      query = query.eq('relation', relation as string);
    }

    // Filtrar por qualquer nó (origem OU destino)
    if (node) {
      query = query.or(`from_node.eq.${node},to_node.eq.${node}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar arestas: ${error.message}`);
    }

    return res.json({
      success: true,
      count: data.length,
      edges: data
    });
  } catch (error: any) {
    console.error('Erro ao listar arestas:', error);
    return res.status(500).json({
      error: 'Failed to list edges',
      message: error.message
    });
  }
});

// GET /api/v1/graph/:id - Obter aresta específica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('graph_edges')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Edge not found',
          message: `Aresta com ID ${id} não encontrada`
        });
      }
      throw new Error(`Erro ao buscar aresta: ${error.message}`);
    }

    return res.json({
      success: true,
      edge: data
    });
  } catch (error: any) {
    console.error('Erro ao obter aresta:', error);
    return res.status(500).json({
      error: 'Failed to get edge',
      message: error.message
    });
  }
});

// GET /api/v1/graph/neighbors/:nodeId - Obter vizinhos de um nó
router.get('/neighbors/:nodeId', async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const { direction } = req.query; // 'outgoing', 'incoming', 'both' (default)

    let query = supabase.from('graph_edges').select('*');

    if (direction === 'outgoing') {
      query = query.eq('from_node', nodeId);
    } else if (direction === 'incoming') {
      query = query.eq('to_node', nodeId);
    } else {
      // both (default)
      query = query.or(`from_node.eq.${nodeId},to_node.eq.${nodeId}`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar vizinhos: ${error.message}`);
    }

    return res.json({
      success: true,
      nodeId,
      direction: direction || 'both',
      count: data.length,
      edges: data
    });
  } catch (error: any) {
    console.error('Erro ao buscar vizinhos:', error);
    return res.status(500).json({
      error: 'Failed to get neighbors',
      message: error.message
    });
  }
});

// GET /api/v1/graph/path/:fromNode/:toNode - Encontrar caminho entre dois nós
router.get('/path/:fromNode/:toNode', async (req: Request, res: Response) => {
  try {
    const { fromNode, toNode } = req.params;
    const { maxDepth } = req.query;

    const depth = maxDepth ? parseInt(maxDepth as string) : 5;

    const { data, error } = await supabase.rpc('find_path', {
      start_node: fromNode,
      end_node: toNode,
      max_depth: depth
    });

    if (error) {
      throw new Error(`Erro ao buscar caminho: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum caminho encontrado entre os nós'
      });
    }

    return res.json({
      success: true,
      fromNode,
      toNode,
      path: data[0]
    });
  } catch (error: any) {
    console.error('Erro ao buscar caminho:', error);
    return res.status(500).json({
      error: 'Failed to find path',
      message: error.message
    });
  }
});

// GET /api/v1/graph/subgraph/:nodeId - Obter subgrafo conectado
router.get('/subgraph/:nodeId', async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const { maxDepth } = req.query;

    const depth = maxDepth ? parseInt(maxDepth as string) : 2;

    const { data, error } = await supabase.rpc('get_subgraph', {
      root_node: nodeId,
      max_depth: depth
    });

    if (error) {
      throw new Error(`Erro ao buscar subgrafo: ${error.message}`);
    }

    return res.json({
      success: true,
      rootNode: nodeId,
      maxDepth: depth,
      nodes: data
    });
  } catch (error: any) {
    console.error('Erro ao buscar subgrafo:', error);
    return res.status(500).json({
      error: 'Failed to get subgraph',
      message: error.message
    });
  }
});

// GET /api/v1/graph/degree/:nodeId - Obter grau do nó
router.get('/degree/:nodeId', async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;

    const { data, error } = await supabase.rpc('get_node_degree', {
      node_id: nodeId
    });

    if (error) {
      throw new Error(`Erro ao buscar grau do nó: ${error.message}`);
    }

    return res.json({
      success: true,
      nodeId,
      degree: data[0]
    });
  } catch (error: any) {
    console.error('Erro ao buscar grau do nó:', error);
    return res.status(500).json({
      error: 'Failed to get node degree',
      message: error.message
    });
  }
});

// GET /api/v1/graph/related/:nodeId/:relation - Buscar nós relacionados por tipo
router.get('/related/:nodeId/:relation', async (req: Request, res: Response) => {
  try {
    const { nodeId, relation } = req.params;

    const { data, error } = await supabase.rpc('get_related_by_relation', {
      node_id: nodeId,
      relation_type: relation
    });

    if (error) {
      throw new Error(`Erro ao buscar nós relacionados: ${error.message}`);
    }

    return res.json({
      success: true,
      nodeId,
      relation,
      count: data.length,
      relatedNodes: data
    });
  } catch (error: any) {
    console.error('Erro ao buscar nós relacionados:', error);
    return res.status(500).json({
      error: 'Failed to get related nodes',
      message: error.message
    });
  }
});

// DELETE /api/v1/graph/:id - Deletar aresta
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('graph_edges')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar aresta: ${error.message}`);
    }

    console.log(`🗑️ Aresta deletada: ${id}`);

    return res.json({
      success: true,
      message: 'Aresta deletada com sucesso',
      id
    });
  } catch (error: any) {
    console.error('Erro ao deletar aresta:', error);
    return res.status(500).json({
      error: 'Failed to delete edge',
      message: error.message
    });
  }
});

export default router;
