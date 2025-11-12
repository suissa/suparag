import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Interaction } from '../services/supabaseClient';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const useInteractions = (customerId?: string) => {
  return useQuery({
    queryKey: ['interactions', customerId],
    queryFn: async () => {
      let query = supabase
        .from('interactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Interaction[];
    },
  });
};

export const useCreateInteraction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (interaction: Omit<Interaction, 'id' | 'created_at'>) => {
      const response = await axios.post(`${API_URL}/interactions`, interaction);
      return response.data.data.interaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
  });
};

export const useDeleteInteraction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/interactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
  });
};
