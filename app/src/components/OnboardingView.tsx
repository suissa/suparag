import { motion } from 'framer-motion';
import { Button } from './Button';

interface OnboardingViewProps {
  onConnect: () => void;
}

export function OnboardingView({ onConnect }: OnboardingViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-center max-w-2xl"
      >
        {/* Ícone decorativo com animação spring */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-5xl">
              contacts
            </span>
          </div>
        </motion.div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Bem-vindo ao NeuroPgRag
        </h1>

        {/* Descrição */}
        <p className="text-lg text-white/70 mb-8">
          Conecte seu WhatsApp para importar seus contatos e começar a visualizar métricas detalhadas sobre suas interações.
        </p>

        {/* Botão de importação com hover e tap effects */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            icon="cloud_download"
            onClick={onConnect}
            className="text-lg px-8 py-4"
          >
            Importar Contatos e Visualizar Métricas
          </Button>
        </motion.div>

        {/* Informação adicional */}
        <p className="text-sm text-white/50 mt-6">
          Você precisará escanear um QR code com seu WhatsApp
        </p>
      </motion.div>
    </motion.div>
  );
}
