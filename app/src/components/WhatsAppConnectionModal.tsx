import { useState, useEffect, useRef } from 'react';
import { ConfigurableModal } from './ConfigurableModal';
import { whatsAppModalConfig } from './specs/whatsAppModalConfig.spec';
import { useSSE } from '../hooks/useSSE';
import api from '../services/api';

/**
 * Props do componente WhatsAppConnectionModal
 */
export interface WhatsAppConnectionModalProps {
  /** Controla a visibilidade do modal */
  open: boolean;
  /** Callback chamado quando o modal deve fechar */
  onClose: () => void;
  /** ID da sessão do usuário */
  sessionId: string;
}

/**
 * Estado da conexão WhatsApp
 */
export interface ConnectionState {
  /** Status atual da conexão */
  status: 'idle' | 'connecting' | 'connected' | 'error';
  /** QR code em base64 para autenticação */
  qrCode: string | null;
  /** Mensagem de erro, se houver */
  error: string | null;
}

/**
 * Componente modal para gerenciar conexão WhatsApp
 * 
 * Este componente:
 * - Exibe QR code para autenticação WhatsApp
 * - Gerencia estados de conexão (idle, connecting, connected, error)
 * - Integra com Evolution API via SSE para atualizações em tempo real
 * - Permite retry em caso de erro
 * 
 * @see {@link ConfigurableModal} para detalhes sobre o modal base
 * @see {@link whatsAppModalConfig} para configuração de aparência
 */
