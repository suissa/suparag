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
    const messageText = extractMessageText(payload.data?.message);
    const pushName = payload.data?.pushName || 'Desconhecido';

    console.log('📱 Telefone:', phoneNumber);
    console.log('👤 Nome:', pushName);
    console.log('💬 Mensagem:', messageText);

    // Validar se há texto na mensagem
    if (!messageText) {
      console.log('⏭️ Mensagem sem texto ignorada');
      return res.status(200).json({
        success: true,
        message: 'Mensagem sem texto'
      });
    }

    // TODO: Processar mensagem com IA + RAG
    // TODO: Buscar contexto relevante dos documentos
    // TODO: Gerar resposta com LLM
    // TODO: Enviar resposta via Evolution API

    console.log('✅ Mensagem processada com sucesso');

    return res.status(200).json({
      success: true,
      message: 'Mensagem recebida e processada',
      data: {
        phoneNumber,
        pushName,
        messageText,
        messageId: payload.data?.key?.id
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
