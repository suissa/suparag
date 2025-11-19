import { EvolutionClient, ConnectionState } from 'sdk-evolution-chatbot';
import { env } from '../config/env';
import { randomUUID } from 'crypto';
import { createLogger } from './logger';

/**
 * Interface para dados de instância armazenados
 */
interface InstanceData {
  instanceName: string;
  sessionId: string;
  createdAt: Date;
  status: string;
  clientIp?: string;
  host?: string;
}

/**
 * Interface para status de conexão retornado
 */
export interface ConnectionStatus {
  connected: boolean;
  status: string;
  clientIp?: string;
  host?: string;
  instanceName?: string;
}

/**
 * Interface para dados de contato do WhatsApp
 */
export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  profilePicUrl?: string;
}

/**
 * Interface para dados de mensagem do WhatsApp
 */
export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  type: string;
}

/**
 * Serviço para gerenciar instâncias WhatsApp através da Evolution API
 * 
 * Responsabilidades:
 * - Criar instâncias únicas por sessão
 * - Consultar status de conexão
 * - Obter QR codes para autenticação
 * - Gerenciar lifecycle de instâncias
 * - Importar contatos e mensagens
 */
export class EvolutionService {
  private client: EvolutionClient;
  private instances: Map<string, InstanceData>;
  private logger = createLogger('EvolutionService');

  constructor() {
    // Inicializar cliente SDK Evolution com credenciais do .env
    this.client = new EvolutionClient({
      serverUrl: env.evolution.apiUrl,
      token: env.evolution.apiKey,
      instance: 'neuropgrag_1763390942512_2844c7c4'//'SUPARAG'
    });

    // Criar Map para armazenar instâncias ativas
    this.instances = new Map<string, InstanceData>();

    this.logger.info('EvolutionService inicializado com sucesso', {
      operation: 'constructor',
      apiUrl: env.evolution.apiUrl,
      instancePrefix: env.evolution.instancePrefix
    });
  }

