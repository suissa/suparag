#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { importWhatsAppHistory } from '../src/scripts/importWhatsAppHistory';
import { generateLeadReport } from '../src/reports/leadReport';

// Carregar variáveis de ambiente do diretório raiz do servidor
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Verificar se as variáveis essenciais estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórias');
  console.error('📝 Crie um arquivo .env no diretório server/ com:');
  console.error('   SUPABASE_URL=https://seu-projeto.supabase.co');
  console.error('   SUPABASE_SERVICE_KEY=sua-chave-de-servico');
  process.exit(1);
}

const program = new Command();

program
  .name('whatsapp-import')
  .description('Importa históricos do WhatsApp e gera análises de leads')
  .version('1.0.0');

program
  .command('import')
  .description('Importa históricos do WhatsApp')
  .requiredOption('-p, --path <path>', 'Caminho para a pasta com arquivos JSON')
  .option('-m, --mapping <file>', 'Arquivo JS com função de mapeamento customizada')
  .action(async (options) => {
    try {
      console.log('🚀 Iniciando importação de históricos do WhatsApp...\n');

      // Função de mapeamento padrão
      const defaultMapping = (fields: any) => ({
        phone: fields.phone,
        message: fields.text,
        timestamp: fields.timestamp,
        from: fields.from
      });

      // Carregar função de mapeamento customizada se fornecida
      let mappingFn = defaultMapping;
      if (options.mapping) {
        const mappingPath = path.resolve(process.cwd(), options.mapping);
        const mappingModule = await import(mappingPath);
        mappingFn = mappingModule.default || mappingModule.mapFields;
        console.log(`✅ Função de mapeamento carregada de: ${mappingPath}\n`);
      }

      // Executar importação
      const result = await importWhatsAppHistory(options.path, mappingFn);

      console.log('\n✅ Importação concluída com sucesso!');
      console.log(`📊 Resumo:`);
      console.log(`   - Clientes: ${result.totalCustomers}`);
      console.log(`   - Mensagens: ${result.totalMessages}`);
      console.log(`   - Erros: ${result.errors}`);

    } catch (error) {
      console.error('\n❌ Erro durante a importação:', error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Gera análises e relatórios de leads')
  .option('-o, --output <dir>', 'Diretório de saída para relatórios', 'reports')
  .action(async (options) => {
    try {
      console.log('📊 Gerando análises de leads...\n');

      await generateLeadReport(options.output);

      console.log('\n✅ Análises geradas com sucesso!');
      console.log(`📁 Relatórios salvos em: ${options.output}`);

    } catch (error) {
      console.error('\n❌ Erro ao gerar análises:', error);
      process.exit(1);
    }
  });

program
  .command('full')
  .description('Executa importação completa + análises')
  .requiredOption('-p, --path <path>', 'Caminho para a pasta com arquivos JSON')
  .option('-m, --mapping <file>', 'Arquivo JS com função de mapeamento customizada')
  .option('-o, --output <dir>', 'Diretório de saída para relatórios', 'reports')
  .action(async (options) => {
    try {
      console.log('🚀 Executando pipeline completo...\n');

      // 1. Importação
      console.log('📥 ETAPA 1: Importação de históricos');
      console.log('─'.repeat(50));

      const defaultMapping = (fields: any) => ({
        phone: fields.phone,
        message: fields.text,
        timestamp: fields.timestamp,
        from: fields.from
      });

      let mappingFn = defaultMapping;
      if (options.mapping) {
        const mappingPath = path.resolve(process.cwd(), options.mapping);
        const mappingModule = await import(mappingPath);
        mappingFn = mappingModule.default || mappingModule.mapFields;
      }

      const importResult = await importWhatsAppHistory(options.path, mappingFn);

      console.log('\n✅ Importação concluída!');
      console.log(`   - Clientes: ${importResult.totalCustomers}`);
      console.log(`   - Mensagens: ${importResult.totalMessages}`);

      // 2. Análises
      console.log('\n📊 ETAPA 2: Geração de análises');
      console.log('─'.repeat(50));

      await generateLeadReport(options.output);

      console.log('\n✅ Análises geradas!');

      // 3. Resumo final
      console.log('\n🎉 PIPELINE COMPLETO!');
      console.log('─'.repeat(50));
      console.log(`✅ Dados importados: ${importResult.totalMessages} mensagens`);
      console.log(`✅ Relatórios gerados em: ${options.output}`);
      console.log(`\n📄 Arquivos gerados:`);
      console.log(`   - ${options.output}/lead-insights.json`);
      console.log(`   - ${options.output}/lead-insights.html`);
      console.log(`\n💡 Abra o arquivo HTML no navegador para visualizar o relatório!`);

    } catch (error) {
      console.error('\n❌ Erro durante o pipeline:', error);
      process.exit(1);
    }
  });

// Executar CLI
program.parse(process.argv);

// Mostrar ajuda se nenhum comando foi fornecido
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
