import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EvaluationCard } from '../../components/EvaluationCard';
import { QualityBar } from '../../components/QualityBar';
import { useEvaluationSubmit } from '../../hooks/useEvaluationSubmit';

const EvaluationLivePage: React.FC = () => {
  const [currentEvaluation, setCurrentEvaluation] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [flagCreated, setFlagCreated] = useState(false);

  const { submitEvaluation, isLoading } = useEvaluationSubmit();

  // Simulação de dados para demonstração
  // Em produção, isso viria do contexto de chat/RAG
  const mockEvaluation = {
    interaction_id: 'mock-interaction-id',
    question_text: 'Como funciona a busca semântica com vetores no PostgreSQL?',
    answer_text: 'A busca semântica utiliza embeddings de vetores para encontrar conteúdo similar baseado no significado, não apenas nas palavras exatas. No PostgreSQL com pgvector, você pode armazenar vetores de alta dimensão e realizar consultas de similaridade usando métricas como cosseno, euclidiana ou produto interno.',
    used_sources: {
      document_id: 'doc-1',
      chunk_ids: ['chunk-1', 'chunk-2'],
      context: 'Vetores são representações numéricas de significado semântico, permitindo comparações matemáticas de similaridade.'
    }
  };

  const handleIncorrectAnswer = async (severity: 'baixa' | 'media' | 'muito') => {
    try {
      const result = await submitEvaluation({
        interaction_id: mockEvaluation.interaction_id,
        question_text: mockEvaluation.question_text,
        answer_text: mockEvaluation.answer_text,
        used_sources: mockEvaluation.used_sources,
        rating: 'incorreto',
        severity,
        notes: `Avaliação ${severity} realizada via interface ao vivo`
      });

      setFlagCreated(result.flag_created);
      setShowSuccess(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setFlagCreated(false);
      }, 3000);

    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      // Em produção, mostrar toast de erro
    }
  };

  const handleNewEvaluation = () => {
    // Em produção, buscar próxima interação do chat
    setCurrentEvaluation(mockEvaluation);
    setShowSuccess(false);
    setFlagCreated(false);
  };

  React.useEffect(() => {
    // Inicializar com uma avaliação de exemplo
    setCurrentEvaluation(mockEvaluation);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Avaliação ao Vivo
          </h1>
          <p className="text-gray-400 text-lg">
            Avalie respostas em tempo real para melhorar a qualidade do sistema
          </p>
        </div>

        {/* Quality Bar - Mostra limiares */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <QualityBar />
        </motion.div>

        {/* Evaluation Card */}
        {currentEvaluation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <EvaluationCard
              evaluation={currentEvaluation}
              onIncorrect={handleIncorrectAnswer}
              isLoading={isLoading}
            />
          </motion.div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-6"
          >
            <Card className={`border-l-4 ${flagCreated ? 'border-l-red-500 bg-red-900/20' : 'border-l-green-500 bg-green-900/20'}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  flagCreated ? 'bg-red-500' : 'bg-green-500'
                }`}>
                  {flagCreated ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className={`font-semibold ${flagCreated ? 'text-red-300' : 'text-green-300'}`}>
                    {flagCreated ? 'Flag Semântica Criada!' : 'Avaliação Registrada!'}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {flagCreated
                      ? 'Uma flag foi criada automaticamente devido aos limiares atingidos.'
                      : 'Obrigado pela avaliação. Isso ajuda a melhorar o sistema.'
                    }
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 text-center"
        >
          <Button
            onClick={handleNewEvaluation}
            variant="outline"
            className="mr-4"
          >
            Nova Avaliação
          </Button>

          <Button
            onClick={() => window.history.back()}
            variant="secondary"
          >
            Voltar
          </Button>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12"
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Como Funciona</h3>
            <div className="grid md:grid-cols-2 gap-6 text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-2">🎯 Avaliação Simples</h4>
                <p className="text-sm">
                  Clique em "ERRADA" apenas se a resposta estiver realmente incorreta ou imprecisa.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">📊 Severidade</h4>
                <p className="text-sm">
                  Escolha a severidade baseada no impacto: baixa (pequeno erro), média (significativo), muito alta (perigoso).
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">🚩 Flags Automáticas</h4>
                <p className="text-sm">
                  Quando limiares são atingidos (1 muito, 3 média, 5 baixa), uma flag é criada automaticamente.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">📈 Melhoria Contínua</h4>
                <p className="text-sm">
                  Suas avaliações ajudam o sistema a aprender e melhorar as respostas automaticamente.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EvaluationLivePage;
