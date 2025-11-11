import { useEffect, useRef, useState } from 'react';

/**
 * Opções de configuração para o hook useSSE
 */
export interface UseSSEOptions {
  /** URL do endpoint SSE */
  url: string;
  /** Callback chamado quando uma mensagem é recebida */
  onMessage: (event: MessageEvent) => void;
  /** Callback opcional chamado quando ocorre um erro */
  onError?: (error: Event) => void;
  /** Se true, a conexão SSE será estabelecida */
  enabled: boolean;
}

/**
 * Retorno do hook useSSE
 */
export interface UseSSEReturn {
  /** Indica se a conexão SSE está ativa */
  isConnected: boolean;
  /** Função para fechar manualmente a conexão */
  close: () => void;
}

/**
 * Custom hook para gerenciar conexões Server-Sent Events (SSE)
 * com reconexão automática e backoff exponencial
 * 
 * @param options - Configurações do hook
 * @returns Objeto com estado de conexão e função de fechamento
 */
export function useSSE(options: UseSSEOptions): UseSSEReturn {
  const { url, onMessage, onError, enabled } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isManualCloseRef = useRef(false);

  // Constantes para reconexão
  const MAX_RECONNECT_ATTEMPTS = 10;
  const BASE_DELAY = 1000; // 1 segundo
  const MAX_DELAY = 30000; // 30 segundos

  /**
   * Calcula o delay de reconexão usando backoff exponencial
   * Fórmula: min(BASE_DELAY * 2^attempts, MAX_DELAY)
   */
  const getReconnectDelay = (attempts: number): number => {
    const delay = BASE_DELAY * Math.pow(2, attempts);
    return Math.min(delay, MAX_DELAY);
  };

  /**
   * Fecha a conexão SSE e limpa recursos
   */
  const close = () => {
    isManualCloseRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setReconnectAttempts(0);
  };

  /**
   * Tenta reconectar após um erro
   */
  const scheduleReconnect = () => {
    if (isManualCloseRef.current) {
      return;
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[useSSE] Máximo de tentativas de reconexão atingido');
      setIsConnected(false);
      return;
    }

    const delay = getReconnectDelay(reconnectAttempts);
    console.log(`[useSSE] Reconectando em ${delay}ms (tentativa ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
    }, delay);
  };

  /**
   * Cria e configura a conexão EventSource
   */
  const connect = () => {
    if (!enabled || isManualCloseRef.current) {
      return;
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Listener para evento 'open' - conexão estabelecida
      eventSource.addEventListener('open', () => {
        console.log('[useSSE] Conexão estabelecida');
        setIsConnected(true);
        setReconnectAttempts(0); // Reset tentativas após sucesso
      });

      // Listener para evento 'message' - mensagem recebida
      eventSource.addEventListener('message', (event: MessageEvent) => {
        onMessage(event);
      });

      // Listener para evento 'error' - erro na conexão
      eventSource.addEventListener('error', (error: Event) => {
        console.error('[useSSE] Erro na conexão:', error);
        setIsConnected(false);

        // Chama callback de erro se fornecido
        if (onError) {
          onError(error);
        }

        // Fecha a conexão atual
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Agenda reconexão automática
        scheduleReconnect();
      });

    } catch (error) {
      console.error('[useSSE] Erro ao criar EventSource:', error);
      setIsConnected(false);
      scheduleReconnect();
    }
  };

  // Effect principal: gerencia lifecycle da conexão
  useEffect(() => {
    isManualCloseRef.current = false;

    if (enabled) {
      connect();
    }

    // Cleanup: fecha conexão ao desmontar ou quando enabled=false
    return () => {
      close();
    };
  }, [url, enabled, reconnectAttempts]); // Reconecta quando reconnectAttempts muda

  return {
    isConnected,
    close,
  };
}
