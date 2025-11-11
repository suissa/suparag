import { EvolutionClient, ConnectionState } from 'sdk-evolution-chatbot';
import { env } from '../config/env';
import { randomUUID } from 'crypto';

/**
 * Interface para dados de instância armazenados
 */
interface InstanceData {
  instanceName: string;
  sessionId: string;
  createdAt: Date;
  status: string;
}

/**
 * Interface para status de conexão retornado
 */
export interface ConnectionStatus {
  connected: boolean;
  status: string;
  instanceName?: string;
}

/**
 * Serviço para gerenciar instâncias WhatsApp através da Evolution API
 * 
 * Responsabilidades:
 * - Criar instâncias únicas por sessão
 * - Consultar status de conexão
 * - Obter QR codes para autenticação
 * - Gerenciar lifecycle de instâncias
 */
export class EvolutionService {
  private client: EvolutionClient;
  private instances: Map<string, InstanceData>;

  constructor() {
    // Inicializar cliente SDK Evolution com credenciais do .env
    this.client = new EvolutionClient({
      serverUrl: env.evolution.apiUrl,
      token: env.evolution.apiKey
    });

    // Criar Map para armazenar instâncias ativas
    this.instances = new Map<string, InstanceData>();

    console.log('✅ EvolutionService inicializado com sucesso');
    console.log(`   API URL: ${env.evolution.apiUrl}`);
    console.log(`   Instance Prefix: ${env.evolution.instancePrefix}`);
  }

  /**
   * Cria uma nova instância WhatsApp na Evolution API
   * 
   * @param sessionId - ID da sessão do usuário
   * @returns instanceName - Nome único da instância criada
   * @throws Error se a criação falhar
   */
  async createInstance(sessionId: string): Promise<string> {
    try {
      // Gerar instanceName único usando timestamp e UUID
      const timestamp = Date.now();
      const uuid = randomUUID().split('-')[0]; // Usar apenas primeira parte do UUID
      const instanceName = `${env.evolution.instancePrefix}_${timestamp}_${uuid}`;

      console.log(`📱 Criando instância WhatsApp...`);
      console.log(`   Session ID: ${sessionId}`);
      console.log(`   Instance Name: ${instanceName}`);

      // Chamar client.instances.create() com parâmetros corretos
      const response = await this.client.instances.create({
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

      console.log(`✅ Instância criada com sucesso: ${instanceName}`);
      console.log(`   Response:`, response);

      // Retornar instanceName criado
      return instanceName;
    } catch (error) {
      console.error('❌ Erro ao criar instância WhatsApp:', error);
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
   * Verifica o status de conexão de uma instância WhatsApp
   * 
   * @param instanceName - Nome da instância a verificar
   * @returns ConnectionStatus com informações de conexão
   * @throws Error se a consulta falhar
   */
  async checkStatus(instanceName: string): Promise<ConnectionStatus> {
    try {
      console.log(`🔍 Verificando status da instância: ${instanceName}`);

      // Consultar status da instância usando SDK
      const response = await this.client.instances.connectionState({
        instanceName
      });

      console.log(`   Status response:`, response);

      // Determinar se está conectado baseado no estado retornado
      const state = response?.instance?.state || ConnectionState.CLOSED;
      const connected = state === ConnectionState.OPEN;

      // Atualizar status local se a instância existir no Map
      for (const [sessionId, data] of this.instances.entries()) {
        if (data.instanceName === instanceName) {
          data.status = state;
          this.instances.set(sessionId, data);
          break;
        }
      }

      // Retornar objeto com status (connected, disconnected, etc)
      return {
        connected,
        status: state,
        instanceName
      };
    } catch (error) {
      console.error(`❌ Erro ao verificar status da instância ${instanceName}:`, error);
      
      // Em caso de erro, retornar como desconectado
      return {
        connected: false,
        status: 'error',
        instanceName
      };
    }
  }

  /**
   * Obtém o QR code de uma instância WhatsApp para autenticação
   * 
   * @param instanceName - Nome da instância
   * @returns String base64 do QR code
   * @throws Error se a consulta falhar ou QR não estiver disponível
   */
  async getQRCode(instanceName: string): Promise<string> {
    try {
      console.log(`📱 Obtendo QR code da instância: ${instanceName}`);

      // Consultar QR code da instância usando SDK
      const response = await this.client.instances.connect({
        instanceName
      });

      console.log(`   QR Code response:`, response);

      // Extrair QR code base64 da resposta
      const qrCode = response?.base64;

      if (!qrCode) {
        throw new Error('QR code não disponível na resposta da API');
      }

      // Retornar string base64 do QR code
      return qrCode;
    } catch (error) {
      console.error(`❌ Erro ao obter QR code da instância ${instanceName}:`, error);
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
    try {
      console.log(`🗑️  Deletando instância: ${instanceName}`);

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
        console.log(`   Instância removida do Map local (sessionId: ${sessionIdToRemove})`);
      }

      // Chamar método de deleção da SDK (se disponível)
      try {
        await this.client.instances.delete({
          instanceName
        });
        console.log(`✅ Instância deletada com sucesso da Evolution API: ${instanceName}`);
      } catch (apiError) {
        // Se a API retornar erro (ex: instância já deletada), apenas logar
        console.warn(`⚠️  Aviso ao deletar da API (pode já estar deletada):`, apiError);
      }
    } catch (error) {
      console.error(`❌ Erro ao deletar instância ${instanceName}:`, error);
      throw new Error(`Falha ao deletar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

