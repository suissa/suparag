import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY devem estar definidos no .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos para a tabela documents
export interface Document {
  id?: string;
  title: string;
  content: string;
  metadata: {
    filename: string;
    type: string;
    size: number;
    characterCount: number;
  };
  created_at?: string;
  updated_at?: string;
}
