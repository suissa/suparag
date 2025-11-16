import axios from 'axios';
import FormData from 'form-data';
import { env } from '../config/env';
import { supabase } from '../config/supabase';
import * as fs from 'fs';
import * as path from 'path';

export interface ASROptions {
  language?: string;
  model?: string;
  temperature?: number;
  prompt?: string;
}

export interface ASRResult {
  transcript: string;
  confidence: number;
  language?: string;
  duration: number;
  jobId: string;
  metadata: {
    provider: string;
    model?: string;
  };
}

/**
 * Serviço para Automatic Speech Recognition (ASR)
 * Suporta múltiplos provedores: ElevenLabs, Whisper, AssemblyAI
 */
export class ASRTranscriptionService {
  private provider: string;
  private elevenLabsApiKey?: string;
  private whisperApiKey?: string;
  private assemblyAiApiKey?: string;

  constructor() {
    this.provider = env.audio.asr.provider;
    this.elevenLabsApiKey = env.audio.elevenLabs.apiKey;
    this.whisperApiKey = env.audio.asr.whisperApiKey;
    this.assemblyAiApiKey = env.audio.asr.assemblyAiApiKey;

    // Validar que temos as chaves necessárias
    if (this.provider === 'elevenlabs' && !this.elevenLabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY não configurada para ASR');
    }
    if (this.provider === 'whisper' && !this.whisperApiKey) {
      throw new Error('WHISPER_API_KEY não configurada');
    }
    if (this.provider === 'assemblyai' && !this.assemblyAiApiKey) {
      throw new Error('ASSEMBLYAI_API_KEY não configurada');
    }
  }

  /**
   * Transcreve áudio para texto
   * @param audioPath Caminho do arquivo de áudio (URL ou path local)
   * @param options Opções de transcrição
   * @param customerId ID do cliente (opcional)
   * @returns Transcript e metadados
   */
  async transcribe(
    audioPath: string,
    options: ASROptions = {},
    customerId?: string
  ): Promise<ASRResult> {
    // Criar job no banco
    const jobId = await this.createAudioJob({
      customerId,
      jobType: 'asr',
      engine: this.provider,
      inputAudioPath: audioPath,
      status: 'processing'
    });

    try {
      let result: ASRResult;

      switch (this.provider) {
        case 'elevenlabs':
          result = await this.transcribeWithElevenLabs(audioPath, options, jobId);
          break;
        case 'whisper':
          result = await this.transcribeWithWhisper(audioPath, options, jobId);
          break;
        case 'assemblyai':
          result = await this.transcribeWithAssemblyAI(audioPath, options, jobId);
          break;
        default:
          throw new Error(`Provedor ASR não suportado: ${this.provider}`);
      }

      // Atualizar job como completo
      await this.updateAudioJob(jobId, {
        status: 'completed',
        outputTranscript: result.transcript,
        duration: result.duration,
        metadata: {
          provider: this.provider,
          model: result.metadata.model,
          confidence: result.confidence,
          language: result.language
        }
      });

      return result;
    } catch (error: any) {
      // Atualizar job como falhado
      await this.updateAudioJob(jobId, {
        status: 'failed',
        errorMessage: error.message
      });

      throw error;
    }
  }

