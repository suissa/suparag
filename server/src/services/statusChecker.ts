import { EvolutionService, ConnectionStatus } from './evolutionService';
import { env } from '../config/env';
import { createLogger } from './logger';

/**
 * Interface para dados de verificação armazenados
 */
interface CheckingData {
  instanceName: string;
  sessionId: string;
  interval: NodeJS.Timeout;
  timeout: NodeJS.Timeout;
  lastStatus: string;
  startedAt: Date;
}

/**
 * Callback chamado quando o status da conexão muda
 */
export type StatusChangeCallback = (status: ConnectionStatus) => void;

/**
 * Serviço para verificação periódica do status de conexão WhatsApp
 * 
 * Responsabilidades:
 * - Verificar status a cada 30 segundos
 * - Implementar timeout de 5 minutos
 * - Notificar mudanças de status via callback
 * - Gerenciar lifecycle de intervalos e timeouts
 */
export class StatusChecker {
  private checkings: Map<string, CheckingData>;
  private evolutionService: EvolutionService;
  private checkInterval: number;
  private checkTimeout: number;
  private logger = createLogger('StatusChecker');

  constructor(evolutionService: EvolutionService) {
    // Criar Map para armazenar intervalos ativos (instanceName → CheckingData)
    this.checkings = new Map<string, CheckingData>();
    
    // Armazenar referência ao EvolutionService
    this.evolutionService = evolutionService;
    
    // Configurar intervalos (com valores do .env ou padrões)
    this.checkInterval = env.evolution.checkInterval || 30000; // 30 segundos
    this.checkTimeout = env.evolution.timeout || 300000; // 5 minutos

    this.logger.info('StatusChecker inicializado', {
      operation: 'constructor',
      checkInterval: `${this.checkInterval}ms`,
      checkTimeout: `${this.checkTimeout}ms`
    });
  }

  /**
   * Inicia verificação periódica do status de uma instância
   * 
   * @param instanceName - Nome da instância a verificar
   * @param sessionId - ID da sessão associada
   * @param callback - Função chamada quando status mudar
   */
  startChecking(
    instanceName: string,
    sessionId: string,
    callback: StatusChangeCallback
  ): void {
    // Verificar se já existe verificação ativa para esta instância
    if (this.checkings.has(instanceName)) {
      this.logger.warn('Verificação já ativa para instância', {
        operation: 'startChecking',
        instanceName,
        sessionId
      });
      return;
    }

    this.logger.info('Iniciando verificação periódica', {
      operation: 'startChecking',
      instanceName,
      sessionId,
      checkInterval: `${this.checkInterval}ms`,
      checkTimeout: `${this.checkTimeout}ms`
    });

    // Configurar setInterval para verificar a cada 30 segundos
    const interval = setInterval(async () => {
      await this.performCheck(instanceName, callback);
    }, this.checkInterval);

    // Configurar setTimeout para timeout de 5 minutos
    const timeout = setTimeout(() => {
      this.logger.warn('Timeout atingido para verificação de instância', {
        operation: 'startChecking.timeout',
        instanceName,
        sessionId,
        timeoutMs: this.checkTimeout
      });
      
      // Notificar callback com status de timeout
      callback({
        connected: false,
        status: 'timeout',
        instanceName
      });

      // Parar verificação
      this.stopChecking(instanceName);
    }, this.checkTimeout);

    // Armazenar dados de verificação no Map
    const checkingData: CheckingData = {
      instanceName,
      sessionId,
      interval,
      timeout,
      lastStatus: 'unknown',
      startedAt: new Date()
    };

    this.checkings.set(instanceName, checkingData);

    this.logger.info('Verificação periódica iniciada com sucesso', {
      operation: 'startChecking',
      instanceName,
      sessionId,
      totalCheckings: this.checkings.size
    });

    // Realizar primeira verificação imediatamente
    this.performCheck(instanceName, callback);
  }

