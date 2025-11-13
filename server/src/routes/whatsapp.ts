import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { EvolutionService } from '../services/evolutionService';
import { SSEManager } from '../services/sseManager';
import { StatusChecker } from '../services/statusChecker';
import { createLogger } from '../services/logger';

// Criar Express Router
const router = Router();

// Criar logger para o router
const logger = createLogger('WhatsAppRouter');

// Inicializar instâncias de EvolutionService, SSEManager e StatusChecker
const evolutionService = new EvolutionService();
const sseManager = new SSEManager();
const statusChecker = new StatusChecker(evolutionService);

logger.info('WhatsApp Router inicializado com todos os serviços', {
  operation: 'initialization'
});

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
  const startTime = Date.now();
  
  try {
    // Gerar sessionId único (ou receber do body/header)
    const sessionId = 
      req.body?.sessionId || 
      req.headers['x-session-id'] as string || 
      randomUUID();

    logger.info('POST /connect - Iniciando conexão WhatsApp', {
      operation: 'POST /connect',
      sessionId,
      ip: req.ip
    });

    // Chamar evolutionService.createInstance(sessionId)
    const instanceName = await evolutionService.createInstance(sessionId);

    const duration = Date.now() - startTime;
    logger.info('Instância criada com sucesso', {
      operation: 'POST /connect',
      sessionId,
      instanceName,
      duration: `${duration}ms`
    });

    // Retornar resposta 200 imediatamente com { sessionId, instanceName }
    return res.status(200).json({
      sessionId,
      instanceName,
      message: 'Instância WhatsApp criada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Erro ao criar instância WhatsApp', {
      operation: 'POST /connect',
      duration: `${duration}ms`,
      ip: req.ip
    }, error);

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
  const startTime = Date.now();
  
  try {
    // Extrair sessionId de query params ou header
    const sessionId = 
      (req.query.sessionId as string) || 
      req.headers['x-session-id'] as string;

    if (!sessionId) {
      logger.warn('Tentativa de conexão SSE sem sessionId', {
        operation: 'GET /connect/stream',
        ip: req.ip
      });
      
      res.status(400).json({
        error: 'MISSING_SESSION_ID',
        message: 'sessionId é obrigatório (query param ou header x-session-id)',
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.info('GET /connect/stream - Estabelecendo conexão SSE', {
      operation: 'GET /connect/stream',
      sessionId,
      ip: req.ip
    });

    // Adicionar conexão ao SSEManager
    sseManager.addConnection(sessionId, res);

    // Buscar instanceName do sessionId
    const instanceName = evolutionService.getInstanceName(sessionId);

    if (!instanceName) {
      logger.warn('Instância não encontrada para sessionId', {
        operation: 'GET /connect/stream',
        sessionId
      });
      
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

    logger.info('Instância encontrada, iniciando stream SSE', {
      operation: 'GET /connect/stream',
      sessionId,
      instanceName
    });

    // Iniciar loop para obter QR code da Evolution
    let qrCodeAttempts = 0;
    const maxQrCodeAttempts = 20; // Tentar por até ~20 segundos
    const qrCodeInterval = 1000; // Verificar a cada 1 segundo

    // const qrCodeLoop = setInterval(async () => {
      try {
        qrCodeAttempts++;
        logger.debug('Tentativa de obter QR code', {
          operation: 'GET /connect/stream.qrCodeLoop',
          sessionId,
          instanceName,
          attempt: qrCodeAttempts,
          maxAttempts: maxQrCodeAttempts
        });

        // Tentar obter QR code
        const qrCode = await evolutionService.getQRCode(instanceName);
        console.log('\n\n\nQR Code:', qrCode);
        if (qrCode) {
          logger.info('QR code obtido com sucesso', {
            operation: 'GET /connect/stream.qrCodeLoop',
            sessionId,
            instanceName,
            attempts: qrCodeAttempts
          });

          // Enviar evento 'qrcode' via SSE quando QR estiver disponível
          sseManager.sendEvent(sessionId, {
            type: 'qrcode',
            data: {
              qrcode: qrCode,
              timestamp: new Date().toISOString()
            }
          });

          // Parar loop após obter QR code
          // clearInterval(qrCodeLoop);

          // Iniciar StatusChecker para verificação periódica
          logger.info('Iniciando verificação periódica de status', {
            operation: 'GET /connect/stream',
            sessionId,
            instanceName
          });
          
          statusChecker.startChecking(instanceName, sessionId, (status) => {
            logger.info('Status mudou (callback)', {
              operation: 'GET /connect/stream.statusCallback',
              sessionId,
              instanceName,
              status: status.status,
              connected: status.connected
            });

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
              logger.info('Encerrando conexão SSE (status final recebido)', {
                operation: 'GET /connect/stream.statusCallback',
                sessionId,
                instanceName,
                finalStatus: status.status
              });
              
              setTimeout(() => {
                sseManager.closeConnection(sessionId);
              }, 1000); // Aguardar 1s para garantir que evento foi enviado
            }
          });
        }

        // Se atingir máximo de tentativas sem QR code
        if (qrCodeAttempts >= maxQrCodeAttempts) {
          logger.warn('Máximo de tentativas atingido sem obter QR code', {
            operation: 'GET /connect/stream.qrCodeLoop',
            sessionId,
            instanceName,
            attempts: qrCodeAttempts
          });
          
          // clearInterval(qrCodeLoop);

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
        logger.debug('QR code ainda não disponível', {
          operation: 'GET /connect/stream.qrCodeLoop',
          sessionId,
          instanceName,
          attempt: qrCodeAttempts,
          error: qrError.message
        });
      }
    // }, qrCodeInterval);

    // Limpar interval se cliente desconectar
    res.on('close', () => {
      const duration = Date.now() - startTime;
      logger.info('Cliente desconectou, limpando recursos', {
        operation: 'GET /connect/stream.onClose',
        sessionId,
        instanceName,
        duration: `${duration}ms`
      });
      
      // clearInterval(qrCodeLoop);
      statusChecker.stopChecking(instanceName);
    });

    // Não retornar nada aqui - a conexão SSE permanece aberta
    return;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Erro no endpoint SSE', {
      operation: 'GET /connect/stream',
      duration: `${duration}ms`,
      ip: req.ip
    }, error);

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
  const startTime = Date.now();
  
  try {
    // Extrair sessionId de query params
    const sessionId = 
      (req.query.sessionId as string) || 
      req.headers['x-session-id'] as string;

    if (!sessionId) {
      logger.warn('Tentativa de verificar status sem sessionId', {
        operation: 'GET /status',
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'MISSING_SESSION_ID',
        message: 'sessionId é obrigatório (query param ou header x-session-id)',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('GET /status - Verificando status da conexão', {
      operation: 'GET /status',
      sessionId,
      ip: req.ip
    });

    // Buscar instanceName do sessionId
    const instanceName = evolutionService.getInstanceName(sessionId);

    if (!instanceName) {
      logger.warn('Instância não encontrada para sessionId', {
        operation: 'GET /status',
        sessionId
      });
      
      return res.status(404).json({
        error: 'INSTANCE_NOT_FOUND',
        message: 'Instância não encontrada para este sessionId',
        timestamp: new Date().toISOString()
      });
    }

    // Chamar evolutionService.checkStatus()
    const status = await evolutionService.checkStatus(instanceName);

    const duration = Date.now() - startTime;
    logger.info('Status verificado com sucesso', {
      operation: 'GET /status',
      sessionId,
      instanceName,
      status: status.status,
      connected: status.connected,
      duration: `${duration}ms`
    });

    // Retornar JSON com { connected: boolean, status: string }
    return res.status(200).json({
      connected: status.connected,
      status: status.status,
      instanceName: status.instanceName,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Erro ao verificar status', {
      operation: 'GET /status',
      duration: `${duration}ms`,
      ip: req.ip
    }, error);

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
  const startTime = Date.now();
  
  try {
    // Extrair sessionId de query params ou body
    const sessionId = 
      (req.query.sessionId as string) || 
      req.body?.sessionId || 
      req.headers['x-session-id'] as string;

    if (!sessionId) {
      logger.warn('Tentativa de desconectar sem sessionId', {
        operation: 'DELETE /disconnect',
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'MISSING_SESSION_ID',
        message: 'sessionId é obrigatório (query param, body ou header x-session-id)',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('DELETE /disconnect - Desconectando instância WhatsApp', {
      operation: 'DELETE /disconnect',
      sessionId,
      ip: req.ip
    });

    // Buscar instanceName do sessionId
    const instanceName = evolutionService.getInstanceName(sessionId);

    if (!instanceName) {
      logger.warn('Instância não encontrada para sessionId', {
        operation: 'DELETE /disconnect',
        sessionId
      });
      
      return res.status(404).json({
        error: 'INSTANCE_NOT_FOUND',
        message: 'Instância não encontrada para este sessionId',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Iniciando processo de desconexão', {
      operation: 'DELETE /disconnect',
      sessionId,
      instanceName
    });

    // Parar StatusChecker
    if (statusChecker.isChecking(instanceName)) {
      logger.debug('Parando verificação de status', {
        operation: 'DELETE /disconnect',
        sessionId,
        instanceName
      });
      statusChecker.stopChecking(instanceName);
    }

    // Fechar conexão SSE se existir
    if (sseManager.hasConnection(sessionId)) {
      logger.debug('Fechando conexão SSE', {
        operation: 'DELETE /disconnect',
        sessionId,
        instanceName
      });
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

    const duration = Date.now() - startTime;
    logger.info('Instância desconectada e deletada com sucesso', {
      operation: 'DELETE /disconnect',
      sessionId,
      instanceName,
      duration: `${duration}ms`
    });

    // Retornar 200 com { success: true }
    return res.status(200).json({
      success: true,
      message: 'Instância WhatsApp desconectada e deletada com sucesso',
      instanceName,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Erro ao desconectar instância', {
      operation: 'DELETE /disconnect',
      duration: `${duration}ms`,
      ip: req.ip
    }, error);

    return res.status(500).json({
      error: 'DISCONNECT_FAILED',
      message: error.message || 'Falha ao desconectar instância',
      timestamp: new Date().toISOString()
    });
  }
});

// Exportar router
export default router;
