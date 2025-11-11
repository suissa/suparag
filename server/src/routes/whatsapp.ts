import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { EvolutionService } from '../services/evolutionService';
import { SSEManager } from '../services/sseManager';
import { StatusChecker } from '../services/statusChecker';

// Criar Express Router
const router = Router();

// Inicializar instâncias de EvolutionService, SSEManager e StatusChecker
const evolutionService = new EvolutionService();
const sseManager = new SSEManager();
const statusChecker = new StatusChecker(evolutionService);

console.log('✅ WhatsApp Router inicializado com todos os serviços');

/**
 * POST /api/v1/whatsapp/connect
 * 
 * Inicia o processo de conexão WhatsApp criando uma instância na Evolution API
 * 
 * Body (opcional):
 *   - sessionId?: string - ID da sessão (gerado automaticamente se não fornecido)
 * 
 * Headers (opcional):
 *   - x-session-id: string - ID da sessão alternativo
 * 
 * Response:
 *   - 200: { sessionId: string, instanceName: string }
 *   - 500: { error: string, message: string, timestamp: string }
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    // Gerar sessionId único (ou receber do body/header)
    const sessionId = 
      req.body?.sessionId || 
      req.headers['x-session-id'] as string || 
      randomUUID();

    console.log('📱 POST /connect - Iniciando conexão WhatsApp');
    console.log(`   Session ID: ${sessionId}`);

    // Chamar evolutionService.createInstance(sessionId)
    const instanceName = await evolutionService.createInstance(sessionId);

    console.log(`✅ Instância criada com sucesso: ${instanceName}`);

    // Retornar resposta 200 imediatamente com { sessionId, instanceName }
    return res.status(200).json({
      sessionId,
      instanceName,
      message: 'Instância WhatsApp criada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar instância WhatsApp:', error);

    // Tratar erros e retornar 500 com mensagem
    return res.status(500).json({
      error: 'INSTANCE_CREATION_FAILED',
      message: error.message || 'Falha ao criar instância na Evolution API',
      details: error.toString(),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/whatsapp/connect/stream
 * 
 * Estabelece conexão SSE para streaming de QR codes e atualizações de status
 * 
 * Query params:
 *   - sessionId: string (obrigatório) - ID da sessão
 * 
 * Headers (alternativo):
 *   - x-session-id: string - ID da sessão
 * 
 * SSE Events:
 *   - qrcode: { qrcode: string (base64), timestamp: string }
 *   - status: { connected: boolean, status: string, instanceName: string, timestamp: string }
 *   - error: { code: string, message: string, timestamp: string }
 */
