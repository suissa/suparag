import React from 'react';
import { motion } from 'framer-motion';

interface SeveritySelectorProps {
  onSelect: (severity: 'baixa' | 'media' | 'muito') => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SeveritySelector: React.FC<SeveritySelectorProps> = ({
  onSelect,
  onCancel,
  isLoading = false
}) => {
  const severityOptions = [
    {
      key: 'baixa' as const,
      label: 'Baixa',
      description: 'Erro menor, resposta ainda útil',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      icon: '⚠️'
    },
    {
      key: 'media' as const,
      label: 'Média',
      description: 'Erro significativo, resposta problemática',
      color: 'bg-orange-600 hover:bg-orange-700',
      icon: '🚨'
    },
    {
      key: 'muito' as const,
      label: 'Muito Alta',
      description: 'Erro grave, resposta perigosa ou incorreta',
      color: 'bg-red-600 hover:bg-red-700',
      icon: '🚫'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex space-x-2"
    >
      {severityOptions.map((option) => (
        <motion.button
          key={option.key}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(option.key)}
          disabled={isLoading}
          className={`
            flex-1 px-4 py-3 rounded-lg text-white font-medium text-sm
            transition-all duration-200 ${option.color}
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white
          `}
          title={option.description}
        >
          <div className="flex flex-col items-center space-y-1">
            <span className="text-lg">{option.icon}</span>
            <span className="font-semibold">{option.label}</span>
            <span className="text-xs opacity-90 text-center leading-tight">
              {option.description.split(',')[0]}
            </span>
          </div>
        </motion.button>
      ))}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCancel}
        disabled={isLoading}
        className="
          px-4 py-3 rounded-lg text-gray-300 font-medium text-sm
          bg-gray-700 hover:bg-gray-600 transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500
        "
      >
        <div className="flex flex-col items-center space-y-1">
          <span className="text-lg">↩️</span>
          <span className="font-semibold">Cancelar</span>
        </div>
      </motion.button>
    </motion.div>
  );
};