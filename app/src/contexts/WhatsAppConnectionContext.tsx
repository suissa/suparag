import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { WhatsAppConnectionModal } from '../components/WhatsAppConnectionModal';

/**
 * Interface que define o valor do contexto de conexão WhatsApp
 * 
 * Fornece estado global e métodos para gerenciar a conexão WhatsApp
 * em toda a aplicação
 */
export interface WhatsAppConnectionContextValue {
  /** Indica se o WhatsApp está conectado */
  isConnected: boolean;
  
  /** ID da sessão do usuário */
  sessionId: string;
  
  /** Verifica o status atual da conexão com o backend */
  checkConnection: () => Promise<void>;
  
  /** Inicia o processo de conexão (abre o modal) */
  connect: () => Promise<void>;
  
  /** Desconecta o WhatsApp */
  disconnect: () => Promise<void>;
}

/**
 * Props do Provider
 */
interface WhatsAppConnectionProviderProps {
  children: ReactNode;
}

/**
 * Context para gerenciar estado global da conexão WhatsApp
 * 
 * Este contexto fornece:
 * - Estado global isConnected
 * - Métodos para verificar, conectar e desconectar
 * - Integração com modal de conexão
 */
const WhatsAppConnectionContext = createContext<WhatsAppConnectionContextValue | undefined>(
  undefined
);

/**
 * Provider component que envolve a aplicação e fornece
 * o contexto de conexão WhatsApp para todos os componentes filhos
 * 
 * @example
 * ```tsx
 * <WhatsAppConnectionProvider>
 *   <App />
 * </WhatsAppConnectionProvider>
 * ```
 */
