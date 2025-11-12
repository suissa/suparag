import { config } from 'dotenv';

// Definir NODE_ENV como test antes de carregar variáveis
process.env.NODE_ENV = 'test';

// Carregar variáveis de ambiente para testes
config({ path: '.env' });

// Configurações globais para testes
beforeAll(() => {
  console.log('🧪 Iniciando testes da API CRM...');
});

afterAll(() => {
  console.log('✅ Testes da API CRM finalizados!');
});

// Aumentar timeout para operações com Supabase
jest.setTimeout(30000);
