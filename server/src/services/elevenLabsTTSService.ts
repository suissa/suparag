import axios from 'axios';
import { env } from '../config/env';
import { supabase } from '../config/supabase';
import * as fs from 'fs';
import * as path from 'path';

export interface TTSOptions {
  voiceId?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface TTSResult {
  audioPath: string;
  duration: number;
  jobId: string;
  metadata: {
    voiceId: string;
    model: string;
    textLength: number;
  };
}

/**
 * Serviço para Text-to-Speech usando ElevenLabs
 * IMPORTANTE: Este serviço só deve ser usado em runtime real, nunca em seeds ou testes
 */
export class ElevenLabsTTSService {
  private apiKey: string;
  private apiUrl: string;
  private defaultVoiceId: string;
  private defaultModel: string;

  constructor() {
    if (!env.audio.elevenLabs.apiKey) {
      throw new Error('ELEVENLABS_API_KEY não configurada. Configure no arquivo .env');
    }

    this.apiKey = env.audio.elevenLabs.apiKey;
    this.apiUrl = env.audio.elevenLabs.apiUrl;
    this.defaultVoiceId = env.audio.elevenLabs.defaultVoiceId;
    this.defaultModel = env.audio.elevenLabs.defaultModel;
  }

  /**
   * Converte texto em áudio usando ElevenLabs
   * @param text Texto para converter em áudio
   * @param options Opções de TTS (voz, modelo, etc)
   * @param customerId ID do cliente (opcional, para usar preferências)
   * @returns Caminho do arquivo de áudio gerado e metadados
   */
  async synthesize(
    text: string,
    options: TTSOptions = {},
    customerId?: string
  ): Promise<TTSResult> {
    try {
      // Buscar preferências do cliente se fornecido
      let voiceId = options.voiceId || this.defaultVoiceId;
      let model = options.model || this.defaultModel;

      if (customerId) {
        const customerPrefs = await this.getCustomerPreferences(customerId);
        if (customerPrefs?.preferred_voice_id) {
          voiceId = customerPrefs.preferred_voice_id;
        }
      }

      // Criar job no banco
      const jobId = await this.createAudioJob({
        customerId,
        jobType: 'tts',
        engine: 'elevenlabs',
        inputText: text,
        status: 'processing'
      });

      try {
        // Chamar API do ElevenLabs
        const response = await axios.post(
          `${this.apiUrl}/text-to-speech/${voiceId}`,
          {
            text,
            model_id: model,
            voice_settings: {
              stability: options.stability ?? 0.5,
              similarity_boost: options.similarityBoost ?? 0.75,
              style: options.style ?? 0.0,
              use_speaker_boost: options.useSpeakerBoost ?? true
            }
          },
          {
            headers: {
              'xi-api-key': this.apiKey,
              'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer',
            timeout: 60000 // 60 segundos
          }
        );

        // Salvar áudio no Supabase Storage
        const audioBuffer = Buffer.from(response.data);
        const audioPath = await this.saveAudioToStorage(
          audioBuffer,
          `tts_${jobId}.mp3`
        );

        // Calcular duração aproximada (baseado no tamanho do arquivo e taxa de bits)
        const duration = this.estimateDuration(audioBuffer.length);

        // Atualizar job como completo
        await this.updateAudioJob(jobId, {
          status: 'completed',
          outputAudioPath: audioPath,
          duration,
          metadata: {
            voiceId,
            model,
            textLength: text.length,
            stability: options.stability,
            similarityBoost: options.similarityBoost
          }
        });

        return {
          audioPath,
          duration,
          jobId,
          metadata: {
            voiceId,
            model,
            textLength: text.length
          }
        };
      } catch (error: any) {
        // Atualizar job como falhado
        await this.updateAudioJob(jobId, {
          status: 'failed',
          errorMessage: error.response?.data?.detail?.message || error.message
        });

        throw new Error(`Erro ao sintetizar áudio: ${error.message}`);
      }
    } catch (error: any) {
      throw new Error(`Erro no serviço TTS: ${error.message}`);
    }
  }

  /**
   * Busca preferências de áudio do cliente
   */
  private async getCustomerPreferences(customerId: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('preferred_voice_id, preferred_voice_type, persona_voice_profile')
      .eq('id', customerId)
      .single();

    if (error) {
      console.warn(`Erro ao buscar preferências do cliente ${customerId}:`, error);
      return null;
    }

    return data;
  }

  /**
   * Cria um job de áudio no banco
   */
  private async createAudioJob(data: {
    customerId?: string;
    jobType: 'tts' | 'asr' | 'transcribe' | 'synthesize';
    engine: string;
    inputText?: string;
    inputAudioPath?: string;
    status: string;
  }) {
    const { data: job, error } = await supabase
      .from('audio_jobs')
      .insert({
        customer_id: data.customerId,
        job_type: data.jobType,
        engine: data.engine,
        input_text: data.inputText,
        input_audio_path: data.inputAudioPath,
        status: data.status
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao criar job de áudio: ${error.message}`);
    }

    return job.id;
  }

  /**
   * Atualiza um job de áudio
   */
  private async updateAudioJob(
    jobId: string,
    updates: {
      status?: string;
      outputAudioPath?: string;
      outputTranscript?: string;
      duration?: number;
      errorMessage?: string;
      metadata?: any;
    }
  ) {
    const { error } = await supabase
      .from('audio_jobs')
      .update({
        status: updates.status,
        output_audio_path: updates.outputAudioPath,
        output_transcript: updates.outputTranscript,
        duration: updates.duration,
        error_message: updates.errorMessage,
        metadata: updates.metadata || {}
      })
      .eq('id', jobId);

    if (error) {
      console.error(`Erro ao atualizar job ${jobId}:`, error);
    }
  }

  /**
   * Salva áudio no Supabase Storage
   */
  private async saveAudioToStorage(
    audioBuffer: Buffer,
    filename: string
  ): Promise<string> {
    try {
      const bucket = env.audio.storage.bucket;
      const filePath = `tts/${Date.now()}_${filename}`;

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: false
        });

      if (error) {
        throw new Error(`Erro ao salvar áudio no storage: ${error.message}`);
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      throw new Error(`Erro ao salvar áudio: ${error.message}`);
    }
  }

  /**
   * Estima duração do áudio baseado no tamanho do arquivo
   * Assumindo taxa de bits média de 128kbps para MP3
   */
  private estimateDuration(fileSizeBytes: number): number {
    // MP3 a 128kbps = ~16KB por segundo
    const bytesPerSecond = 16 * 1024;
    return Math.round((fileSizeBytes / bytesPerSecond) * 10) / 10; // Arredondar para 1 decimal
  }

  /**
   * Lista vozes disponíveis no ElevenLabs
   */
  async listVoices(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data.voices || [];
    } catch (error: any) {
      throw new Error(`Erro ao listar vozes: ${error.message}`);
    }
  }

  /**
   * Obtém detalhes de uma voz específica
   */
  async getVoice(voiceId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/voices/${voiceId}`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao obter voz: ${error.message}`);
    }
  }
}

// Exportar instância singleton
export const elevenLabsTTSService = new ElevenLabsTTSService();
