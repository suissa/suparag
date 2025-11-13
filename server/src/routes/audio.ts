import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import { elevenLabsTTSService } from '../services/elevenLabsTTSService';
import { asrTranscriptionService } from '../services/asrTranscriptionService';
import { whatsAppAudioProcessor } from '../services/whatsAppAudioProcessor';

const router = Router();

// Configurar multer para upload de áudio
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/m4a'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de áudio não suportado'));
    }
  }
});

// Schemas de validação Zod
const TTSSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().optional(),
  model: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
  style: z.number().min(0).max(1).optional(),
  useSpeakerBoost: z.boolean().optional(),
  customerId: z.string().uuid().optional()
});

const ASRSchema = z.object({
  language: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  prompt: z.string().optional(),
  customerId: z.string().uuid().optional()
});

const WhatsAppAudioSchema = z.object({
  messageId: z.string(),
  from: z.string(),
  audioUrl: z.string().url(),
  mimeType: z.string().optional(),
  duration: z.number().optional(),
  timestamp: z.number(),
  customerId: z.string().uuid().optional()
});

/**
 * POST /api/audio/tts
 * Converte texto em áudio usando ElevenLabs
 */
router.post('/tts', async (req: Request, res: Response) => {
  try {
    // Validar payload
    const validated = TTSSchema.parse(req.body);

    // Chamar serviço TTS
    const result = await elevenLabsTTSService.synthesize(
      validated.text,
      {
        voiceId: validated.voiceId,
        model: validated.model,
        stability: validated.stability,
        similarityBoost: validated.similarityBoost,
        style: validated.style,
        useSpeakerBoost: validated.useSpeakerBoost
      },
      validated.customerId
    );

    return res.json({
      success: true,
      data: {
        audioPath: result.audioPath,
        duration: result.duration,
        jobId: result.jobId,
        metadata: result.metadata
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

    console.error('Erro no TTS:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar áudio',
      error: error.message
    });
  }
});

/**
 * POST /api/audio/asr
 * Transcreve áudio para texto
 * Aceita upload de arquivo ou URL
 */
router.post('/asr', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    // Validar opções
    const options = ASRSchema.parse({
      language: req.body.language,
      model: req.body.model,
      temperature: req.body.temperature ? parseFloat(req.body.temperature) : undefined,
      prompt: req.body.prompt,
      customerId: req.body.customerId
    });

    let audioPath: string;

    // Se arquivo foi enviado, salvar primeiro
    if (req.file) {
      const bucket = env.audio.storage.bucket;
      const filePath = `asr/${Date.now()}_${req.file.originalname}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        throw new Error(`Erro ao salvar áudio: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      audioPath = urlData.publicUrl;
    } else if (req.body.audioUrl) {
      // Usar URL fornecida
      audioPath = req.body.audioUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Arquivo de áudio ou URL é obrigatório'
      });
    }

    // Transcrever
    const result = await asrTranscriptionService.transcribe(
      audioPath,
      {
        language: options.language,
        model: options.model,
        temperature: options.temperature,
        prompt: options.prompt
      },
      options.customerId
    );

    return res.json({
      success: true,
      data: {
        transcript: result.transcript,
        confidence: result.confidence,
        language: result.language,
        duration: result.duration,
        jobId: result.jobId,
        metadata: result.metadata
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

    console.error('Erro no ASR:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao transcrever áudio',
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/audio
 * Processa áudio recebido do WhatsApp
 */
router.post('/whatsapp/audio', async (req: Request, res: Response) => {
  try {
    // Validar payload
    const validated = WhatsAppAudioSchema.parse(req.body);

    // Processar áudio
    const result = await whatsAppAudioProcessor.processAudioMessage(
      {
        messageId: validated.messageId,
        from: validated.from,
        audioUrl: validated.audioUrl,
        mimeType: validated.mimeType,
        duration: validated.duration,
        timestamp: validated.timestamp
      },
      validated.customerId
    );

    return res.json({
      success: true,
      data: {
        interactionId: result.interactionId,
        transcript: result.transcript,
        confidence: result.confidence,
        audioPath: result.audioPath,
        duration: result.duration
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

    console.error('Erro ao processar áudio do WhatsApp:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar áudio',
      error: error.message
    });
  }
});

export default router;
