import { useState, useEffect } from 'react';
import GenericModal from './GenericModal';
import { whatsAppModalConfig } from './specs/WhatsAppModal.spec';
import { X, Smartphone, RefreshCw } from 'lucide-react';

interface WhatsAppModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WhatsAppModal({ open, onClose }: WhatsAppModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'waiting' | 'connected' | 'error'>('connecting');
  const [message, setMessage] = useState('Iniciando conexão...');

  useEffect(() => {
    if (!open) return;

    // Conectar ao SSE para receber QR Code
    const eventSource = new EventSource('http://localhost:4000/api/v1/whatsapp/connect');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'qrcode') {
        setQrCode(data.qrCode);
        setStatus('waiting');
        setMessage('Escaneie o QR Code com seu WhatsApp');
      } else if (data.type === 'connected') {
        setStatus('connected');
        setMessage('WhatsApp conectado com sucesso!');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else if (data.type === 'timeout') {
        setStatus('error');
        setMessage('Tempo esgotado. Tente novamente.');
      } else if (data.type === 'error') {
        setStatus('error');
        setMessage(data.message || 'Erro ao conectar');
      }
    };

    eventSource.onerror = () => {
      setStatus('error');
      setMessage('Erro de conexão com o servidor');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [open, onClose]);

  const handleRetry = () => {
    setStatus('connecting');
    setMessage('Iniciando conexão...');
    setQrCode(null);
    // Recarregar o componente
    window.location.reload();
  };

  return (
    <GenericModal open={open} onClose={onClose} config={whatsAppModalConfig}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <Smartphone className="text-white" size={24} />
            </div>
            <div>
              <h2 className={`${whatsAppModalConfig.font?.title?.size} ${whatsAppModalConfig.font?.title?.color} font-bold`}>
                Conectar WhatsApp
              </h2>
              <p className={`${whatsAppModalConfig.font?.text?.size} ${whatsAppModalConfig.font?.text?.color}`}>
                {message}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="text-gray-500 dark:text-gray-400" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          {status === 'connecting' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
              <p className={`${whatsAppModalConfig.font?.text?.color} ${whatsAppModalConfig.font?.text?.size}`}>
                Gerando QR Code...
              </p>
            </div>
          )}

          {status === 'waiting' && qrCode && (
            <div className="text-center">
              <div className="bg-white p-4 rounded-xl shadow-lg inline-block mb-4">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
              <div className="space-y-2">
                <p className={`${whatsAppModalConfig.font?.title?.color} font-semibold`}>
                  Escaneie o QR Code
                </p>
                <ol className={`${whatsAppModalConfig.font?.text?.color} text-sm text-left max-w-md mx-auto space-y-1`}>
                  <li>1. Abra o WhatsApp no seu celular</li>
                  <li>2. Toque em Menu ou Configurações</li>
                  <li>3. Toque em Aparelhos conectados</li>
                  <li>4. Toque em Conectar um aparelho</li>
                  <li>5. Aponte seu celular para esta tela</li>
                </ol>
              </div>
            </div>
          )}

          {status === 'connected' && (
            <div className="text-center">
              <div className="bg-green-500 p-4 rounded-full inline-block mb-4">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className={`${whatsAppModalConfig.font?.title?.color} ${whatsAppModalConfig.font?.title?.size} font-bold`}>
                Conectado!
              </p>
              <p className={`${whatsAppModalConfig.font?.text?.color} mt-2`}>
                Seu WhatsApp está conectado e pronto para uso
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="bg-red-500 p-4 rounded-full inline-block mb-4">
                <X className="text-white" size={48} />
              </div>
              <p className={`${whatsAppModalConfig.font?.title?.color} ${whatsAppModalConfig.font?.title?.size} font-bold mb-2`}>
                Erro na Conexão
              </p>
              <p className={`${whatsAppModalConfig.font?.text?.color} mb-4`}>
                {message}
              </p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 mx-auto"
              >
                <RefreshCw size={18} />
                Tentar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <p className={`${whatsAppModalConfig.font?.text?.color} text-sm text-center`}>
            Sua conexão é segura e criptografada de ponta a ponta
          </p>
        </div>
      </div>
    </GenericModal>
  );
}
