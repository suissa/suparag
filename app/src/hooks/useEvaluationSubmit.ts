import { useState } from 'react';
import { useCreateEvaluation } from './useEvaluations';

export const useEvaluationSubmit = () => {
  const [lastResult, setLastResult] = useState<{
    evaluation_id: string;
    flag_created: boolean;
  } | null>(null);

  const createEvaluationMutation = useCreateEvaluation();

  const submitEvaluation = async (evaluationData: {
    interaction_id: string;
    question_text: string;
    answer_text: string;
    used_sources?: any;
    rating: 'aprovado' | 'incorreto';
    severity?: 'baixa' | 'media' | 'muito';
    notes?: string;
  }) => {
    try {
      const result = await createEvaluationMutation.mutateAsync(evaluationData);
      setLastResult(result);

      return result;
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      throw error;
    }
  };

  const clearLastResult = () => {
    setLastResult(null);
  };

  return {
    submitEvaluation,
    isLoading: createEvaluationMutation.isPending,
    error: createEvaluationMutation.error,
    lastResult,
    clearLastResult,
  };
};
