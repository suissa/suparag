import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { chartExplanationService } from '../services/chartExplanationService';

const router = Router();

// Schemas de validação Zod
const ChartExplanationSchema = z.object({
  chartId: z.string().min(1),
  userId: z.string().uuid(),
  metricSnapshot: z.record(z.any()),
  explanationText: z.string().optional(),
  generateAudio: z.boolean().optional().default(true)
});

/**
 * POST /api/charts/:chartId/explain/audio
 * Cria explicação de gráfico com áudio
 */
router.post('/:chartId/explain/audio', async (req: Request, res: Response) => {
  try {
    const { chartId } = req.params;

    // Validar payload
    const validated = ChartExplanationSchema.parse({
      ...req.body,
      chartId
    });

    // Criar explicação
    const result = await chartExplanationService.createExplanation({
      chartId: validated.chartId,
      userId: validated.userId,
      metricSnapshot: validated.metricSnapshot,
      explanationText: validated.explanationText,
      generateAudio: validated.generateAudio
    });

    return res.json({
      success: true,
      data: {
        explanationId: result.explanationId,
        explanationText: result.explanationText,
        audioPath: result.audioPath,
        audioDuration: result.audioDuration
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }

    console.error('Erro ao criar explicação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar explicação',
      error: error.message
    });
  }
});

/**
 * GET /api/charts/:chartId/explanations
 * Lista explicações de um gráfico
 */
router.get('/:chartId/explanations', async (req: Request, res: Response) => {
  try {
    const { chartId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId é obrigatório'
      });
    }

    const explanations = await chartExplanationService.listUserExplanations(
      userId as string,
      10
    );

    // Filtrar por chartId
    const filtered = explanations.filter(
      (exp: any) => exp.chart_id === chartId
    );

    return res.json({
      success: true,
      data: filtered
    });
  } catch (error: any) {
    console.error('Erro ao listar explicações:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar explicações',
      error: error.message
    });
  }
});

/**
 * GET /api/charts/explanations/:explanationId
 * Busca explicação específica
 */
router.get('/explanations/:explanationId', async (req: Request, res: Response) => {
  try {
    const { explanationId } = req.params;

    const explanation = await chartExplanationService.getExplanation(explanationId);

    return res.json({
      success: true,
      data: explanation
    });
  } catch (error: any) {
    console.error('Erro ao buscar explicação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar explicação',
      error: error.message
    });
  }
});

export default router;
