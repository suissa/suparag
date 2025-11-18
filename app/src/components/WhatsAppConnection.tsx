import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

interface WhatsAppConnectionProps {
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function WhatsAppConnection({ onConnected, onDisconnected }: WhatsAppConnectionProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [message, setMessage] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

  const handleConnect = async () => {
    try {
      setStatus('connecting');
      setMessage('Conectando ao WhatsApp...');

      // 1. Criar instância
      const response = await fetch(`${API_URL}/whatsapp/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar instância');
      }

      const newSessionId = data.sessionId;
      setSessionId(newSessionId);

      // Verificar se já está conectada
      if (data.alreadyConnected) {
        setMessage('✅ WhatsApp já está conectado!');
        setStatus('connected');
        setIsAnimating(true);
        
        // Animação de fade out
        setTimeout(() => {
          setIsAnimating(false);
          setQrCode(null);
          onConnected?.();
        }, 2000);
        
        return;
      }

      setMessage('Aguardando QR Code...');

      // 2. Conectar ao SSE para receber QR code e status
      const eventSource = new EventSource(`${API_URL}/whatsapp/connect/stream?sessionId=${newSessionId}`);

      eventSource.addEventListener('qrcode', (event) => {
        const qrData = JSON.parse(event.data);
        console.log('📱 QR Code recebido:', qrData);
        
        setQrCode(qrData.qrcode);
        setMessage('Escaneie o QR Code com seu WhatsApp');
      });

      eventSource.addEventListener('status', (event) => {
        const statusData = JSON.parse(event.data);
        console.log('📊 Status recebido:', statusData);

        if (statusData.connected) {
          setMessage('✅ WhatsApp conectado com sucesso!');
          setStatus('connected');
          setIsAnimating(true);

          // Animação de fade out do QR code
          setTimeout(() => {
            setIsAnimating(false);
            setQrCode(null);
            eventSource.close();
            onConnected?.();
          }, 2000);
        } else {
          setMessage(`Status: ${statusData.status}`);
        }
      });

      eventSource.addEventListener('error', (event) => {
        const errorData = JSON.parse(event.data);
        console.error('❌ Erro SSE:', errorData);
        
        setMessage(`Erro: ${errorData.message}`);
        setStatus('disconnected');
        setQrCode(null);
        eventSource.close();
      });

      eventSource.onerror = (error) => {
        console.error('❌ Erro na conexão SSE:', error);
        setMessage('Erro na conexão. Tente novamente.');
        setStatus('disconnected');
        setQrCode(null);
        eventSource.close();
      };

    } catch (error: any) {
      console.error('❌ Erro ao conectar:', error);
      setMessage(`Erro: ${error.message}`);
      setStatus('disconnected');
      setQrCode(null);
    }
  };

  const handleDisconnect = async () => {
    if (!sessionId) return;

    try {
      setMessage('Desconectando...');

      const response = await fetch(`${API_URL}/whatsapp/disconnect?sessionId=${sessionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Desconectado com sucesso');
        setStatus('disconnected');
        setSessionId(null);
        setQrCode(null);
        onDisconnected?.();
      } else {
        throw new Error(data.message || 'Erro ao desconectar');
      }

    } catch (error: any) {
      console.error('❌ Erro ao desconectar:', error);
      setMessage(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="bg-[#111c22] rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Conexão WhatsApp</h3>
          <p className="text-white/60 text-sm mt-1">{message}</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${
          status === 'connected' ? 'bg-green-500' : 
          status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
          'bg-red-500'
        }`} />
      </div>

      <AnimatePresence mode="wait">
        {qrCode && (
          <motion.div
            key="qrcode"
            initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            animate={isAnimating ? { 
              opacity: 0, 
              scale: 0.5, 
              filter: 'blur(20px)' 
            } : { 
              opacity: 1, 
              scale: 1, 
              filter: 'blur(0px)' 
            }}
            exit={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="flex justify-center"
          >
            <div className="bg-white p-4 rounded-xl">
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-64 h-64"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4">
        {status === 'disconnected' && (
          <Button 
            variant="primary" 
            onClick={handleConnect}
            className="flex-1"
          >
            <span className="material-symbols-outlined mr-2">qr_code_scanner</span>
            Conectar WhatsApp
          </Button>
        )}

        {status === 'connecting' && (
          <Button 
            variant="secondary" 
            disabled
            className="flex-1"
          >
            <span className="material-symbols-outlined mr-2 animate-spin">sync</span>
            Conectando...
          </Button>
        )}

        {status === 'connected' && (
          <Button 
            variant="danger" 
            onClick={handleDisconnect}
            className="flex-1"
          >
            <span className="material-symbols-outlined mr-2">link_off</span>
            Desconectar
          </Button>
        )}
      </div>

      {status === 'connected' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-green-500 text-2xl">
              check_circle
            </span>
            <div>
              <p className="text-green-500 font-medium">WhatsApp Conectado</p>
              <p className="text-white/60 text-sm">Pronto para enviar e receber mensagens</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
