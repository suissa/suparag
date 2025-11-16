import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import type { RagDocument, SearchMatch } from '../services/supabaseClient';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const useRagDocuments = () => {
  return useQuery({
    queryKey: ['rag-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rag_documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RagDocument[];
    },
  });
};

export const useRagDocument = (id: string) => {
  return useQuery({
    queryKey: ['rag-document', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rag_documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as RagDocument;
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
