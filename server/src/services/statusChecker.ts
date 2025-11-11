import { EvolutionService, ConnectionStatus } from './evolutionService';
import { env } from '../config/env';

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

  constructor(evolutionService: EvolutionService) {
    // Criar Map para armazenar intervalos ativos (instanceName → CheckingData)
    this.checkings = new Map<string, CheckingData>();
    
    // Armazenar referência ao EvolutionService
    this.evolutionService = evolutionService;
    
    // Configurar intervalos (com valores do .env ou padrões)
    this.checkInterval = env.evolution.checkInterval || 30000; // 30 segundos
    this.checkTimeout = env.evolution.timeout || 300000; // 5 minutos

    console.log('✅ StatusChecker inicializado');
    console.log(`   Intervalo de verificação: ${this.checkInterval}ms (${this.checkInterval / 1000}s)`);
    console.log(`   Timeout máximo: ${this.checkTimeout}ms (${this.checkTimeout / 1000}s)`);
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
      console.warn(`⚠️  Verificação já ativa para instância: ${instanceName}`);
      return;
    }

    console.log(`🔍 Iniciando verificação periódica para instância: ${instanceName}`);
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Intervalo: ${this.checkInterval}ms`);
    console.log(`   Timeout: ${this.checkTimeout}ms`);

    // Configurar setInterval para verificar a cada 30 segundos
    const interval = setInterval(async () => {
      await this.performCheck(instanceName, callback);
    }, this.checkInterval);

    // Configurar setTimeout para timeout de 5 minutos
    const timeout = setTimeout(() => {
      console.log(`⏱️  Timeout de ${this.checkTimeout}ms atingido para instância: ${instanceName}`);
      
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

    console.log(`✅ Verificação periódica iniciada para: ${instanceName}`);
    console.log(`   Total de verificações ativas: ${this.checkings.size}`);

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
      console.warn(`⚠️  Dados de verificação não encontrados para: ${instanceName}`);
      return;
    }

    try {
      console.log(`🔍 Verificando status da instância: ${instanceName}`);

      // Chamar evolutionService.checkStatus() a cada intervalo
      const currentStatus = await this.evolutionService.checkStatus(instanceName);

      console.log(`   Status atual: ${currentStatus.status}`);
      console.log(`   Conectado: ${currentStatus.connected}`);
      console.log(`   Status anterior: ${checkingData.lastStatus}`);

      // Comparar status atual com status anterior
      const statusChanged = currentStatus.status !== checkingData.lastStatus;

      if (statusChanged) {
        console.log(`🔄 Status mudou de "${checkingData.lastStatus}" para "${currentStatus.status}"`);
        
        // Atualizar lastStatus
        checkingData.lastStatus = currentStatus.status;
        this.checkings.set(instanceName, checkingData);

        // Chamar callback apenas quando status mudar
        callback(currentStatus);

        // Parar verificação quando status='connected'
        if (currentStatus.connected) {
          console.log(`✅ Instância conectada! Parando verificação: ${instanceName}`);
          this.stopChecking(instanceName);
        }
      } else {
        console.log(`   Status não mudou, continuando verificação...`);
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar status da instância ${instanceName}:`, error);
      
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
      console.warn(`⚠️  Tentativa de parar verificação inexistente: ${instanceName}`);
      return;
    }

    console.log(`🛑 Parando verificação para instância: ${instanceName}`);

    // Chamar clearInterval e clearTimeout
    clearInterval(checkingData.interval);
    clearTimeout(checkingData.timeout);

    // Remover do Map
    this.checkings.delete(instanceName);

    const duration = Date.now() - checkingData.startedAt.getTime();
    console.log(`✅ Verificação parada para: ${instanceName}`);
    console.log(`   Duração total: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
    console.log(`   Total de verificações ativas: ${this.checkings.size}`);
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
    console.log(`🛑 Parando todas as verificações (${this.checkings.size} ativas)`);

    const instanceNames = Array.from(this.checkings.keys());
    
    for (const instanceName of instanceNames) {
      this.stopChecking(instanceName);
    }

    console.log('✅ Todas as verificações foram paradas');
  }
}
