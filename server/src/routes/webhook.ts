import { Router, Request, Response } from 'express';
import { EvolutionService } from '../services/evolutionService';
import { embeddingService } from '../services/embeddingService';
import { supabase } from '../config/supabase';

const router = Router();
const evolutionService = new EvolutionService();

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

// Função para formatar texto para WhatsApp
function whatsappTextMessageFormatter(text: string): string {
  // Remover caracteres não suportados pelo WhatsApp
  let formatted = text
    // Remover emojis complexos que podem causar problemas
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Símbolos e pictogramas
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transporte e símbolos de mapa
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Bandeiras
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Símbolos diversos
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    // Normalizar quebras de linha
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remover múltiplas quebras de linha consecutivas (máximo 2)
    .replace(/\n{3,}/g, '\n\n')
    // Remover espaços no início e fim de cada linha
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remover espaços múltiplos
    .replace(/  +/g, ' ')
    // Limitar tamanho (WhatsApp tem limite de ~65536 caracteres)
    .substring(0, 4000); // Usar limite conservador de 4000 caracteres

  // Formatar markdown básico para WhatsApp
  formatted = formatted
    // Negrito: **texto** ou __texto__ -> *texto*
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/__(.+?)__/g, '*$1*')
    // Itálico: _texto_ -> _texto_ (já suportado)
    // Tachado: ~~texto~~ -> ~texto~
    .replace(/~~(.+?)~~/g, '~$1~')
    // Código: `texto` -> ```texto```
    .replace(/`([^`]+)`/g, '```$1```');

  return formatted.trim();
}

// Processar mensagem de texto/conversa com busca RAG
async function processConversation(phoneNumber: string, data: any): Promise<string> {
  const messageText = extractMessageText(data.message);
  console.log('💬 Processando conversa:', messageText);
  console.log('📱 Telefone:', phoneNumber);
  
  try {
    // 1. Gerar embedding da pergunta
    console.log('🔄 Gerando embedding da pergunta...');
    const queryEmbedding = await embeddingService.generateEmbedding(messageText);
    console.log(`✅ Embedding gerado: ${queryEmbedding.length} dimensões`);

    // 2. Buscar documentos similares no Supabase
    console.log('🔍 Buscando documentos similares...');
    const { data: matches, error: searchError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 3
      });

    if (searchError) {
      console.error('❌ Erro na busca semântica:', searchError);
      throw new Error(`Erro na busca: ${searchError.message}`);
    }

    console.log(`📚 Encontrados ${matches?.length || 0} documentos relevantes`);

    // 3. Montar contexto com os documentos encontrados
    let context = '';
    if (matches && matches.length > 0) {
      context = matches
        .map((match: any, idx: number) => 
          `[Documento ${idx + 1} - Relevância: ${(match.similarity * 100).toFixed(1)}%]\n${match.content}`
        )
        .join('\n\n---\n\n');
    }

    // 4. Gerar resposta usando LLM com contexto RAG
    console.log('🤖 Gerando resposta com LLM...');
    const prompt = context 
      ? `Você é um assistente útil. Use o contexto abaixo para responder a pergunta do usuário de forma clara e objetiva.

CONTEXTO:
${context}

PERGUNTA DO USUÁRIO:
${messageText}

RESPOSTA:`
      : `Você é um assistente útil. Responda a pergunta do usuário de forma clara e objetiva.

PERGUNTA:
${messageText}

RESPOSTA:`;

    const llmResponse = await embeddingService.generateCompletion(prompt);
    console.log('✅ Resposta gerada pelo LLM');

    // 5. Formatar resposta para WhatsApp
    const formattedResponse = whatsappTextMessageFormatter(llmResponse);
    console.log(`📝 Resposta formatada (${formattedResponse.length} caracteres)`);

    // 6. Enviar resposta via WhatsApp
    console.log('📤 Enviando resposta via WhatsApp...');
    await evolutionService.sendTextMessage(phoneNumber, formattedResponse);
    console.log('✅ Resposta enviada com sucesso!');

    return formattedResponse;
  } catch (error: any) {
    console.error('❌ Erro ao processar conversa:', error);
    
    // Tentar enviar mensagem de erro ao usuário
    try {
      const errorMessage = 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
      await evolutionService.sendTextMessage(phoneNumber, errorMessage);
    } catch (sendError) {
      console.error('❌ Erro ao enviar mensagem de erro:', sendError);
    }
    
    throw error;
  }
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
    // if (payload.data?.key?.fromMe) {
    //   console.log('⏭️ Mensagem própria ignorada');
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Mensagens próprias não são processadas'
    //   });
    // }

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
