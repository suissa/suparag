import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export type LeadStatus = 'novo' | 'ativo' | 'quente' | 'em_negociacao' | 'convertido' | 'frio';

export interface LeadMetrics {
  customerId: string;
  status: LeadStatus;
  totalMessages: number;
  avgSentiment: number;
  avgResponseTimeSec: number;
  conversationDurationMin: number;
  leadActivityScore: number;
  lastInteractionDays: number;
  conversionProbability: number;
}

export interface AbandonmentPoint {
  gapDays: number;
  lastMessage: string;
  timestamp: string;
  reason: string;
}

export interface ConversionAnalysis {
  probability: number;
  factors: string[];
  recommendation: string;
}

export const useLeadAnalysis = () => {
  return useQuery({
    queryKey: ['leadAnalysis'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/leads/analysis`);
      return response.data.data as LeadMetrics[];
    },
  });
};

export const useLeadMetrics = (customerId: string) => {
  return useQuery({
    queryKey: ['leadMetrics', customerId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/leads/${customerId}/metrics`);
      return response.data.data as LeadMetrics;
    },
    enabled: !!customerId,
  });
};

export const useLeadStatus = (customerId: string) => {
  return useQuery({
    queryKey: ['leadStatus', customerId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/leads/${customerId}/status`);
      return response.data.data.status as LeadStatus;
    },
    enabled: !!customerId,
  });
};

export const useLeadAbandonment = (customerId: string) => {
  return useQuery({
    queryKey: ['leadAbandonment', customerId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/leads/${customerId}/abandonment`);
      return response.data.data as AbandonmentPoint[];
    },
    enabled: !!customerId,
  });
};

export const useLeadConversion = (customerId: string) => {
  return useQuery({
    queryKey: ['leadConversion', customerId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/leads/${customerId}/conversion`);
      return response.data.data as ConversionAnalysis;
    },
    enabled: !!customerId,
  });
};