import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { semanticFlagsAPI } from '../services/api';

interface UsedSources {
  document_id?: string;
  chunk_ids?: string[];
  context?: string;
}

export interface SemanticFlag {
  id: string;
  question_text: string;
  answer_text: string;
  flag_reason: string;
  status: 'pendente' | 'aprovado' | 'eliminado';
  created_at: string;
  resolved_at?: string | null;
  used_sources?: UsedSources | null;
  disapproval_counters?: {
    baixa?: number;
    media?: number;
    muito?: number;
  };
}

interface SemanticFlagFilters {
  status?: string;
}

interface SemanticFlagStats {
  total_flags: number;
  resolved_flags: number;
  resolution_rate: number;
  status_distribution: {
    pendente: number;
    aprovado: number;
    eliminado: number;
  };
  reason_distribution: Record<string, number>;
  recent_flags: any[];
}

// API calls
const fetchSemanticFlags = async (filters: SemanticFlagFilters = {}) => {
  const params: any = {};

  if (filters.status) params.status = filters.status;

  const response = await semanticFlagsAPI.list(params);
  return (response.data.data || []) as SemanticFlag[];
};

const fetchSemanticFlagStats = async () => {
  const response = await semanticFlagsAPI.getStats();
  return response.data.data as SemanticFlagStats;
};

const updateSemanticFlagStatus = async (flagId: string, status: 'pendente' | 'aprovado' | 'eliminado') => {
  const response = await semanticFlagsAPI.updateStatus(flagId, { status });
  return response.data.data;
};

// const deleteSemanticFlag = async (flagId: string) => {
//   const response = await semanticFlagsAPI.removeById(flagId);
//   return response.data.data || null;
// };

// React Query hooks
export const useSemanticFlags = (filters: SemanticFlagFilters = {}) => {
  return useQuery<SemanticFlag[]>({
    queryKey: ['semantic-flags', filters],
    queryFn: () => fetchSemanticFlags(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useSemanticFlagStats = () => {
  return useQuery({
    queryKey: ['semantic-flag-stats'],
    queryFn: fetchSemanticFlagStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useUpdateSemanticFlagStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flagId, status }: { flagId: string; status: 'pendente' | 'aprovado' | 'eliminado' }) =>
      updateSemanticFlagStatus(flagId, status),
    onSuccess: (data, variables) => {
      // Invalidate and refetch semantic flags
      queryClient.invalidateQueries({ queryKey: ['semantic-flags'] });
      queryClient.invalidateQueries({ queryKey: ['semantic-flag-stats'] });

      // Show success message
      console.log(`Flag ${variables.flagId} atualizada para ${variables.status}:`, data);
    },
    onError: (error) => {
      console.error('Erro ao atualizar status da flag:', error);
    },
  });
};

// export const useDeleteSemanticFlag = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: deleteSemanticFlag,
//     onSuccess: (_: any, flagId: string) => {
//       // Invalidate and refetch semantic flags
//       queryClient.invalidateQueries({ queryKey: ['semantic-flags'] });
//       queryClient.invalidateQueries({ queryKey: ['semantic-flag-stats'] });

//       console.log(`Flag ${flagId} deletada com sucesso`);
//     },
//     onError: (error) => {
//       console.error('Erro ao deletar flag:', error);
//     },
//   });
// };

// Utility hook for semantic flag operations
export const useSemanticFlagOperations = () => {
  const updateStatusMutation = useUpdateSemanticFlagStatus();

  const updateFlagStatus = async (flagId: string, status: 'pendente' | 'aprovado' | 'eliminado') => {
    return updateStatusMutation.mutateAsync({ flagId, status });
  };

  return {
    updateFlagStatus,
    isUpdating: updateStatusMutation.isPending,
    updateError: updateStatusMutation.error,
  };
};
