import { Response } from 'express';
import { createLogger } from './logger';

/**
 * Interface para eventos SSE enviados ao cliente
 */
export interface SSEEvent {
  type: 'qrcode' | 'status' | 'error';
  data: any;
}

/**
 * Serviço para gerenciar conexões Server-Sent Events (SSE)
 * 
 * Responsabilidades:
 * - Gerenciar conexões SSE ativas por sessionId
 * - Enviar eventos formatados para clientes específicos
 * - Encerrar conexões gracefully
 * - Tratar erros de conexões fechadas
 */
export class SSEManager {
  private connections: Map<string, Response>;
  private logger = createLogger('SSEManager');

  constructor() {
    // Criar Map para armazenar conexões ativas (sessionId → Response)
    this.connections = new Map<string, Response>();
    this.logger.info('SSEManager inicializado', {
      operation: 'constructor'
    });
  }

  /**
   * Adiciona uma nova conexão SSE ao gerenciador
   * 
   * @param sessionId - ID único da sessão do cliente
   * @param res - Objeto Response do Express para streaming
   */
  addConnection(sessionId: string, res: Response): void {
    this.logger.info('Adicionando conexão SSE', {
      operation: 'addConnection',
      sessionId
    });

    // Configurar headers SSE corretos
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Desabilitar buffering do nginx

    // Enviar comentário inicial para estabelecer conexão
    res.write(': SSE connection established\n\n');

    // Armazenar conexão no Map
    this.connections.set(sessionId, res);

    // Configurar handler para quando cliente desconectar
    res.on('close', () => {
      this.logger.info('Cliente desconectou SSE', {
        operation: 'addConnection.onClose',
        sessionId,
        remainingConnections: this.connections.size - 1
      });
      this.connections.delete(sessionId);
    });

    this.logger.info('Conexão SSE estabelecida com sucesso', {
      operation: 'addConnection',
      sessionId,
      totalConnections: this.connections.size
    });
  }

  /**
   * Envia um evento SSE para um cliente específico
   * 
   * @param sessionId - ID da sessão do cliente
   * @param event - Evento a ser enviado
   * @returns true se enviado com sucesso, false se conexão não existe ou falhou
   */
  sendEvent(sessionId: string, event: SSEEvent): boolean {
    const res = this.connections.get(sessionId);

    if (!res) {
      this.logger.warn('Tentativa de enviar evento para sessionId inexistente', {
        operation: 'sendEvent',
        sessionId,
        eventType: event.type
      });
      return false;
    }

    try {
      // Formatar evento no padrão SSE (event: tipo\ndata: json\n\n)
      const eventType = event.type;
      const eventData = JSON.stringify(event.data);
      const formattedEvent = `event: ${eventType}\ndata: ${eventData}\n\n`;

      this.logger.debug('Enviando evento SSE', {
        operation: 'sendEvent',
        sessionId,
        eventType,
        dataSize: eventData.length
      });

      // Enviar evento para Response específico via res.write()
      res.write(formattedEvent);

      return true;
    } catch (error) {
      // Tratar erros de envio (conexão fechada)
      this.logger.error('Erro ao enviar evento SSE', {
        operation: 'sendEvent',
        sessionId,
        eventType: event.type
      }, error as Error);
      
      // Remover conexão com erro do Map
      this.connections.delete(sessionId);
      
      return false;
    }
  }

  /**
   * Envia evento para múltiplos clientes (broadcast)
   * 
   * @param event - Evento a ser enviado
   * @param sessionIds - Array de sessionIds (opcional, envia para todos se não especificado)
   * @returns Número de clientes que receberam o evento com sucesso
   */
  broadcast(event: SSEEvent, sessionIds?: string[]): number {
    const targets = sessionIds || Array.from(this.connections.keys());
    let successCount = 0;

    for (const sessionId of targets) {
      if (this.sendEvent(sessionId, event)) {
        successCount++;
      }
    }

    this.logger.info('Broadcast enviado', {
      operation: 'broadcast',
      eventType: event.type,
      successCount,
      totalTargets: targets.length
    });
    
    return successCount;
  }

  /**
   * Encerra uma conexão SSE específica
   * 
   * @param sessionId - ID da sessão a encerrar
   * @param finalEvent - Evento final opcional a enviar antes de fechar
   */
  closeConnection(sessionId: string, finalEvent?: SSEEvent): void {
    const res = this.connections.get(sessionId);

    if (!res) {
      this.logger.warn('Tentativa de fechar conexão inexistente', {
        operation: 'closeConnection',
        sessionId
      });
      return;
    }

    try {
      this.logger.info('Encerrando conexão SSE', {
        operation: 'closeConnection',
        sessionId,
        hasFinalEvent: !!finalEvent
      });

      // Enviar evento final antes de fechar (se fornecido)
      if (finalEvent) {
        this.sendEvent(sessionId, finalEvent);
      }

      // Chamar res.end() para encerrar stream
      res.end();

      this.logger.info('Conexão SSE encerrada com sucesso', {
        operation: 'closeConnection',
        sessionId,
        remainingConnections: this.connections.size - 1
      });
    } catch (error) {
      this.logger.error('Erro ao encerrar conexão SSE', {
        operation: 'closeConnection',
        sessionId
      }, error as Error);
    } finally {
      // Remover conexão do Map
      this.connections.delete(sessionId);
    }
  }

  /**
   * Verifica se existe uma conexão ativa para um sessionId
   * 
   * @param sessionId - ID da sessão a verificar
   * @returns true se existe conexão ativa
   */
  hasConnection(sessionId: string): boolean {
    return this.connections.has(sessionId);
  }

  /**
   * Obtém o número de conexões ativas
   * 
   * @returns Número de conexões SSE ativas
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Lista todos os sessionIds com conexões ativas
   * 
   * @returns Array de sessionIds
   */
  getActiveSessions(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Encerra todas as conexões ativas (útil para shutdown graceful)
   * 
   * @param finalEvent - Evento final opcional a enviar para todos antes de fechar
   */
  closeAllConnections(finalEvent?: SSEEvent): void {
    const totalConnections = this.connections.size;
    
    this.logger.info('Encerrando todas as conexões SSE', {
      operation: 'closeAllConnections',
      totalConnections
    });

    const sessionIds = Array.from(this.connections.keys());
    
    for (const sessionId of sessionIds) {
      this.closeConnection(sessionId, finalEvent);
    }

    this.logger.info('Todas as conexões SSE foram encerradas', {
      operation: 'closeAllConnections',
      closedConnections: totalConnections
    });
  }
}
