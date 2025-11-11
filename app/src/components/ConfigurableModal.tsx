import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ModalConfig } from '../types/modal.types';

/**
 * Props do componente ConfigurableModal
 */
export interface ConfigurableModalProps {
  /** Controla a visibilidade do modal */
  open: boolean;
  /** Configuração de aparência e comportamento */
  config: ModalConfig;
  /** Callback chamado quando o modal deve fechar */
  onClose: () => void;
  /** Conteúdo a ser exibido dentro do modal */
  children: React.ReactNode;
}

/**
 * Componente modal genérico e configurável com animações Framer Motion
 * Suporta temas claro/escuro e é totalmente personalizável via config
 */
export const ConfigurableModal: React.FC<ConfigurableModalProps> = ({
  open,
  config,
  onClose,
  children,
}) => {
  // Listener para tecla ESC
  useEffect(() => {
    const escClose = config.behavior?.escClose ?? true;
    
    if (!escClose || !open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [config.behavior?.escClose, onClose, open]);

  // Construir classes CSS do modal dinamicamente
  const modalClasses = [
    // Background
    config.bg?.color || 'bg-white/95 dark:bg-slate-900/95',
    config.bg?.gradient,
    
    // Size - mobile first
    config.size?.width || 'w-screen',
    config.size?.height || 'h-screen',
    
    // Size - breakpoint md
    config.size?.mdWidth || 'md:w-[70%]',
    config.size?.mdHeight || 'md:h-[80%]',
    
    // Max sizes
    config.size?.maxWidth || 'max-w-2xl',
    config.size?.maxHeight || 'max-h-[90vh]',
    
    // Base styles
    'rounded-lg shadow-2xl overflow-hidden relative z-50',
  ]
    .filter(Boolean)
    .join(' ');

  // Construir classes CSS do overlay
  const overlayClasses = [
    config.overlay?.color || 'bg-black/50',
    config.overlay?.blur || 'backdrop-blur-md',
    'fixed inset-0 z-40',
  ]
    .filter(Boolean)
    .join(' ');

  // Configuração de animação de entrada
  const enterAnimation = config.behavior?.enterAnimation || {
    start: { scale: 0.9, opacity: 0 },
    finish: { scale: 1, opacity: 1, time: 300 },
  };

  // Configuração de animação de saída
  const exitAnimation = config.behavior?.exitAnimation || {
    finish: { scale: 0.9, opacity: 0, time: 200 },
  };

  // Handler de click no overlay
  const handleOverlayClick = () => {
    const clickClose = config.overlay?.clickClose ?? true;
    if (clickClose) {
      onClose();
    }
  };

  // Prevenir propagação do click no modal
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            className={overlayClasses}
            onClick={handleOverlayClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Modal Content */}
          <motion.div
            className={modalClasses}
            onClick={handleModalClick}
            initial={{
              scale: enterAnimation.start?.scale ?? 0.9,
              opacity: enterAnimation.start?.opacity ?? 0,
            }}
            animate={{
              scale: enterAnimation.finish?.scale ?? 1,
              opacity: enterAnimation.finish?.opacity ?? 1,
            }}
            exit={{
              scale: exitAnimation.finish?.scale ?? 0.9,
              opacity: exitAnimation.finish?.opacity ?? 0,
            }}
            transition={{
              duration: (enterAnimation.finish?.time ?? 300) / 1000,
              ease: 'easeOut',
            }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfigurableModal;
