import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/v1/tickets - Listar todos os tickets
router.get('/', async (req: Request, res: Response) => {
  try {
    const { customer_id, status } = req.query;

    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (customer_id) {
      query = query.eq('customer_id', customer_id as string);
    }

    if (status) {
      query = query.eq('status', status as string);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar tickets',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { tickets: data }
    });
  } catch (error: any) {
    console.error('Erro ao listar tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/v1/tickets/:id - Obter ticket por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Ticket não encontrado'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar ticket',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { ticket: data }
    });
  } catch (error: any) {
    console.error('Erro ao obter ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/v1/tickets - Criar novo ticket
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customer_id, subject, description, status } = req.body;

    if (!customer_id || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Campos "customer_id" e "subject" são obrigatórios'
      });
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        customer_id,
        subject,
        description,
        status: status || 'open'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar ticket',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      data: { ticket: data }
    });
  } catch (error: any) {
    console.error('Erro ao criar ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/v1/tickets/:id - Atualizar ticket
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subject, description, status, satisfaction, resolved_at } = req.body;

    const updateData: any = {};
    if (subject !== undefined) updateData.subject = subject;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (satisfaction !== undefined) updateData.satisfaction = satisfaction;
    if (resolved_at !== undefined) updateData.resolved_at = resolved_at;

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar ticket',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { ticket: data }
    });
  } catch (error: any) {
    console.error('Erro ao atualizar ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/v1/tickets/:id - Deletar ticket
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar ticket',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { message: 'Ticket deletado com sucesso' }
    });
  } catch (error: any) {
    console.error('Erro ao deletar ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
