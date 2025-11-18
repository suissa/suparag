import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
console.log('process.env:', process.env);
const supabaseKey =
  process.env.SERVICE_ROLE_KEY;
  // process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e uma chave (SERVICE_ROLE_KEY/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY ou SUPABASE_ANON_KEY) devem estar definidos nas variáveis de ambiente (.env).');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Tipos para a tabela rag_documents
export interface RagDocument {
  id?: string;
  title: string;
  content: string;
  embedding?: number[]; // Vector para busca semântica
  source?: string;
  metadata?: {
    filename?: string;
    type?: string;
    size?: number;
    characterCount?: number;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}