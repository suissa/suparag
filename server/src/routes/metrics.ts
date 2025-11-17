import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { 
  analyzeAllLeads, 
  computeEngagementMetrics, 
  calculateLeadStatus,
  detectAbandonmentPoints,
  analyzeConversionIntent
} from '../analytics/leadAnalysis';

const router = Router();



/**
 * GET /api/v1/metrics
 * Retorna todas as métricas do sistema
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Buscar métricas gerais
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id');

    const { data: interactions, error: interactionsError } = await supabase
      .from('interactions')
      .select('id, channel, sentiment, created_at');

    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, status, created_at');

    if (customersError) {
      console.error('Erro ao buscar customers:', customersError);
      throw customersError;
    }
    if (interactionsError) {
      console.error('Erro ao buscar interactions:', interactionsError);
      throw interactionsError;
    }
    if (ticketsError) {
      console.error('Erro ao buscar tickets:', ticketsError);
      throw ticketsError;
    }

    // Calcular métricas
    const totalCustomers = customers?.length || 0;
    const totalInteractions = interactions?.length || 0;
    const totalTickets = tickets?.length || 0;

    // Tickets por status
    const ticketsByStatus = tickets?.reduce((acc: any, ticket: any) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Interações por canal
    const interactionsByChannel = interactions?.reduce((acc: any, interaction: any) => {
      acc[interaction.channel] = (acc[interaction.channel] || 0) + 1;
      return acc;
    }, {}) || {};

    // Sentimento médio
    const avgSentiment = interactions && interactions.length > 0
      ? interactions.reduce((sum: number, i: any) => sum + (i.sentiment || 0), 0) / interactions.length
      : 0;

    // Tickets abertos
    const openTickets = tickets?.filter((t: any) => t.status === 'open').length || 0;

    // Taxa de resolução
    const resolvedTickets = tickets?.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length || 0;
    const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

    res.json({
      success: true,
      data: {
        kpis: {
          totalCustomers,
          totalInteractions,
          totalTickets,
          openTickets,
          resolutionRate: Math.round(resolutionRate * 10) / 10,
          avgSentiment: Math.round(avgSentiment * 100) / 100
        },
        charts: {
          ticketsByStatus,
          interactionsByChannel
        }
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar métricas',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/metrics/kpis
 * Retorna apenas os KPIs principais
 */
router.get('/kpis', async (req: Request, res: Response) => {
  try {
    const { data: customers } = await supabase.from('customers').select('id');
    const { data: tickets } = await supabase.from('tickets').select('id, status');
    const { data: interactions } = await supabase.from('interactions').select('sentiment');

    const totalCustomers = customers?.length || 0;
    const openTickets = tickets?.filter((t: any) => t.status === 'open').length || 0;
    const resolvedTickets = tickets?.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length || 0;
    const resolutionRate = tickets && tickets.length > 0 
      ? (resolvedTickets / tickets.length) * 100 
      : 0;

    const avgSentiment = interactions && interactions.length > 0
      ? interactions.reduce((sum: number, i: any) => sum + (i.sentiment || 0), 0) / interactions.length
      : 0;

    res.json({
      success: true,
      data: {
        totalCustomers,
        openTickets,
        resolutionRate: Math.round(resolutionRate * 10) / 10,
        avgResponseTime: 0, // TODO: Calcular tempo médio de resposta
        avgSentiment: Math.round(avgSentiment * 100) / 100
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar KPIs',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/metrics/charts
 * Retorna dados para gráficos
 */
router.get('/charts', async (req: Request, res: Response) => {
  try {
    const { data: tickets } = await supabase.from('tickets').select('status');
    const { data: interactions } = await supabase.from('interactions').select('channel');

    const ticketsByStatus = tickets?.reduce((acc: any, ticket: any) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const interactionsByChannel = interactions?.reduce((acc: any, interaction: any) => {
      acc[interaction.channel] = (acc[interaction.channel] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      success: true,
      data: {
        ticketsByStatus,
        interactionsByChannel
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar dados de gráficos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados de gráficos',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/metrics/leads
 * Retorna análise completa de todos os leads
 */
router.get('/leads', async (req: Request, res: Response) => {
  try {
    console.log('📊 Analisando leads...');
    const metrics = await analyzeAllLeads();

    res.json({
      success: true,
      data: metrics
    });

  } catch (error: any) {
    console.error('Erro ao analisar leads:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao analisar leads',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/metrics/leads/:customerId
 * Retorna métricas detalhadas de um lead específico
 */
router.get('/leads/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    console.log(`📊 Analisando lead: ${customerId}`);

    // Buscar métricas de engajamento
    const metrics = await computeEngagementMetrics(customerId);

    // Buscar pontos de abandono
    const abandonmentPoints = await detectAbandonmentPoints(customerId);

    // Analisar intenção de conversão
    const conversionAnalysis = await analyzeConversionIntent(customerId);

    res.json({
      success: true,
      data: {
        metrics,
        abandonmentPoints,
        conversionAnalysis
      }
    });

  } catch (error: any) {
    console.error('Erro ao analisar lead:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao analisar lead',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/metrics/leads/:customerId/status
 * Retorna o status do lead
 */
router.get('/leads/:customerId/status', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const status = await calculateLeadStatus(customerId);

    res.json({
      success: true,
      data: { status }
    });

  } catch (error: any) {
    console.error('Erro ao calcular status do lead:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular status do lead',
      error: error.message
    });
  }
});

export default router;
