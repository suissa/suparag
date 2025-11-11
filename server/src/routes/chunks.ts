import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/v1/chunks - Listar chunks (com filtro opcional por document_id)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { document_id } = req.query;

    let query = supabase
      .from('chunks')
      .select('*')
      .order('chunk_index', { ascending: true });

    if (document_id) {
      query = query.eq('document_id', document_id as string);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar chunks: ${error.message}`);
    }

    return res.json({
      success: true,
      count: data.length,
      chunks: data
    });
  } catch (error: any) {
    console.error('Erro ao listar chunks:', error);
    return res.status(500).json({
      error: 'Failed to list chunks',
      message: error.message
    });
  }
});

// GET /api/v1/chunks/:id - Obter chunk específico
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('chunks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Chunk not found',
          message: `Chunk com ID ${id} não encontrado`
        });
      }
      throw new Error(`Erro ao buscar chunk: ${error.message}`);
    }

    return res.json({
      success: true,
      chunk: data
    });
  } catch (error: any) {
    console.error('Erro ao obter chunk:', error);
    return res.status(500).json({
      error: 'Failed to get chunk',
      message: error.message
    });
  }
});

// POST /api/v1/chunks - Criar chunk
router.post('/', async (req: Request, res: Response) => {
  try {
    const { document_id, chunk_index, chunk_text, metadata } = req.body;

    if (!document_id || chunk_index === undefined || !chunk_text) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Os campos "document_id", "chunk_index" e "chunk_text" são obrigatórios'
      });
    }

    const { data, error } = await supabase
      .from('chunks')
      .insert([{
        document_id,
        chunk_index,
        chunk_text,
        metadata: metadata || {}
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar chunk: ${error.message}`);
    }

    console.log(`✅ Chunk criado: ${data.id}`);

    return res.status(201).json({
      success: true,
      message: 'Chunk criado com sucesso',
      chunk: data
    });
  } catch (error: any) {
    console.error('Erro ao criar chunk:', error);
    return res.status(500).json({
      error: 'Failed to create chunk',
      message: error.message
    });
  }
});

// DELETE /api/v1/chunks/:id - Deletar chunk
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('chunks')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar chunk: ${error.message}`);
    }

    console.log(`🗑️ Chunk deletado: ${id}`);

    return res.json({
      success: true,
      message: 'Chunk deletado com sucesso',
      id
    });
  } catch (error: any) {
    console.error('Erro ao deletar chunk:', error);
    return res.status(500).json({
      error: 'Failed to delete chunk',
      message: error.message
    });
  }
});

export default router;
