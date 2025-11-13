import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';

const router = Router();

// Schema de validação para configurações de áudio
const AudioSettingsSchema = z.object({
  preferred_voice_type: z.string().optional(),
  preferred_voice_id: z.string().optional(),
  wants_audio_summary: z.enum(['yes', 'no']).optional(),
  wants_summary_format: z.enum(['text', 'audio', 'both']).optional(),
  incoming_audio_behavior: z.enum(['transcribe', 'store', 'both']).optional(),
  outgoing_preference: z.enum(['text', 'audio', 'both']).optional(),
  persona_voice_profile: z.record(z.any()).optional()
});

// GET /api/v1/customers - Listar todos os clientes
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar clientes',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { customers: data }
    });
  } catch (error: any) {
    console.error('Erro ao listar clientes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/v1/customers/:id - Obter cliente por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar cliente',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { customer: data }
    });
  } catch (error: any) {
    console.error('Erro ao obter cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/v1/customers - Criar novo cliente
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, segment } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Campo "name" é obrigatório'
      });
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        name,
        email,
        phone,
        company,
        segment,
        total_spent: 0,
        churn_risk: 0
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar cliente',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      data: { customer: data }
    });
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/v1/customers/:id - Atualizar cliente
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, segment, total_spent, churn_risk } = req.body;

    const { data, error } = await supabase
      .from('customers')
      .update({
        name,
        email,
        phone,
        company,
        segment,
        total_spent,
        churn_risk
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar cliente',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { customer: data }
    });
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/v1/customers/:id - Deletar cliente
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar cliente',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { message: 'Cliente deletado com sucesso' }
    });
  } catch (error: any) {
    console.error('Erro ao deletar cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/v1/customers/:id/audio-settings - Atualizar configurações de áudio
router.patch('/:id/audio-settings', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validar payload
    const validated = AudioSettingsSchema.parse(req.body);

    // Verificar se cliente existe
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    // Atualizar apenas campos de áudio
    const updateData: any = {};
    if (validated.preferred_voice_type !== undefined) {
      updateData.preferred_voice_type = validated.preferred_voice_type;
    }
    if (validated.preferred_voice_id !== undefined) {
      updateData.preferred_voice_id = validated.preferred_voice_id;
    }
    if (validated.wants_audio_summary !== undefined) {
      updateData.wants_audio_summary = validated.wants_audio_summary;
    }
    if (validated.wants_summary_format !== undefined) {
      updateData.wants_summary_format = validated.wants_summary_format;
    }
    if (validated.incoming_audio_behavior !== undefined) {
      updateData.incoming_audio_behavior = validated.incoming_audio_behavior;
    }
    if (validated.outgoing_preference !== undefined) {
      updateData.outgoing_preference = validated.outgoing_preference;
    }
    if (validated.persona_voice_profile !== undefined) {
      updateData.persona_voice_profile = validated.persona_voice_profile;
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configurações de áudio',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { customer: data }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }

    console.error('Erro ao atualizar configurações de áudio:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
