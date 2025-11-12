import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/v1/interactions - Listar todas as interações
router.get('/', async (req: Request, res: Response) => {
  try {
    const { customer_id } = req.query;

    let query = supabase
      .from('interactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (customer_id) {
      query = query.eq('customer_id', customer_id as string);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar interações',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { interactions: data }
    });
  } catch (error: any) {
    console.error('Erro ao listar interações:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/v1/interactions/:id - Obter interação por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Interação não encontrada'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar interação',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { interaction: data }
    });
  } catch (error: any) {
    console.error('Erro ao obter interação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/v1/interactions - Criar nova interação
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customer_id, channel, message, sentiment, embedding } = req.body;

    if (!customer_id || !channel || !message) {
      return res.status(400).json({
        success: false,
        message: 'Campos "customer_id", "channel" e "message" são obrigatórios'
      });
    }

    const { data, error } = await supabase
      .from('interactions')
      .insert({
        customer_id,
        channel,
        message,
        sentiment: sentiment || 0,
        embedding
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar interação',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      data: { interaction: data }
    });
  } catch (error: any) {
    console.error('Erro ao criar interação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/v1/interactions/:id - Deletar interação
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar interação',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { message: 'Interação deletada com sucesso' }
    });
  } catch (error: any) {
    console.error('Erro ao deletar interação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
