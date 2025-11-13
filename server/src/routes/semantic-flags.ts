import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Interfaces
interface UpdateFlagRequest {
  status: 'pendente' | 'aprovado' | 'eliminado';
}

// GET /api/v1/semantic-flags - Listar flags semânticos
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status = 'pendente', limit = '50' } = req.query;

    // Usar função RPC para listar flags
    const { data, error } = await supabase.rpc('rpc_list_flags', {
      p_status: status as string
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar flags semânticos',
        error: error.message
      });
    }

    // Aplicar limite se necessário
    const limitedData = data.slice(0, parseInt(limit as string));

    return res.json({
      success: true,
      data: { flags: limitedData }
    });
  } catch (error: any) {
    console.error('Erro ao listar flags semânticos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/v1/semantic-flags/:id - Obter flag por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('semantic_flags')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Flag semântico não encontrado'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar flag semântico',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { flag: data }
    });
  } catch (error: any) {
    console.error('Erro ao obter flag semântico:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PATCH /api/v1/semantic-flags/:id/status - Atualizar status do flag
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status }: UpdateFlagRequest = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Campo "status" é obrigatório'
      });
    }

    if (!['pendente', 'aprovado', 'eliminado'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status deve ser: pendente, aprovado ou eliminado'
      });
    }

    // Usar função RPC para atualizar status
    const { data, error } = await supabase.rpc('rpc_update_flag_status', {
      p_flag_id: id,
      p_status: status
    });

    if (error) {
      if (error.message.includes('Status inválido')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status do flag',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Flag semântico não encontrado'
      });
    }

    return res.json({
      success: true,
      data: {
        flag: data[0],
        message: 'Status do flag atualizado com sucesso'
      }
    });
  } catch (error: any) {
    console.error('Erro ao atualizar status do flag:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/v1/semantic-flags/stats/overview - Estatísticas dos flags
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    // Buscar todos os flags
    const { data: flags, error } = await supabase
      .from('semantic_flags')
      .select('status, flag_reason, created_at, resolved_at');

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas dos flags',
        error: error.message
      });
    }

    // Calcular estatísticas
    const totalFlags = flags.length;
    const statusStats = {
      pendente: flags.filter(f => f.status === 'pendente').length,
      aprovado: flags.filter(f => f.status === 'aprovado').length,
      eliminado: flags.filter(f => f.status === 'eliminado').length
    };

    const resolvedFlags = flags.filter(f => f.resolved_at !== null).length;
    const resolutionRate = totalFlags > 0 ? (resolvedFlags / totalFlags) * 100 : 0;

    // Agrupar por razão
    const reasonStats = flags.reduce((acc, flag) => {
      acc[flag.flag_reason] = (acc[flag.flag_reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Flags mais recentes
    const recentFlags = flags
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return res.json({
      success: true,
      data: {
        overview: {
          total_flags: totalFlags,
          resolved_flags: resolvedFlags,
          resolution_rate: Math.round(resolutionRate * 100) / 100
        },
        status_distribution: statusStats,
        reason_distribution: reasonStats,
        recent_flags: recentFlags
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter estatísticas dos flags:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/v1/semantic-flags/:id - Deletar flag (apenas para admins)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Primeiro verificar se o flag existe
    const { data: existingFlag, error: checkError } = await supabase
      .from('semantic_flags')
      .select('id, status')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Flag semântico não encontrado'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar flag',
        error: checkError.message
      });
    }

    // Deletar o flag
    const { error: deleteError } = await supabase
      .from('semantic_flags')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar flag semântico',
        error: deleteError.message
      });
    }

    return res.json({
      success: true,
      data: { message: 'Flag semântico deletado com sucesso' }
    });
  } catch (error: any) {
    console.error('Erro ao deletar flag semântico:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