  /**
   * Cria uma nova instância WhatsApp na Evolution API
   * 
   * @param sessionId - ID da sessão do usuário
   * @returns instanceName - Nome único da instância criada
   * @throws Error se a criação falhar
   */
  async createInstance(sessionId: string, clientIp?: string, host?: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Gerar instanceName único usando timestamp e UUID
      const timestamp = Date.now();
      const uuid = randomUUID().split('-')[0]; // Usar apenas primeira parte do UUID
      const instanceName = `${env.evolution.instancePrefix}_${timestamp}_${uuid}`;

      this.logger.info('Iniciando criação de instância WhatsApp', {
        operation: 'createInstance',
        sessionId,
        instanceName
      });

      // Chamar client.instances.create() com parâmetros corretos
      await this.client.instances.create({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      });

      // Armazenar mapeamento sessionId → instanceName
      const instanceData: InstanceData = {
        instanceName,
        sessionId,
        createdAt: new Date(),
        status: 'created'
      };

      this.instances.set(sessionId, instanceData);

      const duration = Date.now() - startTime;
      this.logger.info('Instância criada com sucesso', {
        operation: 'createInstance',
        sessionId,
        instanceName,
        duration: `${duration}ms`,
        totalInstances: this.instances.size
      });

      // Retornar instanceName criado
      return instanceName;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Falha ao criar instância WhatsApp', {
        operation: 'createInstance',
        sessionId,
        duration: `${duration}ms`
      }, error as Error);
      
      throw new Error(`Falha ao criar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Obtém o instanceName associado a um sessionId
   * 
   * @param sessionId - ID da sessão
   * @returns instanceName ou undefined se não encontrado
   */
  getInstanceName(sessionId: string): string | undefined {
    const instanceData = this.instances.get(sessionId);
    return instanceData?.instanceName;
  }

  /**
   * Obtém todos os dados de uma instância
   * 
   * @param sessionId - ID da sessão
   * @returns InstanceData ou undefined se não encontrado
   */
  getInstanceData(sessionId: string): InstanceData | undefined {
    return this.instances.get(sessionId);
  }

  /**
   * Lista todas as instâncias ativas
   * 
   * @returns Array com todas as instâncias
   */
  listInstances(): InstanceData[] {
    return Array.from(this.instances.values());
  }

  /**
   * Vincula uma instância existente a um sessionId
   * Útil quando a instância já existe na Evolution API mas não está no Map local
   * 
   * @param sessionId - ID da sessão do usuário
   * @param instanceName - Nome da instância existente
   */
  linkInstanceToSession(sessionId: string, instanceName: string): void {
    const instanceData: InstanceData = {
      instanceName,
      sessionId,
      createdAt: new Date(),
      status: 'linked'
    };

    this.instances.set(sessionId, instanceData);

    this.logger.info('Instância vinculada ao sessionId', {
      operation: 'linkInstanceToSession',
      sessionId,
      instanceName,
      totalInstances: this.instances.size
    });
  }

  /**
   * Vincula manualmente uma instância existente ao sessionId
   * Útil quando o usuário já tem uma instância conectada no Evolution Manager
   * 
   * @param sessionId - ID da sessão do usuário
   * @param instanceName - Nome exato da instância (ex: neuropgrag_1763390942512_2844c7c4)
   * @returns true se vinculado com sucesso
   */
  async linkExistingInstance(sessionId: string, instanceName: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Vinculando instância existente ao sessionId', {
        operation: 'linkExistingInstance',
        sessionId,
        instanceName
      });

      // Verificar se a instância existe e está conectada
      const status = await this.checkStatus(instanceName);
      
      if (!status.connected) {
        this.logger.warn('Instância não está conectada', {
          operation: 'linkExistingInstance',
          sessionId,
          instanceName,
          status: status.status
        });
        return false;
      }

      // Vincular ao sessionId
      this.linkInstanceToSession(sessionId, instanceName);

      const duration = Date.now() - startTime;
      this.logger.info('Instância vinculada com sucesso', {
        operation: 'linkExistingInstance',
        sessionId,
        instanceName,
        duration: `${duration}ms`
      });

      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao vincular instância existente', {
        operation: 'linkExistingInstance',
        sessionId,
        instanceName,
        duration: `${duration}ms`
      }, error as Error);
      
      return false;
    }
  }

  /**
   * Lista todas as instâncias da Evolution API via HTTP
   * 
   * @returns Array de instâncias
   */
  async listAllInstances(): Promise<any[]> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Listando todas as instâncias da Evolution API', {
        operation: 'listAllInstances'
      });

      // Fazer requisição HTTP direta para a Evolution API
      const response = await fetch(`${env.evolution.apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': env.evolution.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const instances = await response.json();

      const duration = Date.now() - startTime;
      this.logger.info('Instâncias listadas com sucesso', {
        operation: 'listAllInstances',
        count: Array.isArray(instances) ? instances.length : 0,
        duration: `${duration}ms`
      });

      return Array.isArray(instances) ? instances : [];
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao listar instâncias da API', {
        operation: 'listAllInstances',
        duration: `${duration}ms`
      }, error as Error);
      
      return [];
    }
  }

  /**
   * Busca automaticamente uma instância conectada disponível para vincular ao sessionId
   * Lista todas as instâncias da Evolution API e retorna a primeira conectada não vinculada
   * 
   * @param sessionId - ID da sessão do usuário
   * @returns instanceName se encontrado, undefined caso contrário
   */
  async findInstanceBySessionId(sessionId: string): Promise<string | undefined> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Buscando instância conectada automaticamente', {
        operation: 'findInstanceBySessionId',
        sessionId
      });

      // Listar instâncias já vinculadas para não reutilizar
      const linkedInstances = new Set(
        Array.from(this.instances.values()).map(data => data.instanceName)
      );

      this.logger.debug('Instâncias já vinculadas', {
        operation: 'findInstanceBySessionId',
        linkedCount: linkedInstances.size,
        linkedInstances: Array.from(linkedInstances)
      });

      // Listar todas as instâncias da Evolution API
      const allInstances = await this.listAllInstances();

      if (allInstances.length === 0) {
        this.logger.warn('Nenhuma instância encontrada na Evolution API', {
          operation: 'findInstanceBySessionId',
          sessionId
        });
        return undefined;
      }

      this.logger.info('Instâncias encontradas na Evolution API', {
        operation: 'findInstanceBySessionId',
        sessionId,
        totalInstances: allInstances.length
      });

      // Procurar QUALQUER instância conectada (ignorar se já está vinculada)
      // SEMPRE usar a primeira instância conectada disponível
      for (const instance of allInstances) {
        // A Evolution API retorna: { name, connectionStatus, ... }
        const instanceName = instance.name || instance.instance?.instanceName || instance.instanceName;
        
        if (!instanceName) continue;

        // Verificar se está conectada
        // A Evolution API usa connectionStatus: "open" | "close"
        const connectionStatus = instance.connectionStatus || instance.instance?.state || instance.state;
        const isConnected = connectionStatus === 'open' || connectionStatus === 'OPEN';

        if (isConnected) {
          const duration = Date.now() - startTime;
          this.logger.info('Instância conectada encontrada automaticamente!', {
            operation: 'findInstanceBySessionId',
            sessionId,
            instanceName,
            connectionStatus,
            wasLinked: linkedInstances.has(instanceName),
            duration: `${duration}ms`
          });
          return instanceName;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.warn('Nenhuma instância conectada disponível encontrada', {
        operation: 'findInstanceBySessionId',
        sessionId,
        totalInstances: allInstances.length,
        linkedInstances: linkedInstances.size,
        duration: `${duration}ms`
      });

      return undefined;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao buscar instância automaticamente', {
        operation: 'findInstanceBySessionId',
        sessionId,
        duration: `${duration}ms`
      }, error as Error);
      
      return undefined;
    }
  }

  /**
   * Verifica o status de conexão de uma instância WhatsApp
   * 
   * @param instanceName - Nome da instância a verificar
   * @returns ConnectionStatus com informações de conexão
   * @throws Error se a consulta falhar
   */
  async checkStatus(instanceName: string): Promise<ConnectionStatus> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Verificando status da instância', {
        operation: 'checkStatus',
        instanceName
      });

      // Consultar status da instância usando SDK
      const response = await this.client.instances.connectionState({
        instanceName
      });

      // Determinar se está conectado baseado no estado retornado
      const state = response?.instance?.state || ConnectionState.CLOSED;
      const connected = state === ConnectionState.OPEN;
      const previousStatus = this.getInstanceData(this.getSessionIdByInstance(instanceName) || '')?.status;

      // Atualizar status local se a instância existir no Map
      for (const [sessionId, data] of this.instances.entries()) {
        if (data.instanceName === instanceName) {
          data.status = state;
          this.instances.set(sessionId, data);
          break;
        }
      }

      const duration = Date.now() - startTime;
      
      // Log apenas se status mudou (para evitar spam)
      if (previousStatus !== state) {
        this.logger.info('Status da instância mudou', {
          operation: 'checkStatus',
          instanceName,
          previousStatus,
          newStatus: state,
          connected,
          duration: `${duration}ms`
        });
      }

      // Retornar objeto com status (connected, disconnected, etc)
      return {
        connected,
        status: state,
        instanceName
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao verificar status da instância', {
        operation: 'checkStatus',
        instanceName,
        duration: `${duration}ms`
      }, error as Error);
      
      // Em caso de erro, retornar como desconectado
      return {
        connected: false,
        status: 'error',
        instanceName
      };
    }
  }

  /**
   * Obtém sessionId a partir do instanceName
   */
  private getSessionIdByInstance(instanceName: string): string | undefined {
    for (const [sessionId, data] of this.instances.entries()) {
      if (data.instanceName === instanceName) {
        return sessionId;
      }
    }
    return undefined;
  }

  /**
   * Obtém o QR code de uma instância WhatsApp para autenticação
   * 
   * @param instanceName - Nome da instância
   * @returns String base64 do QR code
   * @throws Error se a consulta falhar ou QR não estiver disponível
   */
  async getQRCode(instanceName: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Obtendo QR code da instância', {
        operation: 'getQRCode',
        instanceName
      });

      // Consultar QR code da instância usando SDK
      const response = await this.client.instances.connect({
        instanceName
      });
      console.log('\n\n\nRESPONSE:', response);
      // Extrair QR code base64 da resposta
      const qrCode = response?.base64;

      if (!qrCode) {
        throw new Error('QR code não disponível na resposta da API');
      }

      const duration = Date.now() - startTime;
      this.logger.info('QR code obtido com sucesso', {
        operation: 'getQRCode',
        instanceName,
        qrCodeLength: qrCode.length,
        duration: `${duration}ms`
      });

      // Retornar string base64 do QR code
      return qrCode;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Falha ao obter QR code', {
        operation: 'getQRCode',
        instanceName,
        duration: `${duration}ms`
      }, error as Error);
      
      throw new Error(`Falha ao obter QR code: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Deleta uma instância WhatsApp da Evolution API e remove do Map local
   * 
   * @param instanceName - Nome da instância a deletar
   * @throws Error se a deleção falhar
   */
  async deleteInstance(instanceName: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Iniciando deleção de instância', {
        operation: 'deleteInstance',
        instanceName
      });

      // Remover instância do Map local primeiro
      let sessionIdToRemove: string | null = null;
      for (const [sessionId, data] of this.instances.entries()) {
        if (data.instanceName === instanceName) {
          sessionIdToRemove = sessionId;
          break;
        }
      }

      if (sessionIdToRemove) {
        this.instances.delete(sessionIdToRemove);
        this.logger.debug('Instância removida do Map local', {
          operation: 'deleteInstance',
          instanceName,
          sessionId: sessionIdToRemove,
          remainingInstances: this.instances.size
        });
      }

      // Chamar método de deleção da SDK (se disponível)
      try {
        await this.client.instances.delete({
          instanceName
        });
        
        const duration = Date.now() - startTime;
        this.logger.info('Instância deletada com sucesso da Evolution API', {
          operation: 'deleteInstance',
          instanceName,
          duration: `${duration}ms`
        });
      } catch (apiError) {
        // Se a API retornar erro (ex: instância já deletada), apenas logar
        this.logger.warn('Aviso ao deletar da API (pode já estar deletada)', {
          operation: 'deleteInstance',
          instanceName,
          error: apiError instanceof Error ? apiError.message : String(apiError)
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Falha ao deletar instância', {
        operation: 'deleteInstance',
        instanceName,
        duration: `${duration}ms`
      }, error as Error);
      
      throw new Error(`Falha ao deletar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Importa contatos do WhatsApp para o sistema
   * 
   * @param instanceName - Nome da instância conectada
   * @returns Array de contatos importados
   * @throws Error se a importação falhar
   */
  async importContacts(instanceName: string): Promise<WhatsAppContact[]> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Iniciando importação de contatos do WhatsApp', {
        operation: 'importContacts',
        instanceName
      });

      // Placeholder para chamada real à API
      // Na implementação real, isso chamaria um método da SDK para buscar contatos
      // Exemplo: const response = await this.client.contacts.list({ instanceName });
      
      // Por enquanto, retornar array vazio como placeholder
      const contacts: WhatsAppContact[] = [];
      
      const duration = Date.now() - startTime;
      this.logger.info('Importação de contatos concluída', {
        operation: 'importContacts',
        instanceName,
        contactsCount: contacts.length,
        duration: `${duration}ms`
      });

      return contacts;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao importar contatos do WhatsApp', {
        operation: 'importContacts',
        instanceName,
        duration: `${duration}ms`
      }, error as Error);
      
      throw new Error(`Falha ao importar contatos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Importa mensagens do WhatsApp para o sistema
   * 
   * @param instanceName - Nome da instância conectada
   * @returns Array de mensagens importadas
   * @throws Error se a importação falhar
   */
  async importMessages(instanceName: string): Promise<WhatsAppMessage[]> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Iniciando importação de mensagens do WhatsApp', {
        operation: 'importMessages',
        instanceName
      });

      // Placeholder para chamada real à API
      // Na implementação real, isso chamaria um método da SDK para buscar mensagens
      // Exemplo: const response = await this.client.messages.list({ instanceName });
      
      // Por enquanto, retornar array vazio como placeholder
      const messages: WhatsAppMessage[] = [];
      
      const duration = Date.now() - startTime;
      this.logger.info('Importação de mensagens concluída', {
        operation: 'importMessages',
        instanceName,
        messagesCount: messages.length,
        duration: `${duration}ms`
      });

      return messages;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao importar mensagens do WhatsApp', {
        operation: 'importMessages',
        instanceName,
        duration: `${duration}ms`
      }, error as Error);
      
      throw new Error(`Falha ao importar mensagens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Envia mensagem de texto para um número WhatsApp
   * 
   * @param phoneNumber - Número do destinatário (formato: 5511999999999)
   * @param text - Texto da mensagem
   * @returns true se enviado com sucesso
   * @throws Error se o envio falhar
   */
  async sendTextMessage(phoneNumber: string, text: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Buscar instância conectada
      const instanceName = await this.findConnectedInstance();
      
      if (!instanceName) {
        throw new Error('Nenhuma instância WhatsApp conectada disponível');
      }

      this.logger.info('Enviando mensagem de texto via WhatsApp', {
        operation: 'sendTextMessage',
        instanceName,
        phoneNumber,
        textLength: text.length
      });

      // Enviar mensagem usando SDK
      await this.client.messages.sendText({
        number: phoneNumber,
        text: text
      });

      const duration = Date.now() - startTime;
      this.logger.info('Mensagem enviada com sucesso', {
        operation: 'sendTextMessage',
        instanceName,
        phoneNumber,
        duration: `${duration}ms`
      });

      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao enviar mensagem de texto', {
        operation: 'sendTextMessage',
        phoneNumber,
        duration: `${duration}ms`
      }, error as Error);
      
      throw new Error(`Falha ao enviar mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca a primeira instância conectada disponível
   * 
   * @returns instanceName da instância conectada ou undefined
   */
  private async findConnectedInstance(): Promise<string | undefined> {
    try {
      // Primeiro, verificar instâncias locais
      for (const [, data] of this.instances.entries()) {
        const status = await this.checkStatus(data.instanceName);
        if (status.connected) {
          return data.instanceName;
        }
      }

      // Se não encontrou localmente, buscar na API
      const allInstances = await this.listAllInstances();
      
      for (const instance of allInstances) {
        const instanceName = instance.name || instance.instance?.instanceName || instance.instanceName;
        if (!instanceName) continue;

        const connectionStatus = instance.connectionStatus || instance.instance?.state || instance.state;
        const isConnected = connectionStatus === 'open' || connectionStatus === 'OPEN';

        if (isConnected) {
          return instanceName;
        }
      }

      return undefined;
    } catch (error) {
      this.logger.error('Erro ao buscar instância conectada', {
        operation: 'findConnectedInstance'
      }, error as Error);
      
      return undefined;
    }
  }
}