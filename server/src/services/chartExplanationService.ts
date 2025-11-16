import { env } from '../config/env';
import { supabase } from '../config/supabase';
import { elevenLabsTTSService } from './elevenLabsTTSService';

export interface ChartExplanationRequest {
  chartId: string;
  userId: string;
  metricSnapshot: Record<string, any>;
  explanationText?: string;
  generateAudio?: boolean;
}

export interface ChartExplanationResult {
  explanationId: string;
  explanationText: string;
  audioPath?: string;
  audioDuration?: number;
}

/**
 * Serviço para gerar explicações de gráficos com suporte a áudio
 */
export class ChartExplanationService {
  /**
   * Cria explicação de gráfico (texto + opcionalmente áudio)
   * @param request Dados da explicação
   * @returns Explicação criada com ID e metadados
   */
  async createExplanation(
    request: ChartExplanationRequest
  ): Promise<ChartExplanationResult> {
    try {
      // 1. Gerar texto de explicação se não fornecido
      let explanationText = request.explanationText;
      if (!explanationText) {
        explanationText = await this.generateExplanationText(
          request.metricSnapshot
        );
      }

      // 2. Criar registro no banco
      const explanationId = await this.createExplanationRecord({
        userId: request.userId,
        chartId: request.chartId,
        metricSnapshot: request.metricSnapshot,
        explanationText
      });

      // 3. Gerar áudio se solicitado
      let audioPath: string | undefined;
      let audioDuration: number | undefined;

      if (request.generateAudio !== false) {
        try {
          const ttsResult = await elevenLabsTTSService.synthesize(
            explanationText,
            {},
            request.userId
          );

          audioPath = ttsResult.audioPath;
          audioDuration = ttsResult.duration;

          // Atualizar registro com caminho do áudio
          await this.updateExplanationAudio(
            explanationId,
            audioPath,
            audioDuration
          );
        } catch (error: any) {
          console.warn(`Erro ao gerar áudio da explicação: ${error.message}`);
          // Continuar sem áudio se falhar
        }
      }

      return {
        explanationId,
        explanationText,
        audioPath,
        audioDuration
      };
    } catch (error: any) {
      throw new Error(`Erro ao criar explicação: ${error.message}`);
    }
  }

  /**
   * Gera texto de explicação baseado nas métricas
   */
  private async generateExplanationText(
    metricSnapshot: Record<string, any>
  ): Promise<string> {
    // Análise básica das métricas
    const metrics = Object.keys(metricSnapshot);
    const values = Object.values(metricSnapshot) as number[];

    if (metrics.length === 0) {
      return 'Não há métricas disponíveis para este gráfico.';
    }

    // Calcular estatísticas básicas
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxMetric = metrics[values.indexOf(max)];
    const minMetric = metrics[values.indexOf(min)];

    // Gerar explicação
    let explanation = `Este gráfico apresenta ${metrics.length} métrica${metrics.length > 1 ? 's' : ''}. `;
    
    if (maxMetric && minMetric) {
      explanation += `A métrica "${maxMetric}" apresenta o maior valor (${max.toFixed(2)}), `;
      explanation += `enquanto "${minMetric}" apresenta o menor valor (${min.toFixed(2)}). `;
    }

    explanation += `A média geral é de ${avg.toFixed(2)}. `;

    // Adicionar insights baseados nos valores
    if (max / avg > 1.5) {
      explanation += `Observa-se um destaque significativo em "${maxMetric}". `;
    }

    if (values.every(v => v > 0)) {
      explanation += `Todas as métricas apresentam valores positivos.`;
    }

    return explanation;
  }

  /**
   * Cria registro de explicação no banco
   */
  private async createExplanationRecord(data: {
    userId: string;
    chartId: string;
    metricSnapshot: Record<string, any>;
    explanationText: string;
  }): Promise<string> {
    const { data: explanation, error } = await supabase
      .from('chart_explanations')
      .insert({
        user_id: data.userId,
        chart_id: data.chartId,
        metric_snapshot: data.metricSnapshot,
        auto_explanation_text: data.explanationText
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao criar explicação: ${error.message}`);
    }

    return explanation.id;
  }

  /**
   * Atualiza explicação com caminho do áudio
   */
  private async updateExplanationAudio(
    explanationId: string,
    audioPath: string,
    duration: number
  ): Promise<void> {
    const { error } = await supabase
      .from('chart_explanations')
      .update({
        auto_explanation_audio_path: audioPath
      })
      .eq('id', explanationId);

    if (error) {
      console.error(`Erro ao atualizar áudio da explicação: ${error.message}`);
    }
  }

  /**
   * Adiciona comentário de áudio do usuário
   */
  async addUserAudioComment(
    explanationId: string,
    audioPath: string,
    duration: number
  ): Promise<void> {
    const { error } = await supabase
      .from('chart_explanations')
      .update({
        user_comment_audio_path: audioPath,
        user_comment_duration: duration
      })
      .eq('id', explanationId);

    if (error) {
      throw new Error(`Erro ao adicionar comentário de áudio: ${error.message}`);
    }
  }

  /**
   * Busca explicação por ID
   */
  async getExplanation(explanationId: string): Promise<any> {
    const { data, error } = await supabase
      .from('chart_explanations')
      .select('*')
      .eq('id', explanationId)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar explicação: ${error.message}`);
    }

    return data;
  }

  /**
   * Lista explicações de um usuário
   */
  async listUserExplanations(userId: string, limit = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('chart_explanations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Erro ao listar explicações: ${error.message}`);
    }

    return data || [];
  }
}

// Exportar instância singleton
export const chartExplanationService = new ChartExplanationService();
