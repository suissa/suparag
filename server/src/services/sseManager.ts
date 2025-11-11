import { Response } from 'express';

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

  constructor() {
    // Criar Map para armazenar conexões ativas (sessionId → Response)
    this.connections = new Map<string, Response>();
    console.log('✅ SSEManager inicializado');
  }

  /**
   * Adiciona uma nova conexão SSE ao gerenciador
   * 
   * @param sessionId - ID único da sessão do cliente
   * @param res - Objeto Response do Express para streaming
   */
  addConnection(sessionId: string, res: Response): void {
    console.log(`📡 Adicionando conexão SSE para sessionId: ${sessionId}`);

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
      console.log(`🔌 Cliente desconectou SSE: ${sessionId}`);
      this.connections.delete(sessionId);
    });

    console.log(`✅ Conexão SSE estabelecida para sessionId: ${sessionId}`);
    console.log(`   Total de conexões ativas: ${this.connections.size}`);
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
      console.warn(`⚠️  Tentativa de enviar evento para sessionId inexistente: ${sessionId}`);
      return false;
    }

    try {
      // Formatar evento no padrão SSE (event: tipo\ndata: json\n\n)
      const eventType = event.type;
      const eventData = JSON.stringify(event.data);
      const formattedEvent = `event: ${eventType}\ndata: ${eventData}\n\n`;

      console.log(`📤 Enviando evento SSE para ${sessionId}:`);
      console.log(`   Tipo: ${eventType}`);
      console.log(`   Data: ${eventData.substring(0, 100)}${eventData.length > 100 ? '...' : ''}`);

      // Enviar evento para Response específico via res.write()
      res.write(formattedEvent);

      return true;
    } catch (error) {
      // Tratar erros de envio (conexão fechada)
      console.error(`❌ Erro ao enviar evento SSE para ${sessionId}:`, error);
      
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

    console.log(`📡 Broadcast enviado para ${successCount}/${targets.length} clientes`);
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
      console.warn(`⚠️  Tentativa de fechar conexão inexistente: ${sessionId}`);
      return;
    }

    try {
      console.log(`🔌 Encerrando conexão SSE para sessionId: ${sessionId}`);

      // Enviar evento final antes de fechar (se fornecido)
      if (finalEvent) {
        this.sendEvent(sessionId, finalEvent);
      }

      // Chamar res.end() para encerrar stream
      res.end();

      console.log(`✅ Conexão SSE encerrada para sessionId: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Erro ao encerrar conexão SSE para ${sessionId}:`, error);
    } finally {
      // Remover conexão do Map
      this.connections.delete(sessionId);
      console.log(`   Total de conexões ativas: ${this.connections.size}`);
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
    console.log(`🔌 Encerrando todas as conexões SSE (${this.connections.size} ativas)`);

    const sessionIds = Array.from(this.connections.keys());
    
    for (const sessionId of sessionIds) {
      this.closeConnection(sessionId, finalEvent);
    }

    console.log('✅ Todas as conexões SSE foram encerradas');
  }
}
