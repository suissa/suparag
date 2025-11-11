import { Router, Request, Response } from 'express';

const router = Router();

// Interface para o payload do webhook
interface WebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName: string;
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageType: string;
    messageTimestamp: number;
  };
}

// Função para extrair o telefone do contato
function extractPhoneNumber(remoteJid: string): string {
  // Remove o sufixo @s.whatsapp.net
  const phone = remoteJid.replace('@s.whatsapp.net', '');
  return phone;
}

// Função para extrair o texto da mensagem
function extractMessageText(message: any): string {
  if (message.conversation) {
    return message.conversation;
  }
  if (message.extendedTextMessage?.text) {
    return message.extendedTextMessage.text;
  }
  return '';
}

// Processar mensagem de texto/conversa
async function processConversation(phoneNumber: string, data: any): Promise<string> {
  const messageText = extractMessageText(data.message);
  console.log('💬 Processando conversa:', messageText);
  
  // TODO: Implementar processamento com IA + RAG
  // TODO: Buscar contexto nos documentos
  // TODO: Gerar resposta com LLM
  
  return `Mensagem de texto recebida: "${messageText}"`;
}

// Processar mensagem de imagem
async function processImageMessage(phoneNumber: string, data: any): Promise<string> {
  const imageUrl = data.message?.imageMessage?.url;
  const caption = data.message?.imageMessage?.caption || '';
  
  console.log('🖼️ Processando imagem');
  console.log('📎 URL:', imageUrl);
  console.log('📝 Legenda:', caption);
  
  // TODO: Baixar imagem
  // TODO: Processar com OCR se necessário
  // TODO: Gerar resposta
  
  return `Imagem recebida${caption ? ` com legenda: "${caption}"` : ''}`;
}

// Processar mensagem de áudio
async function processAudioMessage(phoneNumber: string, data: any): Promise<string> {
  const audioUrl = data.message?.audioMessage?.url;
  const duration = data.message?.audioMessage?.seconds || 0;
  
  console.log('🎤 Processando áudio');
  console.log('📎 URL:', audioUrl);
  console.log('⏱️ Duração:', duration, 'segundos');
  
  // TODO: Baixar áudio
  // TODO: Transcrever com Whisper/Speech-to-Text
  // TODO: Processar texto transcrito com IA
  // TODO: Gerar resposta
  
  return `Áudio recebido (${duration}s)`;
}

// POST /api/v1/webhook - Receber mensagens do WhatsApp
router.post('/', async (req: Request, res: Response) => {
  try {
    const payload: WebhookPayload = req.body;

    // Log do evento recebido
    console.log('📨 Webhook recebido:', payload.event);

    // Processar apenas eventos de mensagens
    if (payload.event !== 'messages.upsert') {
      console.log('⏭️ Evento ignorado:', payload.event);
      return res.status(200).json({
        success: true,
        message: 'Evento ignorado'
      });
    }

    // Verificar se não é mensagem de grupo
    if (payload.data?.key?.remoteJid?.includes('@g.us')) {
      console.log('⏭️ Mensagem de grupo ignorada');
      return res.status(200).json({
        success: true,
        message: 'Mensagens de grupo não são processadas'
      });
    }

    // Verificar se não é mensagem enviada por nós
    if (payload.data?.key?.fromMe) {
      console.log('⏭️ Mensagem própria ignorada');
      return res.status(200).json({
        success: true,
        message: 'Mensagens próprias não são processadas'
      });
    }

    // Extrair informações da mensagem
    const remoteJid = payload.data?.key?.remoteJid;
    const phoneNumber = extractPhoneNumber(remoteJid);
    const pushName = payload.data?.pushName || 'Desconhecido';
    const messageType = payload.data?.messageType;

    console.log('📱 Telefone:', phoneNumber);
    console.log('👤 Nome:', pushName);
    console.log('📋 Tipo:', messageType);

    // Processar mensagem baseado no tipo
    let processResult: string;
    
    switch (messageType) {
      case 'conversation':
      case 'extendedTextMessage':
        processResult = await processConversation(phoneNumber, payload.data);
        break;
      
      case 'imageMessage':
        processResult = await processImageMessage(phoneNumber, payload.data);
        break;
      
      case 'audioMessage':
        processResult = await processAudioMessage(phoneNumber, payload.data);
        break;
      
      default:
        console.log('⏭️ Tipo de mensagem não suportado:', messageType);
        return res.status(200).json({
          success: true,
          message: `Tipo de mensagem não suportado: ${messageType}`
        });
    }

    console.log('✅ Mensagem processada com sucesso');

    return res.status(200).json({
      success: true,
      message: 'Mensagem recebida e processada',
      data: {
        phoneNumber,
        pushName,
        messageType,
        messageId: payload.data?.key?.id,
        processResult
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error);
    
    // Retornar 200 mesmo com erro para não reenviar o webhook
    return res.status(200).json({
      success: false,
      error: 'Erro ao processar mensagem',
      message: error.message
    });
  }
});

// GET /api/v1/webhook - Verificar status do webhook
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Webhook endpoint está ativo',
    info: {
      method: 'POST',
      event: 'messages.upsert',
      accepts: 'Mensagens individuais (não grupos)',
      ignores: ['Mensagens de grupo', 'Mensagens próprias', 'Mensagens sem texto']
    }
  });
});

export default router;