router.get('/connect/stream', async (req: Request, res: Response): Promise<void> => {
  try {
    // Extrair sessionId de query params ou header
    const sessionId = 
      (req.query.sessionId as string) || 
      req.headers['x-session-id'] as string;

    if (!sessionId) {
      res.status(400).json({
        error: 'MISSING_SESSION_ID',
        message: 'sessionId é obrigatório (query param ou header x-session-id)',
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log('📡 GET /connect/stream - Estabelecendo conexão SSE');
    console.log(`   Session ID: ${sessionId}`);

    // Adicionar conexão ao SSEManager
    sseManager.addConnection(sessionId, res);

    // Buscar instanceName do sessionId
    const instanceName = evolutionService.getInstanceName(sessionId);

    if (!instanceName) {
      // Enviar erro se instância não encontrada
      sseManager.sendEvent(sessionId, {
        type: 'error',
        data: {
          code: 'INSTANCE_NOT_FOUND',
          message: 'Instância não encontrada para este sessionId. Chame POST /connect primeiro.',
          timestamp: new Date().toISOString()
        }
      });
      
      sseManager.closeConnection(sessionId);
      return;
    }

    console.log(`   Instance Name: ${instanceName}`);

    // Iniciar loop para obter QR code da Evolution
    let qrCodeAttempts = 0;
    const maxQrCodeAttempts = 20; // Tentar por até ~20 segundos
    const qrCodeInterval = 1000; // Verificar a cada 1 segundo

    const qrCodeLoop = setInterval(async () => {
      try {
        qrCodeAttempts++;
        console.log(`🔍 Tentativa ${qrCodeAttempts}/${maxQrCodeAttempts} de obter QR code...`);

        // Tentar obter QR code
        const qrCode = await evolutionService.getQRCode(instanceName);

        if (qrCode) {
          console.log('✅ QR code obtido com sucesso!');

          // Enviar evento 'qrcode' via SSE quando QR estiver disponível
          sseManager.sendEvent(sessionId, {
            type: 'qrcode',
            data: {
              qrcode: qrCode,
              timestamp: new Date().toISOString()
            }
          });

          // Parar loop após obter QR code
          clearInterval(qrCodeLoop);

          // Iniciar StatusChecker para verificação periódica
          console.log('🔍 Iniciando verificação periódica de status...');
          
          statusChecker.startChecking(instanceName, sessionId, (status) => {
            console.log('🔄 Status mudou:', status);

            // Enviar evento 'status' quando status mudar
            sseManager.sendEvent(sessionId, {
              type: 'status',
              data: {
                connected: status.connected,
                status: status.status,
                instanceName: status.instanceName,
                timestamp: new Date().toISOString()
              }
            });

            // Fechar conexão SSE após enviar status final
            if (status.connected || status.status === 'timeout' || status.status === 'error') {
              console.log('🔌 Encerrando conexão SSE (status final recebido)');
              
              setTimeout(() => {
                sseManager.closeConnection(sessionId);
              }, 1000); // Aguardar 1s para garantir que evento foi enviado
            }
          });
        }

        // Se atingir máximo de tentativas sem QR code
        if (qrCodeAttempts >= maxQrCodeAttempts) {
          console.warn('⚠️  Máximo de tentativas atingido sem obter QR code');
          clearInterval(qrCodeLoop);

          sseManager.sendEvent(sessionId, {
            type: 'error',
            data: {
              code: 'QR_CODE_TIMEOUT',
              message: 'Timeout ao aguardar QR code da Evolution API',
              timestamp: new Date().toISOString()
            }
          });

          sseManager.closeConnection(sessionId);
        }

      } catch (qrError: any) {
        // QR code ainda não disponível, continuar tentando
        console.log(`   QR code ainda não disponível: ${qrError.message}`);
      }
    }, qrCodeInterval);

    // Limpar interval se cliente desconectar
    res.on('close', () => {
      console.log('🔌 Cliente desconectou, limpando recursos...');
      clearInterval(qrCodeLoop);
      statusChecker.stopChecking(instanceName);
    });

    // Não retornar nada aqui - a conexão SSE permanece aberta
    return;

  } catch (error: any) {
    console.error('❌ Erro no endpoint SSE:', error);

    // Tentar enviar erro via SSE se possível
    const sessionId = 
      (req.query.sessionId as string) || 
      req.headers['x-session-id'] as string;

    if (sessionId && sseManager.hasConnection(sessionId)) {
      sseManager.sendEvent(sessionId, {
        type: 'error',
        data: {
          code: 'SSE_ERROR',
          message: error.message || 'Erro interno no servidor SSE',
          timestamp: new Date().toISOString()
        }
      });
      
      sseManager.closeConnection(sessionId);
    } else {
      // Se não conseguir enviar via SSE, retornar erro HTTP
      res.status(500).json({
        error: 'SSE_ERROR',
        message: error.message || 'Erro ao estabelecer conexão SSE',
        timestamp: new Date().toISOString()
      });
    }
  }
});

/**
 * GET /api/v1/whatsapp/status
 * 
 * Verifica o status atual da conexão WhatsApp
 * 
 * Query params:
 *   - sessionId: string (obrigatório) - ID da sessão
 * 
 * Headers (alternativo):
 *   - x-session-id: string - ID da sessão
 * 
 * Response:
 *   - 200: { connected: boolean, status: string, instanceName: string, timestamp: string }
 *   - 400: { error: string, message: string }
 *   - 404: { error: string, message: string }
 *   - 500: { error: string, message: string }
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Extrair sessionId de query params
    const sessionId = 
      (req.query.sessionId as string) || 
      req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({
        error: 'MISSING_SESSION_ID',
        message: 'sessionId é obrigatório (query param ou header x-session-id)',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔍 GET /status - Verificando status da conexão');
    console.log(`   Session ID: ${sessionId}`);

    // Buscar instanceName do sessionId
    const instanceName = evolutionService.getInstanceName(sessionId);

    if (!instanceName) {
      console.warn('⚠️  Instância não encontrada para sessionId:', sessionId);
      
      return res.status(404).json({
        error: 'INSTANCE_NOT_FOUND',
        message: 'Instância não encontrada para este sessionId',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`   Instance Name: ${instanceName}`);

    // Chamar evolutionService.checkStatus()
    const status = await evolutionService.checkStatus(instanceName);

    console.log(`✅ Status verificado:`, status);

    // Retornar JSON com { connected: boolean, status: string }
    return res.status(200).json({
      connected: status.connected,
      status: status.status,
      instanceName: status.instanceName,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro ao verificar status:', error);

    return res.status(500).json({
      error: 'STATUS_CHECK_FAILED',
      message: error.message || 'Falha ao verificar status da conexão',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/v1/whatsapp/disconnect
 * 
 * Desconecta e deleta uma instância WhatsApp
 * 
 * Query params:
 *   - sessionId: string (obrigatório) - ID da sessão
 * 
 * Body (alternativo):
 *   - sessionId: string - ID da sessão
 * 
 * Headers (alternativo):
 *   - x-session-id: string - ID da sessão
 * 
 * Response:
 *   - 200: { success: true, message: string, timestamp: string }
 *   - 400: { error: string, message: string }
 *   - 404: { error: string, message: string }
 *   - 500: { error: string, message: string }
 */
router.delete('/disconnect', async (req: Request, res: Response) => {
  try {
    // Extrair sessionId de query params ou body
    const sessionId = 
      (req.query.sessionId as string) || 
      req.body?.sessionId || 
      req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({
        error: 'MISSING_SESSION_ID',
        message: 'sessionId é obrigatório (query param, body ou header x-session-id)',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔌 DELETE /disconnect - Desconectando instância WhatsApp');
    console.log(`   Session ID: ${sessionId}`);

    // Buscar instanceName do sessionId
    const instanceName = evolutionService.getInstanceName(sessionId);

    if (!instanceName) {
      console.warn('⚠️  Instância não encontrada para sessionId:', sessionId);
      
      return res.status(404).json({
        error: 'INSTANCE_NOT_FOUND',
        message: 'Instância não encontrada para este sessionId',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`   Instance Name: ${instanceName}`);

    // Parar StatusChecker
    if (statusChecker.isChecking(instanceName)) {
      console.log('🛑 Parando verificação de status...');
      statusChecker.stopChecking(instanceName);
    }

    // Fechar conexão SSE se existir
    if (sseManager.hasConnection(sessionId)) {
      console.log('🔌 Fechando conexão SSE...');
      sseManager.closeConnection(sessionId, {
        type: 'status',
        data: {
          connected: false,
          status: 'disconnected',
          instanceName,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Chamar evolutionService.deleteInstance()
    await evolutionService.deleteInstance(instanceName);

    console.log('✅ Instância desconectada e deletada com sucesso');

    // Retornar 200 com { success: true }
    return res.status(200).json({
      success: true,
      message: 'Instância WhatsApp desconectada e deletada com sucesso',
      instanceName,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro ao desconectar instância:', error);

    return res.status(500).json({
      error: 'DISCONNECT_FAILED',
      message: error.message || 'Falha ao desconectar instância',
      timestamp: new Date().toISOString()
    });
  }
});

// Exportar router
export default router;
