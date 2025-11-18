import { Router, Request, Response } from 'express';
import { analyzeAllLeads, computeEngagementMetrics, calculateLeadStatus, detectAbandonmentPoints, analyzeConversionIntent } from '../analytics/leadAnalysis';
import { createLogger } from '../services/logger';

const router = Router();
const logger = createLogger('LeadsRouter');

/**
 * GET /api/v1/leads/analysis
 * 
 * Retorna análise completa de todos os leads
 * 
 * Response:
 *   - 200: { success: true, data: LeadMetrics[], timestamp: string }
 *   - 500: { success: false, message: string }
 */
router.get('/analysis', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    logger.info('GET /analysis - Iniciando análise de leads', {
      operation: 'GET /analysis'
    });

    const metrics = await analyzeAllLeads();

    const duration = Date.now() - startTime;
    logger.info('Análise de leads concluída', {
      operation: 'GET /analysis',
      leadsCount: metrics.length,
      duration: `${duration}ms`
    });

    return res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Erro ao analisar leads', {
      operation: 'GET /analysis',
      duration: `${duration}ms`
    }, error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Falha ao analisar leads',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/leads/:customerId/metrics
 * 
 * Retorna métricas específicas de um lead
 * 
 * Params:
 *   - customerId: string - ID do cliente
 * 
 * Response:
 *   - 200: { success: true, data: LeadMetrics, timestamp: string }
 *   - 400: { success: false, message: string }
 *   - 404: { success: false, message: string }
 *   - 500: { success: false, message: string }
 */
router.get('/:customerId/metrics', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { customerId } = req.params;

    if (!customerId) {
      logger.warn('Tentativa de obter métricas sem customerId', {
        operation: 'GET /:customerId/metrics'
      });
      
      return res.status(400).json({
        success: false,
        message: 'customerId é obrigatório',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('GET /:customerId/metrics - Obtendo métricas do lead', {
      operation: 'GET /:customerId/metrics',
      customerId
    });

    const metrics = await computeEngagementMetrics(customerId);

    const duration = Date.now() - startTime;
    logger.info('Métricas do lead obtidas com sucesso', {
      operation: 'GET /:customerId/metrics',
      customerId,
      duration: `${duration}ms`
    });

    return res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Erro ao obter métricas do lead', {
      operation: 'GET /:customerId/metrics',
      duration: `${duration}ms`
    }, error);

    if (error.message?.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Falha ao obter métricas do lead',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/leads/:customerId/status
 * 
 * Retorna status do lead
 * 
 * Params:
 *   - customerId: string - ID do cliente
 * 
 * Response:
 *   - 200: { success: true, data: { status: LeadStatus }, timestamp: string }
 *   - 400: { success: false, message: string }
 *   - 500: { success: false, message: string }
 */
router.get('/:customerId/status', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { customerId } = req.params;

    if (!customerId) {
      logger.warn('Tentativa de obter status sem customerId', {
        operation: 'GET /:customerId/status'
      });
      
      return res.status(400).json({
        success: false,
        message: 'customerId é obrigatório',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('GET /:customerId/status - Obtendo status do lead', {
      operation: 'GET /:customerId/status',
      customerId
    });

    const status = await calculateLeadStatus(customerId);

    const duration = Date.now() - startTime;
    logger.info('Status do lead obtido com sucesso', {
      operation: 'GET /:customerId/status',
      customerId,
      status,
      duration: `${duration}ms`
    });

    return res.status(200).json({
      success: true,
      data: { status },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Erro ao obter status do lead', {
      operation: 'GET /:customerId/status',
      duration: `${duration}ms`
    }, error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Falha ao obter status do lead',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/leads/:customerId/abandonment
 * 
 * Retorna pontos de abandono do lead
 * 
 * Params:
 *   - customerId: string - ID do cliente
 * 
 * Response:
 *   - 200: { success: true, data: AbandonmentPoint[], timestamp: string }
 *   - 400: { success: false, message: string }
 *   - 500: { success: false, message: string }
 */
router.get('/:customerId/abandonment', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { customerId } = req.params;

    if (!customerId) {
      logger.warn('Tentativa de obter pontos de abandono sem customerId', {
        operation: 'GET /:customerId/abandonment'
      });
      
      return res.status(400).json({
        success: false,
        message: 'customerId é obrigatório',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('GET /:customerId/abandonment - Obtendo pontos de abandono do lead', {
      operation: 'GET /:customerId/abandonment',
      customerId
    });

    const abandonmentPoints = await detectAbandonmentPoints(customerId);

    const duration = Date.now() - startTime;
    logger.info('Pontos de abandono do lead obtidos com sucesso', {
      operation: 'GET /:customerId/abandonment',
      customerId,
      pointsCount: abandonmentPoints.length,
      duration: `${duration}ms`
    });

    return res.status(200).json({
      success: true,
      data: abandonmentPoints,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Erro ao obter pontos de abandono do lead', {
      operation: 'GET /:customerId/abandonment',
      duration: `${duration}ms`
    }, error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Falha ao obter pontos de abandono do lead',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/leads/:customerId/conversion
 * 
 * Retorna análise de intenção de conversão do lead
 * 
 * Params:
 *   - customerId: string - ID do cliente
 * 
 * Response:
 *   - 200: { success: true, data: ConversionAnalysis, timestamp: string }
 *   - 400: { success: false, message: string }
 *   - 500: { success: false, message: string }
 */
router.get('/:customerId/conversion', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { customerId } = req.params;

    if (!customerId) {
      logger.warn('Tentativa de obter análise de conversão sem customerId', {
        operation: 'GET /:customerId/conversion'
      });
      
      return res.status(400).json({
        success: false,
        message: 'customerId é obrigatório',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('GET /:customerId/conversion - Obtendo análise de conversão do lead', {
      operation: 'GET /:customerId/conversion',
      customerId
    });

    const conversionAnalysis = await analyzeConversionIntent(customerId);

    const duration = Date.now() - startTime;
    logger.info('Análise de conversão do lead obtida com sucesso', {
      operation: 'GET /:customerId/conversion',
      customerId,
      probability: conversionAnalysis.probability,
      duration: `${duration}ms`
    });

    return res.status(200).json({
      success: true,
      data: conversionAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Erro ao obter análise de conversão do lead', {
      operation: 'GET /:customerId/conversion',
      duration: `${duration}ms`
    }, error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Falha ao obter análise de conversão do lead',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;