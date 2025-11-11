import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Interface para tipagem das variáveis de ambiente obrigatórias
 */
interface RequiredEnvVars {
  PORT: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  EVOLUTION_API_URL: string;
  EVOLUTION_API_KEY: string;
}

/**
 * Interface para tipagem das variáveis de ambiente opcionais
 */
interface OptionalEnvVars {
  NODE_ENV?: string;
  OPENROUTER_API_KEY?: string;
  MAX_FILE_SIZE?: string;
  UPLOAD_DIR?: string;
  EVOLUTION_INSTANCE_PREFIX?: string;
  EVOLUTION_CHECK_INTERVAL?: string;
  EVOLUTION_TIMEOUT?: string;
}

/**
 * Valida se todas as variáveis de ambiente obrigatórias estão definidas
 * @throws {Error} Se alguma variável obrigatória estiver faltando
 */
export function validateEnv(): void {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'PORT',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'EVOLUTION_API_URL',
    'EVOLUTION_API_KEY'
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `
❌ Erro: Variáveis de ambiente obrigatórias não encontradas:
${missingVars.map(v => `   - ${v}`).join('\n')}

Por favor, configure estas variáveis no arquivo .env
Consulte o arquivo .env.example para referência.
    `.trim();

    console.error(errorMessage);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

/**
 * Retorna as configurações do ambiente validadas
 */
export const env = {
  // Server
  port: process.env.PORT || '4000',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!
  },
  
  // Evolution API (WhatsApp)
  evolution: {
    apiUrl: process.env.EVOLUTION_API_URL!,
    apiKey: process.env.EVOLUTION_API_KEY!,
    instancePrefix: process.env.EVOLUTION_INSTANCE_PREFIX || 'neuropgrag',
    checkInterval: parseInt(process.env.EVOLUTION_CHECK_INTERVAL || '30000', 10),
    timeout: parseInt(process.env.EVOLUTION_TIMEOUT || '300000', 10)
  },
  
  // OpenRouter
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY
  },
  
  // Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads'
  }
};
