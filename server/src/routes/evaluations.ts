import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Interfaces
interface EvaluationRequest {
  interaction_id: string;
  question_text: string;
  answer_text: string;
  used_sources?: any;
  rating: 'aprovado' | 'incorreto';
  severity?: 'baixa' | 'media' | 'muito';
  notes?: string;
}

// GET /api/v1/evaluations - Listar todas as avaliações
router.get('/', async (req: Request, res: Response) => {
  try {
    const { interaction_id, rating, severity, limit = '50' } = req.query;

    let query = supabase
      .from('answer_evaluations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (interaction_id) {
      query = query.eq('interaction_id', interaction_id as string);
    }

    if (rating) {
      query = query.eq('rating', rating as string);
    }

    if (severity) {
      query = query.eq('severity', severity as string);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar avaliações',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { evaluations: data }
    });
  } catch (error: any) {
    console.error('Erro ao listar avaliações:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/v1/evaluations/:id - Obter avaliação por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('answer_evaluations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Avaliação não encontrada'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar avaliação',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { evaluation: data }
    });
  } catch (error: any) {
    console.error('Erro ao obter avaliação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/v1/evaluations - Criar nova avaliação
router.post('/', async (req: Request, res: Response) => {
  try {
    const { interaction_id, question_text, answer_text, used_sources, rating, severity, notes }: EvaluationRequest = req.body;

    if (!interaction_id || !question_text || !answer_text || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Campos "interaction_id", "question_text", "answer_text" e "rating" são obrigatórios'
      });
    }

    if (rating === 'incorreto' && !severity) {
      return res.status(400).json({
        success: false,
        message: 'Campo "severity" é obrigatório quando rating é "incorreto"'
      });
    }

    // Chamar função RPC para registrar avaliação
    const { data, error } = await supabase.rpc('rpc_record_evaluation', {
      p_interaction_id: interaction_id,
      p_question_text: question_text,
      p_answer_text: answer_text,
      p_used_sources: used_sources || null,
      p_rating: rating,
      p_severity: severity || null,
      p_notes: notes || null
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar avaliação',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        evaluation_id: data.evaluation_id,
        flag_created: data.flag_created,
        message: 'Avaliação registrada com sucesso'
      }
    });
  } catch (error: any) {
    console.error('Erro ao criar avaliação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/v1/evaluations/stats - Estatísticas das avaliações
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    // Buscar estatísticas gerais
    const { data: evaluations, error: evalError } = await supabase
      .from('answer_evaluations')
      .select('rating, severity, created_at');

    if (evalError) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas',
        error: evalError.message
      });
    }

    // Buscar contadores de qualidade
    const { data: counters, error: counterError } = await supabase
      .from('answer_quality_counters')
      .select('count_baixa, count_media, count_muito, last_evaluation_at');

    if (counterError) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar contadores',
        error: counterError.message
      });
    }

    // Calcular estatísticas
    const totalEvaluations = evaluations.length;
    const approvedCount = evaluations.filter(e => e.rating === 'aprovado').length;
    const incorrectCount = evaluations.filter(e => e.rating === 'incorreto').length;
    const approvalRate = totalEvaluations > 0 ? (approvedCount / totalEvaluations) * 100 : 0;

    const severityStats = {
      baixa: evaluations.filter(e => e.severity === 'baixa').length,
      media: evaluations.filter(e => e.severity === 'media').length,
      muito: evaluations.filter(e => e.severity === 'muito').length
    };

    const qualityCounters = counters.reduce((acc, counter) => ({
      total_baixa: acc.total_baixa + counter.count_baixa,
      total_media: acc.total_media + counter.count_media,
      total_muito: acc.total_muito + counter.count_muito
    }), { total_baixa: 0, total_media: 0, total_muito: 0 });

    return res.json({
      success: true,
      data: {
        overview: {
          total_evaluations: totalEvaluations,
          approved_count: approvedCount,
          incorrect_count: incorrectCount,
          approval_rate: Math.round(approvalRate * 100) / 100
        },
        severity_distribution: severityStats,
        quality_counters: qualityCounters,
        last_evaluation: evaluations.length > 0 ? evaluations[0].created_at : null
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
