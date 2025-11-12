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
 * Valida se todas as variáveis de ambiente obrigatórias estão definidas
 * @throws {Error} Se alguma variável obrigatória estiver faltando ou inválida
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
  const invalidVars: string[] = [];

  // Validar variáveis obrigatórias
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

  // Validar URLs
  try {
    new URL(process.env.SUPABASE_URL!);
  } catch {
    invalidVars.push('SUPABASE_URL (URL inválida)');
  }

  try {
    new URL(process.env.EVOLUTION_API_URL!);
  } catch {
    invalidVars.push('EVOLUTION_API_URL (URL inválida)');
  }

  // Validar valores numéricos opcionais
  if (process.env.EVOLUTION_CHECK_INTERVAL) {
    const interval = parseInt(process.env.EVOLUTION_CHECK_INTERVAL, 10);
    if (isNaN(interval) || interval < 1000) {
      invalidVars.push('EVOLUTION_CHECK_INTERVAL (deve ser >= 1000ms)');
    }
  }

  if (process.env.EVOLUTION_TIMEOUT) {
    const timeout = parseInt(process.env.EVOLUTION_TIMEOUT, 10);
    if (isNaN(timeout) || timeout < 10000) {
      invalidVars.push('EVOLUTION_TIMEOUT (deve ser >= 10000ms)');
    }
  }

  if (process.env.MAX_FILE_SIZE) {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE, 10);
    if (isNaN(maxSize) || maxSize < 1) {
      invalidVars.push('MAX_FILE_SIZE (deve ser > 0)');
    }
  }

  if (invalidVars.length > 0) {
    const errorMessage = `
❌ Erro: Variáveis de ambiente com valores inválidos:
${invalidVars.map(v => `   - ${v}`).join('\n')}

Por favor, corrija estas variáveis no arquivo .env
Consulte o arquivo .env.example para referência.
    `.trim();

    console.error(errorMessage);
    throw new Error(`Invalid environment variables: ${invalidVars.join(', ')}`);
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
