import axios from 'axios';
import { env } from '../config/env';
import { supabase } from '../config/supabase';
import { asrTranscriptionService } from './asrTranscriptionService';
import * as fs from 'fs';
import * as path from 'path';

export interface WhatsAppAudioMessage {
  messageId: string;
  from: string;
  audioUrl: string;
  mimeType?: string;
  duration?: number;
  timestamp: number;
}

export interface ProcessedAudioResult {
  interactionId: string;
  transcript: string;
  confidence: number;
  audioPath: string;
  duration: number;
}

/**
 * Serviço para processar áudio recebido do WhatsApp
 * Baixa o áudio, transcreve e salva como interação
 */
export class WhatsAppAudioProcessor {
  /**
   * Processa mensagem de áudio do WhatsApp
   * @param audioMessage Dados da mensagem de áudio
   * @param customerId ID do cliente (opcional)
   * @returns Interação criada com transcript
   */
  async processAudioMessage(
    audioMessage: WhatsAppAudioMessage,
    customerId?: string
  ): Promise<ProcessedAudioResult> {
    try {
      // 1. Baixar áudio do WhatsApp
      const audioBuffer = await this.downloadAudioFromWhatsApp(audioMessage.audioUrl);
      
      // 2. Validar formato
      const isValidFormat = this.validateAudioFormat(audioMessage.mimeType);
      if (!isValidFormat) {
        throw new Error(`Formato de áudio não suportado: ${audioMessage.mimeType}. Formatos permitidos: ${env.audio.storage.allowedFormats.join(', ')}`);
      }

      // 3. Salvar áudio no storage
      const audioPath = await this.saveAudioToStorage(
        audioBuffer,
        `whatsapp_${audioMessage.messageId}_${Date.now()}.mp3`
      );

      // 4. Transcrever áudio
      const asrResult = await asrTranscriptionService.transcribe(
        audioPath,
        { language: 'pt' }, // Português por padrão
        customerId
      );

      // 5. Criar interação no banco
      const interactionId = await this.createInteraction({
        customerId,
        text: asrResult.transcript,
        transcript: asrResult.transcript,
        audioPath,
        audioDuration: asrResult.duration,
        transcriptConfidence: asrResult.confidence,
        isAudio: true,
        sourceChannel: 'whatsapp',
        channel: 'whatsapp'
      });

      return {
        interactionId,
        transcript: asrResult.transcript,
        confidence: asrResult.confidence,
        audioPath,
        duration: asrResult.duration
      };
    } catch (error: any) {
      throw new Error(`Erro ao processar áudio do WhatsApp: ${error.message}`);
    }
  }

  /**
   * Baixa áudio de uma URL do WhatsApp
   */
  private async downloadAudioFromWhatsApp(audioUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`Erro ao baixar áudio: ${error.message}`);
    }
  }

  /**
   * Valida formato de áudio
   */
  private validateAudioFormat(mimeType?: string): boolean {
    if (!mimeType) {
      return true; // Aceitar se não especificado
    }

    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/m4a',
      'audio/x-m4a'
    ];

    return allowedMimeTypes.includes(mimeType.toLowerCase());
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
      const filePath = `whatsapp/${Date.now()}_${filename}`;

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
   * Cria interação no banco de dados
   */
  private async createInteraction(data: {
    customerId?: string;
    text: string;
    transcript: string;
    audioPath: string;
    audioDuration: number;
    transcriptConfidence: number;
    isAudio: boolean;
    sourceChannel: string;
    channel: string;
  }): Promise<string> {
    const { data: interaction, error } = await supabase
      .from('interactions')
      .insert({
        customer_id: data.customerId,
        text: data.text,
        transcript: data.transcript,
        audio_path: data.audioPath,
        audio_duration: data.audioDuration,
        transcript_confidence: data.transcriptConfidence,
        is_audio: data.isAudio,
        source_channel: data.sourceChannel,
        channel: data.channel,
        message: data.text // Campo message para compatibilidade
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao criar interação: ${error.message}`);
    }

    return interaction.id;
  }

  /**
   * Verifica comportamento do cliente para áudio recebido
   */
  async getCustomerAudioBehavior(customerId: string): Promise<string> {
    const { data, error } = await supabase
      .from('customers')
      .select('incoming_audio_behavior')
      .eq('id', customerId)
      .single();

    if (error || !data) {
      return 'transcribe'; // Padrão: transcrever
    }

    return data.incoming_audio_behavior || 'transcribe';
  }
}

// Exportar instância singleton
export const whatsAppAudioProcessor = new WhatsAppAudioProcessor();
