import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalConfig } from './specs/WhatsAppModal.spec';

interface GenericModalProps {
  open: boolean;
  onClose: () => void;
  config: ModalConfig;
  children: React.ReactNode;
}

export default function GenericModal({ open, onClose, config, children }: GenericModalProps) {
  const {
    bg = { color: 'bg-white/70 dark:bg-slate-900/70' },
    size = {},
    overlay = {},
    behavior = {},
  } = config;

  const {
    width = 'w-screen',
    height = 'h-screen',
    mdWidth = 'md:w-[70%]',
    mdHeight = 'md:h-[80%]',
    maxWidth = 'max-w-7xl',
    maxHeight = 'max-h-[80%]',
  } = size;

  const {
    color: overlayColor = 'bg-black/50',
    blur = 'backdrop-blur-md',
    visible = true,
    clickClose = true,
  } = overlay;

  const {
    enterAnimation = {
      start: { scale: 0.9, opacity: 0 },
      finish: { scale: 1, opacity: 1, time: 300 },
    },
    exitAnimation = {
      start: { scale: 1, opacity: 1 },
      finish: { scale: 0.9, opacity: 0, time: 200 },
    },
    escClose = true,
  } = behavior;

  // Handle ESC key
  useEffect(() => {
    if (!escClose || !open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, escClose, onClose]);

  const handleOverlayClick = () => {
    if (clickClose) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          {visible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`absolute inset-0 ${overlayColor} ${blur}`}
              onClick={handleOverlayClick}
            />
          )}

          {/* Modal Content */}
          <motion.div
            initial={{
              scale: enterAnimation.start?.scale || 0.9,
              opacity: enterAnimation.start?.opacity || 0,
            }}
            animate={{
              scale: enterAnimation.finish?.scale || 1,
              opacity: enterAnimation.finish?.opacity || 1,
            }}
            exit={{
              scale: exitAnimation.finish?.scale || 0.9,
              opacity: exitAnimation.finish?.opacity || 0,
            }}
            transition={{
              duration: (enterAnimation.finish?.time || 300) / 1000,
            }}
            className={`relative ${bg.color || bg.gradient} ${width} ${height} ${mdWidth} ${mdHeight} ${maxWidth} ${maxHeight} rounded-xl shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