  /**
   * Realiza uma verificação de status e notifica se houver mudança
   * 
   * @param instanceName - Nome da instância
   * @param callback - Callback para notificar mudanças
   */
  private async performCheck(
    instanceName: string,
    callback: StatusChangeCallback
  ): Promise<void> {
    const checkingData = this.checkings.get(instanceName);
    
    if (!checkingData) {
      this.logger.warn('Dados de verificação não encontrados', {
        operation: 'performCheck',
        instanceName
      });
      return;
    }

    try {
      this.logger.debug('Executando verificação de status', {
        operation: 'performCheck',
        instanceName,
        sessionId: checkingData.sessionId,
        lastStatus: checkingData.lastStatus
      });

      // Chamar evolutionService.checkStatus() a cada intervalo
      const currentStatus = await this.evolutionService.checkStatus(instanceName);

      // Comparar status atual com status anterior
      const statusChanged = currentStatus.status !== checkingData.lastStatus;

      if (statusChanged) {
        this.logger.info('Status da instância mudou', {
          operation: 'performCheck',
          instanceName,
          sessionId: checkingData.sessionId,
          previousStatus: checkingData.lastStatus,
          newStatus: currentStatus.status,
          connected: currentStatus.connected
        });
        
        // Atualizar lastStatus
        checkingData.lastStatus = currentStatus.status;
        this.checkings.set(instanceName, checkingData);

        // Chamar callback apenas quando status mudar
        callback(currentStatus);

        // Parar verificação quando status='connected'
        if (currentStatus.connected) {
          this.logger.info('Instância conectada! Parando verificação', {
            operation: 'performCheck',
            instanceName,
            sessionId: checkingData.sessionId
          });
          this.stopChecking(instanceName);
        }
      } else {
        this.logger.debug('Status não mudou, continuando verificação', {
          operation: 'performCheck',
          instanceName,
          status: currentStatus.status
        });
      }
    } catch (error) {
      this.logger.error('Erro ao verificar status da instância', {
        operation: 'performCheck',
        instanceName,
        sessionId: checkingData.sessionId
      }, error as Error);
      
      // Em caso de erro, notificar callback
      callback({
        connected: false,
        status: 'error',
        instanceName
      });
    }
  }

  /**
   * Para a verificação periódica de uma instância
   * 
   * @param instanceName - Nome da instância
   */
  stopChecking(instanceName: string): void {
    // Buscar dados de verificação no Map
    const checkingData = this.checkings.get(instanceName);

    if (!checkingData) {
      this.logger.warn('Tentativa de parar verificação inexistente', {
        operation: 'stopChecking',
        instanceName
      });
      return;
    }

    this.logger.info('Parando verificação de instância', {
      operation: 'stopChecking',
      instanceName,
      sessionId: checkingData.sessionId
    });

    // Chamar clearInterval e clearTimeout
    clearInterval(checkingData.interval);
    clearTimeout(checkingData.timeout);

    // Remover do Map
    this.checkings.delete(instanceName);

    const duration = Date.now() - checkingData.startedAt.getTime();
    this.logger.info('Verificação parada com sucesso', {
      operation: 'stopChecking',
      instanceName,
      sessionId: checkingData.sessionId,
      duration: `${duration}ms`,
      durationSeconds: (duration / 1000).toFixed(1),
      remainingCheckings: this.checkings.size
    });
  }

  /**
   * Verifica se existe verificação ativa para uma instância
   * 
   * @param instanceName - Nome da instância
   * @returns true se existe verificação ativa
   */
  isChecking(instanceName: string): boolean {
    return this.checkings.has(instanceName);
  }

  /**
   * Obtém informações sobre uma verificação ativa
   * 
   * @param instanceName - Nome da instância
   * @returns Dados da verificação ou undefined
   */
  getCheckingInfo(instanceName: string): Omit<CheckingData, 'interval' | 'timeout'> | undefined {
    const data = this.checkings.get(instanceName);
    if (!data) return undefined;

    return {
      instanceName: data.instanceName,
      sessionId: data.sessionId,
      lastStatus: data.lastStatus,
      startedAt: data.startedAt
    };
  }

  /**
   * Lista todas as instâncias com verificação ativa
   * 
   * @returns Array de instanceNames
   */
  getActiveCheckings(): string[] {
    return Array.from(this.checkings.keys());
  }

  /**
   * Obtém o número de verificações ativas
   * 
   * @returns Número de verificações ativas
   */
  getCheckingCount(): number {
    return this.checkings.size;
  }

  /**
   * Para todas as verificações ativas (útil para shutdown graceful)
   */
  stopAllCheckings(): void {
    const totalCheckings = this.checkings.size;
    
    this.logger.info('Parando todas as verificações', {
      operation: 'stopAllCheckings',
      totalCheckings
    });

    const instanceNames = Array.from(this.checkings.keys());
    
    for (const instanceName of instanceNames) {
      this.stopChecking(instanceName);
    }

    this.logger.info('Todas as verificações foram paradas', {
      operation: 'stopAllCheckings',
      stoppedCheckings: totalCheckings
    });
  }
}
