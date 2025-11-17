import { createClient } from '@supabase/supabase-js';
import { analyzeSentiment, averageSentiment } from '../utils/sentiment';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export type LeadStatus = 'novo' | 'ativo' | 'quente' | 'em_negociacao' | 'convertido' | 'frio';

interface LeadMetrics {
  customerId: string;
  status: LeadStatus;
  totalMessages: number;
  avgSentiment: number;
  avgResponseTimeSec: number;
  conversationDurationMin: number;
  leadActivityScore: number;
  lastInteractionDays: number;
  conversionProbability: number;
}

/**
 * Calcula o status do lead baseado em tempo, frequência e tom das mensagens
 */
export async function calculateLeadStatus(customerId: string): Promise<LeadStatus> {
  try {
    // Buscar todas as interações do cliente
    const { data: interactions, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    if (error || !interactions || interactions.length === 0) {
      return 'novo';
    }

    const now = new Date();
    const lastInteraction = new Date(interactions[interactions.length - 1].created_at);
    const daysSinceLastInteraction = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);

    // Calcular sentimento médio
    const sentiments = interactions
      .filter(i => i.content)
      .map(i => i.sentiment || analyzeSentiment(i.content));
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;

    // Calcular frequência de mensagens
    const totalMessages = interactions.length;
    const firstInteraction = new Date(interactions[0].created_at);
    const conversationDays = (lastInteraction.getTime() - firstInteraction.getTime()) / (1000 * 60 * 60 * 24);
    const messagesPerDay = conversationDays > 0 ? totalMessages / conversationDays : totalMessages;

    // Detectar palavras-chave de conversão
    const conversionKeywords = ['comprar', 'fechar', 'contratar', 'assinar', 'pagamento', 'preço', 'valor'];
    const hasConversionIntent = interactions.some(i => 
      conversionKeywords.some(kw => i.content?.toLowerCase().includes(kw))
    );

    // Lógica de classificação
    if (hasConversionIntent && avgSentiment > 0.3 && daysSinceLastInteraction < 2) {
      return 'em_negociacao';
    }

    if (avgSentiment > 0.5 && messagesPerDay > 2 && daysSinceLastInteraction < 3) {
      return 'quente';
    }

    if (messagesPerDay > 1 && daysSinceLastInteraction < 7) {
      return 'ativo';
    }

    if (daysSinceLastInteraction > 30) {
      return 'frio';
    }

    if (totalMessages < 3) {
      return 'novo';
    }

    return 'ativo';

  } catch (error) {
    console.error('❌ Erro ao calcular status do lead:', error);
    return 'novo';
  }
}

/**
 * Detecta pontos de abandono na conversa
 */