  /**
   * Transcreve usando ElevenLabs
   */
  private async transcribeWithElevenLabs(
    audioPath: string,
    options: ASROptions,
    jobId: string
  ): Promise<ASRResult> {
    try {
      // Baixar áudio se for URL
      const audioBuffer = await this.downloadAudio(audioPath);

      // Chamar API do ElevenLabs para transcrição
      const formData = new FormData();
      formData.append('audio', audioBuffer, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg'
      });

      if (options.language) {
        formData.append('language', options.language);
      }

      const response = await axios.post(
        `${env.audio.elevenLabs.apiUrl}/speech-to-text`,
        formData,
        {
          headers: {
            'xi-api-key': this.elevenLabsApiKey!,
            ...formData.getHeaders()
          },
          timeout: 120000 // 2 minutos
        }
      );

      // Estimar duração do áudio
      const duration = this.estimateDuration(audioBuffer.length);

      return {
        transcript: response.data.text || '',
        confidence: response.data.confidence || 0.9,
        language: response.data.language || options.language || 'pt',
        duration,
        jobId,
        metadata: {
          provider: 'elevenlabs',
          model: 'elevenlabs_stt'
        }
      };
    } catch (error: any) {
      throw new Error(`Erro na transcrição ElevenLabs: ${error.message}`);
    }
  }

  /**
   * Transcreve usando Whisper (OpenAI)
   */
  private async transcribeWithWhisper(
    audioPath: string,
    options: ASROptions,
    jobId: string
  ): Promise<ASRResult> {
    try {
      const audioBuffer = await this.downloadAudio(audioPath);

      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg'
      });
      formData.append('model', options.model || 'whisper-1');
      
      if (options.language) {
        formData.append('language', options.language);
      }
      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }
      if (options.temperature !== undefined) {
        formData.append('temperature', options.temperature.toString());
      }

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.whisperApiKey}`,
            ...formData.getHeaders()
          },
          timeout: 120000
        }
      );

      const duration = this.estimateDuration(audioBuffer.length);

      return {
        transcript: response.data.text || '',
        confidence: 0.95, // Whisper não retorna confidence, usar valor padrão alto
        language: response.data.language || options.language || 'pt',
        duration,
        jobId,
        metadata: {
          provider: 'whisper',
          model: options.model || 'whisper-1'
        }
      };
    } catch (error: any) {
      throw new Error(`Erro na transcrição Whisper: ${error.message}`);
    }
  }

  /**
   * Transcreve usando AssemblyAI
   */
  private async transcribeWithAssemblyAI(
    audioPath: string,
    options: ASROptions,
    jobId: string
  ): Promise<ASRResult> {
    try {
      // AssemblyAI requer upload primeiro, depois polling
      const uploadResponse = await axios.post(
        'https://api.assemblyai.com/v2/upload',
        await this.downloadAudio(audioPath),
        {
          headers: {
            'authorization': this.assemblyAiApiKey!
          }
        }
      );

      const uploadUrl = uploadResponse.data.upload_url;

      // Iniciar transcrição
      const transcriptResponse = await axios.post(
        'https://api.assemblyai.com/v2/transcript',
        {
          audio_url: uploadUrl,
          language_code: options.language || 'pt',
          ...(options.prompt && { word_boost: [options.prompt] })
        },
        {
          headers: {
            'authorization': this.assemblyAiApiKey!,
            'content-type': 'application/json'
          }
        }
      );

      const transcriptId = transcriptResponse.data.id;

      // Polling até completar
      let transcript = null;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutos máximo

      while (!transcript && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5 segundos

        const statusResponse = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: {
              'authorization': this.assemblyAiApiKey!
            }
          }
        );

        if (statusResponse.data.status === 'completed') {
          transcript = statusResponse.data;
          break;
        } else if (statusResponse.data.status === 'error') {
          throw new Error(`Erro na transcrição AssemblyAI: ${statusResponse.data.error}`);
        }

        attempts++;
      }

      if (!transcript) {
        throw new Error('Timeout na transcrição AssemblyAI');
      }

      return {
        transcript: transcript.text || '',
        confidence: transcript.confidence || 0.9,
        language: transcript.language_code || options.language || 'pt',
        duration: transcript.audio_duration / 1000 || 0, // Converter de ms para segundos
        jobId,
        metadata: {
          provider: 'assemblyai',
          model: 'assemblyai_v2'
        }
      };
    } catch (error: any) {
      throw new Error(`Erro na transcrição AssemblyAI: ${error.message}`);
    }
  }

  /**
   * Baixa áudio de uma URL ou retorna buffer se já for local
   */
  private async downloadAudio(audioPath: string): Promise<Buffer> {
    // Se for URL, baixar
    if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
      const response = await axios.get(audioPath, {
        responseType: 'arraybuffer',
        timeout: 60000
      });
      return Buffer.from(response.data);
    }

    // Se for path local, ler arquivo
    if (fs.existsSync(audioPath)) {
      return fs.readFileSync(audioPath);
    }

    throw new Error(`Arquivo de áudio não encontrado: ${audioPath}`);
  }

  /**
   * Estima duração do áudio
   */
  private estimateDuration(fileSizeBytes: number): number {
    // Assumindo taxa de bits média de 128kbps para MP3
    const bytesPerSecond = 16 * 1024;
    return Math.round((fileSizeBytes / bytesPerSecond) * 10) / 10;
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
}

// Exportar instância singleton
export const asrTranscriptionService = new ASRTranscriptionService();
