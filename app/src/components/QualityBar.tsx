import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';

export const QualityBar: React.FC = () => {
  const thresholds = [
    {
      label: '1× Muito Alta',
      description: 'Cria flag imediatamente',
      count: 1,
      color: 'bg-red-500',
      severity: 'muito'
    },
    {
      label: '3× Média',
      description: 'Cria flag na terceira avaliação',
      count: 3,
      color: 'bg-orange-500',
      severity: 'media'
    },
    {
      label: '5× Baixa',
      description: 'Cria flag na quinta avaliação',
      count: 5,
      color: 'bg-yellow-500',
      severity: 'baixa'
    }
  ];

  return (
    <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Limiares de Qualidade
          </h3>
          <div className="text-sm text-gray-400">
            🚩 Quando atingidos, criam flags semânticas automaticamente
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {thresholds.map((threshold, index) => (
            <motion.div
              key={threshold.severity}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{threshold.label}</span>
                <div className="flex space-x-1">
                  {Array.from({ length: threshold.count }, (_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: (index * 0.1) + (i * 0.05) }}
                      className={`w-3 h-3 rounded-full ${threshold.color} opacity-60`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-gray-400 text-sm">{threshold.description}</p>

              {/* Barra de progresso visual */}
              <div className="mt-3 bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                  className={`h-full rounded-full ${threshold.color} opacity-40`}
                />
              </div>

              <div className="mt-1 text-xs text-gray-500 text-right">
                0 / {threshold.count}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-blue-400 mt-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-blue-300 font-medium mb-1">
                Como Funciona
              </h4>
              <p className="text-blue-200 text-sm leading-relaxed">
                Cada avaliação incorreta incrementa contadores específicos. Quando um limiar é atingido
                para a mesma pergunta/resposta, uma flag semântica é criada automaticamente para
                revisão pela equipe de curadoria.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
