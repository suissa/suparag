import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluationsAPI } from '../services/api';

interface UsedSources {
  document_id?: string;
  chunk_ids?: string[];
  context?: string;
}

export interface Evaluation {
  id: string;
  interaction_id: string;
  question_text: string;
  answer_text: string;
  used_sources?: UsedSources | null;
  rating: 'aprovado' | 'incorreto';
  severity?: 'baixa' | 'media' | 'muito' | null;
  notes?: string | null;
  flag_id?: string | null;
  created_at: string;
}

interface EvaluationFilters {
  rating?: string;
  severity?: string;
  limit?: number;
  interaction_id?: string;
}

interface EvaluationStats {
  total_evaluations: number;
  approved_count: number;
  incorrect_count: number;
  approval_rate: number;
  severity_distribution: {
    baixa: number;
    media: number;
    muito: number;
  };
  quality_counters: {
    total_baixa: number;
    total_media: number;
    total_muito: number;
  };
  last_evaluation?: string;
}

// API calls
const fetchEvaluations = async (filters: EvaluationFilters = {}) => {
  const params: any = {};

  if (filters.rating) params.rating = filters.rating;
  if (filters.severity) params.severity = filters.severity;
  if (filters.limit) params.limit = filters.limit;
  if (filters.interaction_id) params.interaction_id = filters.interaction_id;

  const response = await evaluationsAPI.list(params);
  return (response.data.data || []) as Evaluation[];
};

const fetchEvaluationStats = async () => {
  const response = await evaluationsAPI.getStats();
  return response.data.data as EvaluationStats;
};

const createEvaluation = async (evaluationData: {
  interaction_id: string;
  question_text: string;
  answer_text: string;
  used_sources?: UsedSources;
  rating: 'aprovado' | 'incorreto';
  severity?: 'baixa' | 'media' | 'muito';
  notes?: string;
}) => {
  const response = await evaluationsAPI.create(evaluationData);
  return response.data.data;
};

// React Query hooks
export const useEvaluations = (filters: EvaluationFilters = {}) => {
  return useQuery<Evaluation[]>({
    queryKey: ['evaluations', filters],
    queryFn: () => fetchEvaluations(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useEvaluationStats = () => {
  return useQuery({
    queryKey: ['evaluation-stats'],
    queryFn: fetchEvaluationStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useCreateEvaluation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvaluation,
    onSuccess: (data) => {
      // Invalidate and refetch evaluations
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-stats'] });

      // Invalidate semantic flags if a flag was created
      if (data.flag_created) {
        queryClient.invalidateQueries({ queryKey: ['semantic-flags'] });
      }

      // Show success message (could be handled by the component)
      console.log('Avaliação criada com sucesso:', data);
    },
    onError: (error) => {
      console.error('Erro ao criar avaliação:', error);
      // Error handling could be done in the component
    },
  });
};

// Utility hook for evaluation operations
export const useEvaluationOperations = () => {
  const createEvaluationMutation = useCreateEvaluation();

  const submitEvaluation = async (evaluationData: Parameters<typeof createEvaluation>[0]) => {
    return createEvaluationMutation.mutateAsync(evaluationData);
  };

  return {
    submitEvaluation,
    isSubmitting: createEvaluationMutation.isPending,
    error: createEvaluationMutation.error,
  };
};