export async function detectAbandonmentPoints(customerId: string): Promise<Array<{
  gapDays: number;
  lastMessage: string;
  timestamp: string;
  reason: string;
}>> {
  try {
    const { data: interactions, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    if (error || !interactions || interactions.length < 2) {
      return [];
    }

    const abandonmentPoints = [];
    const ABANDONMENT_THRESHOLD_DAYS = 7;

    for (let i = 1; i < interactions.length; i++) {
      const prevTime = new Date(interactions[i - 1].created_at);
      const currTime = new Date(interactions[i].created_at);
      const gapDays = (currTime.getTime() - prevTime.getTime()) / (1000 * 60 * 60 * 24);

      if (gapDays > ABANDONMENT_THRESHOLD_DAYS) {
        // Analisar o motivo do abandono
        const lastMessage = interactions[i - 1].content || '';
        const sentiment = interactions[i - 1].sentiment || analyzeSentiment(lastMessage);
        
        let reason = 'Gap de tempo prolongado';
        if (sentiment < -0.3) {
          reason = 'Sentimento negativo antes do abandono';
        } else if (lastMessage.toLowerCase().includes('depois') || lastMessage.toLowerCase().includes('mais tarde')) {
          reason = 'Cliente pediu para retomar depois';
        }

        abandonmentPoints.push({
          gapDays: Math.round(gapDays),
          lastMessage: lastMessage.substring(0, 100),
          timestamp: interactions[i - 1].created_at,
          reason
        });
      }
    }

    return abandonmentPoints;

  } catch (error) {
    console.error('❌ Erro ao detectar pontos de abandono:', error);
    return [];
  }
}

/**
 * Analisa a probabilidade de conversão do lead
 */
export async function analyzeConversionIntent(customerId: string): Promise<{
  probability: number;
  factors: string[];
  recommendation: string;
}> {
  try {
    const { data: interactions, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    if (error || !interactions || interactions.length === 0) {
      return {
        probability: 0,
        factors: ['Sem interações registradas'],
        recommendation: 'Iniciar contato com o lead'
      };
    }

    const factors: string[] = [];
    let probabilityScore = 0;

    // Fator 1: Palavras-chave de conversão
    const conversionKeywords = ['comprar', 'fechar', 'contratar', 'assinar', 'pagamento', 'preço', 'valor', 'teste', 'demo'];
    const hasConversionKeywords = interactions.some(i => 
      conversionKeywords.some(kw => i.content?.toLowerCase().includes(kw))
    );
    if (hasConversionKeywords) {
      probabilityScore += 30;
      factors.push('Demonstrou interesse em compra');
    }

    // Fator 2: Sentimento positivo
    const sentiments = interactions.map(i => i.sentiment || analyzeSentiment(i.content || ''));
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    if (avgSentiment > 0.3) {
      probabilityScore += 25;
      factors.push('Sentimento positivo nas conversas');
    }

    // Fator 3: Frequência de interações
    const totalMessages = interactions.length;
    if (totalMessages > 10) {
      probabilityScore += 20;
      factors.push('Alto engajamento (muitas mensagens)');
    } else if (totalMessages > 5) {
      probabilityScore += 10;
      factors.push('Engajamento moderado');
    }

    // Fator 4: Recência
    const lastInteraction = new Date(interactions[interactions.length - 1].created_at);
    const daysSinceLastInteraction = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastInteraction < 3) {
      probabilityScore += 15;
      factors.push('Interação recente');
    } else if (daysSinceLastInteraction < 7) {
      probabilityScore += 5;
    }

    // Fator 5: Perguntas sobre funcionalidades
    const questionKeywords = ['como', 'funciona', 'pode', 'consegue', 'suporta', 'tem'];
    const hasQuestions = interactions.some(i => 
      questionKeywords.some(kw => i.content?.toLowerCase().includes(kw))
    );
    if (hasQuestions) {
      probabilityScore += 10;
      factors.push('Fez perguntas sobre funcionalidades');
    }

    // Normalizar probabilidade para 0-100
    const probability = Math.min(100, probabilityScore);

    // Gerar recomendação
    let recommendation = '';
    if (probability > 70) {
      recommendation = 'Lead quente! Priorizar contato imediato e enviar proposta';
    } else if (probability > 40) {
      recommendation = 'Lead promissor. Agendar demonstração ou enviar mais informações';
    } else if (probability > 20) {
      recommendation = 'Nutrir o lead com conteúdo relevante';
    } else {
      recommendation = 'Lead frio. Considerar campanha de reengajamento';
    }

    return {
      probability,
      factors,
      recommendation
    };

  } catch (error) {
    console.error('❌ Erro ao analisar intenção de conversão:', error);
    return {
      probability: 0,
      factors: ['Erro ao analisar'],
      recommendation: 'Revisar dados do lead'
    };
  }
}

/**
 * Calcula métricas agregadas de engajamento
 */
export async function computeEngagementMetrics(customerId: string): Promise<LeadMetrics> {
  try {
    const { data: interactions, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    if (error || !interactions || interactions.length === 0) {
      return {
        customerId,
        status: 'novo',
        totalMessages: 0,
        avgSentiment: 0,
        avgResponseTimeSec: 0,
        conversationDurationMin: 0,
        leadActivityScore: 0,
        lastInteractionDays: 999,
        conversionProbability: 0
      };
    }

    // Total de mensagens
    const totalMessages = interactions.length;

    // Sentimento médio
    const sentiments = interactions.map(i => i.sentiment || analyzeSentiment(i.content || ''));
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;

    // Tempo médio de resposta (entre mensagens consecutivas)
    let totalResponseTime = 0;
    let responseCount = 0;
    for (let i = 1; i < interactions.length; i++) {
      const prevTime = new Date(interactions[i - 1].created_at).getTime();
      const currTime = new Date(interactions[i].created_at).getTime();
      const diffSec = (currTime - prevTime) / 1000;
      
      // Considerar apenas respostas razoáveis (< 24h)
      if (diffSec < 86400) {
        totalResponseTime += diffSec;
        responseCount++;
      }
    }
    const avgResponseTimeSec = responseCount > 0 ? totalResponseTime / responseCount : 0;

    // Duração da conversa
    const firstInteraction = new Date(interactions[0].created_at);
    const lastInteraction = new Date(interactions[interactions.length - 1].created_at);
    const conversationDurationMin = (lastInteraction.getTime() - firstInteraction.getTime()) / (1000 * 60);

    // Dias desde última interação
    const lastInteractionDays = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);

    // Score de atividade (0-100)
    let activityScore = 0;
    activityScore += Math.min(30, totalMessages * 2); // Até 30 pontos por mensagens
    activityScore += Math.min(30, (avgSentiment + 1) * 15); // Até 30 pontos por sentimento
    activityScore += Math.min(20, Math.max(0, 20 - lastInteractionDays)); // Até 20 pontos por recência
    activityScore += Math.min(20, conversationDurationMin / 60); // Até 20 pontos por duração

    // Status do lead
    const status = await calculateLeadStatus(customerId);

    // Probabilidade de conversão
    const conversionAnalysis = await analyzeConversionIntent(customerId);

    return {
      customerId,
      status,
      totalMessages,
      avgSentiment: Math.round(avgSentiment * 100) / 100,
      avgResponseTimeSec: Math.round(avgResponseTimeSec),
      conversationDurationMin: Math.round(conversationDurationMin),
      leadActivityScore: Math.round(activityScore),
      lastInteractionDays: Math.round(lastInteractionDays * 10) / 10,
      conversionProbability: conversionAnalysis.probability
    };

  } catch (error) {
    console.error('❌ Erro ao calcular métricas de engajamento:', error);
    throw error;
  }
}

/**
 * Gera análise completa de todos os leads
 */
export async function analyzeAllLeads(): Promise<LeadMetrics[]> {
  try {
    console.log('📊 Analisando todos os leads...');

    // Buscar todos os clientes
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id');

    if (error || !customers) {
      console.error('❌ Erro ao buscar clientes:', error);
      return [];
    }

    console.log(`👥 Encontrados ${customers.length} clientes`);

    // Calcular métricas para cada cliente
    const metrics: LeadMetrics[] = [];
    for (const customer of customers) {
      try {
        const metric = await computeEngagementMetrics(customer.id);
        metrics.push(metric);
      } catch (error) {
        console.error(`❌ Erro ao analisar cliente ${customer.id}:`, error);
      }
    }

    // Ordenar por probabilidade de conversão
    metrics.sort((a, b) => b.conversionProbability - a.conversionProbability);

    console.log(`✅ Análise concluída para ${metrics.length} leads`);

    return metrics;

  } catch (error) {
    console.error('❌ Erro ao analisar todos os leads:', error);
    return [];
  }
}
