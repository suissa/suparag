import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { Button } from './Button';
import { SeveritySelector } from './SeveritySelector';

interface EvaluationCardProps {
  evaluation: {
    interaction_id: string;
    question_text: string;
    answer_text: string;
    used_sources?: any;
  };
  onIncorrect: (severity: 'baixa' | 'media' | 'muito') => void;
  isLoading?: boolean;
}

export const EvaluationCard: React.FC<EvaluationCardProps> = ({
  evaluation,
  onIncorrect,
  isLoading = false
}) => {
  const [showSeveritySelector, setShowSeveritySelector] = useState(false);

  const handleIncorrectClick = () => {
    setShowSeveritySelector(true);
  };

  const handleSeveritySelect = (severity: 'baixa' | 'media' | 'muito') => {
    onIncorrect(severity);
    setShowSeveritySelector(false);
  };

  const handleCancel = () => {
    setShowSeveritySelector(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Question */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                Q
              </span>
              Pergunta
            </h3>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-300 leading-relaxed">
                {evaluation.question_text}
              </p>
            </div>
          </div>

          {/* Answer */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <span className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                A
              </span>
              Resposta do Sistema
            </h3>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-300 leading-relaxed">
                {evaluation.answer_text}
              </p>
            </div>
          </div>

          {/* Sources (if available) */}
          {evaluation.used_sources && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  📚
                </span>
                Fontes Utilizadas
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 space-y-2">
                  <div>
                    <span className="font-medium text-gray-300">Documento:</span>{' '}
                    {evaluation.used_sources.document_id}
                  </div>
                  {evaluation.used_sources.chunk_ids && (
                    <div>
                      <span className="font-medium text-gray-300">Chunks:</span>{' '}
                      {evaluation.used_sources.chunk_ids.join(', ')}
                    </div>
                  )}
                  {evaluation.used_sources.context && (
                    <div>
                      <span className="font-medium text-gray-300">Contexto:</span>{' '}
                      <span className="text-gray-300 italic">
                        "{evaluation.used_sources.context.substring(0, 150)}..."
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Esta resposta está correta?
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  className="px-8"
                >
                  ✅ Correta
                </Button>

                {!showSeveritySelector ? (
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={handleIncorrectClick}
                    disabled={isLoading}
                    className="px-8"
                  >
                    ❌ Errada
                  </Button>
                ) : (
                  <SeveritySelector
                    onSelect={handleSeveritySelect}
                    onCancel={handleCancel}
                    isLoading={isLoading}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