export const WhatsAppConnectionModal = ({
  open,
  onClose,
  sessionId,
}: WhatsAppConnectionModalProps) => {
  // Estado local da conexão
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'idle',
    qrCode: null,
    error: null,
  });

  // Estado para controlar se deve conectar ao SSE
  const [shouldConnectSSE, setShouldConnectSSE] = useState(false);
  
  // Ref para o timeout de 5 minutos
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // URL base da API
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

  /**
   * Handler para mensagens SSE
   * Parseia eventos e atualiza estado conforme o tipo
   */
  const handleSSEMessage = (event: MessageEvent) => {
    try {
      console.log('[WhatsAppConnectionModal] Evento SSE recebido:', event.type, event.data);
      
      const parsedData = JSON.parse(event.data);
      const eventType = event.type; // 'qrcode', 'status', 'error', ou 'message'

      // Se for evento 'message' genérico, tentar extrair tipo do data
      const type = eventType !== 'message' ? eventType : parsedData.type;

      console.log('[WhatsAppConnectionModal] Tipo do evento:', type, 'Data:', parsedData);

      switch (type) {
        case 'qrcode':
          // Atualizar QR code
          if (parsedData.qrcode) {
            console.log('[WhatsAppConnectionModal] QR Code recebido, atualizando estado');
            setConnectionState(prev => ({
              ...prev,
              status: 'connecting',
              qrCode: parsedData.qrcode,
              error: null,
            }));
            
            // Limpar timeout anterior se existir
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            
            // Configurar timeout de 5 minutos (300000ms)
            console.log('[WhatsAppConnectionModal] Iniciando timeout de 5 minutos');
            timeoutRef.current = setTimeout(() => {
              console.log('[WhatsAppConnectionModal] Timeout de 5 minutos atingido');
              setConnectionState({
                status: 'error',
                qrCode: null,
                error: 'Tempo limite de 5 minutos excedido. Por favor, tente novamente.',
              });
              setShouldConnectSSE(false);
            }, 300000); // 5 minutos
          }
          break;

        case 'status':
          // Atualizar status de conexão
          if (parsedData.connected === true) {
            console.log('[WhatsAppConnectionModal] WhatsApp conectado!');
            
            // Limpar timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            setConnectionState({
              status: 'connected',
              qrCode: null,
              error: null,
            });
            // Fechar modal após conexão bem-sucedida
            setTimeout(() => {
              onClose();
            }, 1500);
          } else if (parsedData.connected === false && parsedData.status !== 'connecting') {
            // Só mostrar erro se não for status intermediário "connecting"
            // O status "connecting" é normal e esperado enquanto aguarda scan do QR
            console.log('[WhatsAppConnectionModal] Status intermediário ignorado:', parsedData.status);
          }
          break;

        case 'error':
          // Atualizar estado de erro
          console.log('[WhatsAppConnectionModal] Erro recebido:', parsedData.message);
          setConnectionState({
            status: 'error',
            qrCode: null,
            error: parsedData.message || 'Erro desconhecido',
          });
          break;
      }
    } catch (error) {
      console.error('[WhatsAppConnectionModal] Erro ao parsear evento SSE:', error);
    }
  };

  /**
   * Handler para erros SSE
   */
  const handleSSEError = (error: Event) => {
    console.error('[WhatsAppConnectionModal] Erro SSE:', error);
    // Não atualizar estado aqui pois o useSSE já tenta reconectar
  };

  // Integrar hook useSSE com sessionId
  const { close: closeSSE } = useSSE({
    url: `${API_URL}/whatsapp/connect/stream?sessionId=${sessionId}`,
    onMessage: handleSSEMessage,
    onError: handleSSEError,
    enabled: shouldConnectSSE,
  });

  // Limpar SSE e timeout quando modal fechar
  useEffect(() => {
    if (!open) {
      setShouldConnectSSE(false);
      closeSSE();
      
      // Limpar timeout se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [open, closeSSE]);
  
  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Inicia o processo de conexão com WhatsApp
   * Chama POST /api/v1/whatsapp/connect e atualiza status para 'connecting'
   */
  const handleConnect = async () => {
    try {
      // Atualizar status para connecting
      setConnectionState({
        status: 'connecting',
        qrCode: null,
        error: null,
      });

      // Chamar API para iniciar conexão com sessionId
      console.log('[WhatsAppConnectionModal] Iniciando conexão com sessionId:', sessionId);
      const response = await api.post('/whatsapp/connect', { sessionId });
      
      console.log('[WhatsAppConnectionModal] Conexão iniciada:', response.data);
      
      // Ativar conexão SSE para receber eventos em tempo real
      setShouldConnectSSE(true);
      
    } catch (error: any) {
      console.error('[WhatsAppConnectionModal] Erro ao conectar:', error);
      
      // Atualizar estado para erro
      setConnectionState({
        status: 'error',
        qrCode: null,
        error: error.response?.data?.message || error.message || 'Erro ao conectar com servidor',
      });
    }
  };

  /**
   * Tenta novamente a conexão
   * Limpa o estado e reinicia o processo
   */
  const handleRetry = () => {
    // Fechar conexão SSE anterior se existir
    closeSSE();
    setShouldConnectSSE(false);

    // Limpar estado
    setConnectionState({
      status: 'idle',
      qrCode: null,
      error: null,
    });

    // Iniciar nova conexão
    setTimeout(() => {
      handleConnect();
    }, 100);
  };

  return (
    <ConfigurableModal
      open={open}
      config={whatsAppModalConfig}
      onClose={onClose}
    >
      <div className="flex flex-col h-full p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className={`${whatsAppModalConfig.font?.title?.size} ${whatsAppModalConfig.font?.title?.color} ${whatsAppModalConfig.font?.title?.family} font-bold mb-2`}>
            Conectar WhatsApp
          </h2>
          <p className={`${whatsAppModalConfig.font?.text?.size} ${whatsAppModalConfig.font?.text?.color} ${whatsAppModalConfig.font?.text?.family}`}>
            Conecte sua conta WhatsApp para começar a usar o sistema
          </p>
        </div>

        {/* Content - UI condicional baseada em status */}
        <div className="flex-1 flex items-center justify-center">
          {connectionState.status === 'idle' && (
            <div className="text-center">
              <p className={`${whatsAppModalConfig.font?.text?.size} ${whatsAppModalConfig.font?.text?.color} mb-4`}>
                Clique no botão abaixo para iniciar a conexão
              </p>
              <button
                onClick={handleConnect}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Conectar WhatsApp
              </button>
            </div>
          )}

          {connectionState.status === 'connecting' && (
            <div className="text-center">
              {connectionState.qrCode ? (
                // Exibir QR code
                <div className="flex flex-col items-center">
                  <p className={`${whatsAppModalConfig.font?.text?.size} ${whatsAppModalConfig.font?.text?.color} mb-4`}>
                    Escaneie o QR Code com seu WhatsApp
                  </p>
                  <div className="bg-white p-4 rounded-lg shadow-lg">
                    <img
                      src={connectionState.qrCode.startsWith('data:') ? connectionState.qrCode : `data:image/png;base64,${connectionState.qrCode}`}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64 md:w-80 md:h-80 object-contain"
                    />
                  </div>
                  <p className={`${whatsAppModalConfig.font?.text?.size} ${whatsAppModalConfig.font?.text?.color} mt-4 text-sm`}>
                    Abra o WhatsApp no seu celular e escaneie este código
                  </p>
                </div>
              ) : (
                // Loading spinner enquanto aguarda QR code
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mb-4"></div>
                  <p className={`${whatsAppModalConfig.font?.text?.size} ${whatsAppModalConfig.font?.text?.color}`}>
                    Gerando QR Code...
                  </p>
                </div>
              )}
            </div>
          )}

          {connectionState.status === 'connected' && (
            <div className="text-center">
              <p className={`${whatsAppModalConfig.font?.text?.size} ${whatsAppModalConfig.font?.text?.color}`}>
                Conectado com sucesso!
              </p>
            </div>
          )}

          {connectionState.status === 'error' && (
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="w-16 h-16 mx-auto text-red-600 dark:text-red-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className={`${whatsAppModalConfig.font?.text?.size} text-red-600 dark:text-red-400 font-semibold mb-2`}>
                  Erro ao Conectar
                </p>
                <p className={`${whatsAppModalConfig.font?.text?.size} ${whatsAppModalConfig.font?.text?.color}`}>
                  {connectionState.error || 'Erro ao conectar'}
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </ConfigurableModal>
  );
};

export default WhatsAppConnectionModal;
