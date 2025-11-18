import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RagDocument, SearchMatch } from '../services/supabaseClient';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const useRagDocuments = () => {
  return useQuery({
    queryKey: ['rag-documents'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/rag/documents`);
      return response.data.data.documents as RagDocument[];
    },
  });
};

export const useRagDocument = (id: string) => {
  return useQuery({
    queryKey: ['rag-document', id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/rag/documents/${id}`);
      return response.data.data.document as RagDocument;
    },
    enabled: !!id,
  });
};

export const useCreateRagDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (document: Omit<RagDocument, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await axios.post(`${API_URL}/rag/documents`, document);
      return response.data.data.document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rag-documents'] });
    },
  });
};

export const useDeleteRagDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/rag/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rag-documents'] });
    },
  });
};

// Busca semântica
export const useSemanticSearch = () => {
  return useMutation({
    mutationFn: async ({ query, threshold = 0.5, limit = 10 }: { 
      query: string; 
      threshold?: number; 
      limit?: number;
    }) => {
      // Gerar embedding sintético (simplificado para demo)
      const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
      
      const response = await axios.post(`${API_URL}/rag/search/documents`, {
        query,
        embedding,
        threshold,
        limit,
      });
      
      return response.data.data.matches as SearchMatch[];
    },
  });
};
