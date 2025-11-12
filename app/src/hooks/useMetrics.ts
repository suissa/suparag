import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';

export interface Metrics {
  totalCustomers: number;
  openTickets: number;
  avgChurnRisk: number;
  avgSentiment: number;
  ticketsByStatus: Record<string, number>;
  interactionsByChannel: Record<string, number>;
}

export const useMetrics = () => {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      // Buscar dados de todas as tabelas
      const [customersRes, ticketsRes, interactionsRes] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('tickets').select('*'),
        supabase.from('interactions').select('*'),
      ]);

      if (customersRes.error) throw customersRes.error;
      if (ticketsRes.error) throw ticketsRes.error;
      if (interactionsRes.error) throw interactionsRes.error;

      const customers = customersRes.data || [];
      const tickets = ticketsRes.data || [];
      const interactions = interactionsRes.data || [];

      // Calcular métricas
      const totalCustomers = customers.length;
      const openTickets = tickets.filter(t => t.status === 'open').length;
      
      const avgChurnRisk = customers.length > 0
        ? customers.reduce((sum, c) => sum + (c.churn_risk || 0), 0) / customers.length
        : 0;
      
      const avgSentiment = interactions.length > 0
        ? interactions.reduce((sum, i) => sum + (i.sentiment || 0), 0) / interactions.length
        : 0;

      // Tickets por status
      const ticketsByStatus = tickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Interações por canal
      const interactionsByChannel = interactions.reduce((acc, interaction) => {
        acc[interaction.channel] = (acc[interaction.channel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalCustomers,
        openTickets,
        avgChurnRisk,
        avgSentiment,
        ticketsByStatus,
        interactionsByChannel,
      } as Metrics;
    },
  });
};