export function WhatsAppConnectionProvider({ children }: WhatsAppConnectionProviderProps) {
  // Estado global da conexão
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Estado para controlar exibição do modal (será implementado na subtarefa 6.3)
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // Estado para armazenar sessionId
  const [sessionId] = useState<string>(() => {
    // Tentar recuperar sessionId do localStorage
    const stored = localStorage.getItem('whatsapp_session_id');
    if (stored) {
      return stored;
    }
    // Gerar novo sessionId se não existir
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('whatsapp_session_id', newSessionId);
    console.log('[WhatsAppConnectionContext] Novo sessionId gerado:', newSessionId);
    return newSessionId;
  });

  /**
   * Verifica o status atual da conexão consultando o backend
   * Atualiza o estado isConnected baseado na resposta
   * 
   * Consulta GET /api/v1/whatsapp/status e atualiza o estado global
   * 
   * @throws Error se a requisição falhar
   */
  const checkConnection = async (): Promise<void> => {
    try {
      console.log('[WhatsAppConnectionContext] Verificando status da conexão...');
      console.log('[WhatsAppConnectionContext] SessionId:', sessionId);
      
      const response = await api.get('/whatsapp/status', {
        params: { sessionId }
      });
      
      const { connected } = response.data;
      
      console.log('[WhatsAppConnectionContext] Status recebido:', { connected });
      
      setIsConnected(connected === true);
      
    } catch (error: any) {
      console.error('[WhatsAppConnectionContext] Erro ao verificar conexão:', error);
      
      // Em caso de erro, assumir desconectado
      setIsConnected(false);
      
      // Re-throw para permitir tratamento específico pelo chamador
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erro ao verificar status da conexão'
      );
    }
  };

  /**
   * Inicia o processo de conexão
   * 
   * Abre o modal de conexão WhatsApp sob demanda (apenas quando chamado explicitamente).
   * Este é o ÚNICO método que pode abrir o modal.
   * 
   * A lógica de conexão real (QR code, SSE, etc.) está no WhatsAppConnectionModal.
   * 
   * Requisito implementado:
   * - 5.4: Método connect() abre modal sob demanda
   */
  const connect = async (): Promise<void> => {
    console.log('[WhatsAppConnectionContext] Abrindo modal de conexão...');
    setShowModal(true);
  };

  /**
   * Desconecta o WhatsApp
   * Chama o endpoint DELETE /api/v1/whatsapp/disconnect
   * 
   * @throws Error se a requisição falhar
   */
  const disconnect = async (): Promise<void> => {
    try {
      console.log('[WhatsAppConnectionContext] Desconectando WhatsApp...');
      console.log('[WhatsAppConnectionContext] SessionId:', sessionId);
      
      const response = await api.delete('/whatsapp/disconnect', {
        params: { sessionId }
      });
      
      console.log('[WhatsAppConnectionContext] Desconectado com sucesso:', response.data);
      
      // Atualizar estado para desconectado
      setIsConnected(false);
      
    } catch (error: any) {
      console.error('[WhatsAppConnectionContext] Erro ao desconectar:', error);
      
      // Re-throw para permitir tratamento específico pelo chamador
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erro ao desconectar WhatsApp'
      );
    }
  };

  /**
   * Handler para fechar o modal
   * Atualiza o estado showModal para false
   */
  const handleCloseModal = () => {
    console.log('[WhatsAppConnectionContext] Fechando modal...');
    setShowModal(false);
  };

  /**
   * Efeito para verificar status ao montar o Provider
   * 
   * IMPORTANTE: Este efeito APENAS verifica o status da conexão existente.
   * O modal NÃO é aberto automaticamente em nenhuma circunstância.
   * O modal só abre quando o usuário chama explicitamente o método connect().
   * 
   * Requisitos implementados:
   * - 5.1: Verificação de status sem abertura automática do modal
   * - 5.2: Estado isConnected atualizado, showModal permanece false
   * - 5.3: Modal não abre mesmo se WhatsApp estiver desconectado
   */
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        console.log('[WhatsAppConnectionContext] Inicializando verificação de conexão...');
        
        // Verificar status da conexão (atualiza apenas isConnected)
        await checkConnection();
        
        // showModal permanece false - modal só abre via connect()
        console.log('[WhatsAppConnectionContext] Status verificado. Modal permanece fechado.');
        
      } catch (error) {
        console.error('[WhatsAppConnectionContext] Erro ao inicializar conexão:', error);
        
        // Mesmo em caso de erro, modal não abre automaticamente
        // Usuário deve solicitar conexão explicitamente via connect()
      }
    };
    
    // Executar verificação ao montar
    initializeConnection();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez ao montar

  /**
   * Efeito para fechar modal automaticamente quando conectar
   * 
   * Monitora mudanças no estado isConnected e fecha o modal automaticamente
   * após conexão bem-sucedida, dando tempo para o usuário ver a mensagem de sucesso.
   * 
   * Requisito implementado:
   * - 5.5: Fechamento automático do modal após conexão bem-sucedida
   */
  useEffect(() => {
    if (isConnected && showModal) {
      console.log('[WhatsAppConnectionContext] Conexão estabelecida, fechando modal...');
      // Aguardar 1.5s para o usuário ver a mensagem de sucesso
      setTimeout(() => {
        setShowModal(false);
      }, 1500);
    }
  }, [isConnected, showModal]);

  /**
   * Efeito para importar contatos após conexão bem-sucedida
   * 
   * Requisito implementado:
   * - 7.1: Detectar conexão bem-sucedida
   * - 7.2: Implementar chamada POST /api/v1/whatsapp/import após conexão
   * - 7.3: Passar sessionId no payload da requisição
   * - 7.4: Tratamento de erro para importação
   * - 7.5: Importação ocorre após modal fechar (delay de 2s)
   */
  useEffect(() => {
    if (isConnected && !showModal) {
      console.log('[WhatsAppConnectionContext] Conexão estabelecida e modal fechado, iniciando importação...');
      // Aguardar 2s após fechamento do modal para iniciar importação
      setTimeout(async () => {
        try {
          console.log('[WhatsAppConnectionContext] Iniciando importação de contatos...');
          // Chamar endpoint de importação (ainda precisa ser implementado no backend)
          const response = await api.post('/whatsapp/import', { sessionId });
          console.log('[WhatsAppConnectionContext] Importação iniciada com sucesso:', response.data);
        } catch (error: any) {
          console.error('[WhatsAppConnectionContext] Erro ao iniciar importação:', error);
          // Tratamento de erro para importação
        }
      }, 2000);
    }
  }, [isConnected, showModal, sessionId]);

  // Valor do contexto
  const contextValue: WhatsAppConnectionContextValue = {
    isConnected,
    sessionId,
    checkConnection,
    connect,
    disconnect,
  };

  return (
    <WhatsAppConnectionContext.Provider value={contextValue}>
      {children}
      
      {/* 
        Modal de conexão WhatsApp
        
        Requisito implementado:
        - 5.6: Condição do modal é apenas open={showModal}
        - Não há verificação de !isConnected, permitindo que o modal
          seja controlado exclusivamente pelo estado showModal
      */}
      <WhatsAppConnectionModal
        open={showModal}
        onClose={handleCloseModal}
        sessionId={sessionId}
      />
    </WhatsAppConnectionContext.Provider>
  );
}

/**
 * Hook customizado para acessar o contexto de conexão WhatsApp
 * 
 * @throws Error se usado fora do WhatsAppConnectionProvider
 * 
 * @example
 * ```tsx
 * const { isConnected, connect, disconnect } = useWhatsAppConnection();
 * ```
 */
export const useWhatsAppConnection = (): WhatsAppConnectionContextValue => {
  const context = useContext(WhatsAppConnectionContext);
  
  if (context === undefined) {
    throw new Error(
      'useWhatsAppConnection deve ser usado dentro de um WhatsAppConnectionProvider'
    );
  }
  
  return context;
};

export default WhatsAppConnectionContext;