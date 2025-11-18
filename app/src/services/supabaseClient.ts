import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://psvzaedmdamipnygolmw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdnphZWRtZGFtaXBueWdvbG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDk3OTQsImV4cCI6MjA3ODM4NTc5NH0.9em_z2Bmqp0snvHmya8BwW28t6O1CGDe1AVakGBKWqM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Tipos do banco de dados
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  segment?: string;
  total_spent?: number;
  churn_risk?: number;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  customer_id: string;
  channel: 'chat' | 'email' | 'whatsapp' | 'phone';
  message: string;
  sentiment?: number;
  embedding?: number[];
  created_at: string;
}

export interface Ticket {
  id: string;
  customer_id: string;
  subject: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  satisfaction?: number;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RagDocument {
  id: string;
  title: string;
  content: string;
  source?: string;
  section?: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

export interface SearchMatch {
  id: string;
  similarity: number;
  [key: string]: any;
}
