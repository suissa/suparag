#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { supabase } from '../src/config/supabase';

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Verificar se as variáveis essenciais estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
  console.error('📝 Crie um arquivo .env no diretório server/ com:');
  console.error('   SUPABASE_URL=https://seu-projeto.supabase.co');
  console.error('   SUPABASE_ANON_KEY=sua-chave-anonima');
  process.exit(1);
}

// Dados sintéticos para testes
const SAMPLE_QUESTIONS = [
  "Qual é a diferença entre TypeScript e JavaScript?",
  "Como funciona a busca semântica com vetores?",
  "O que é um sistema RAG?",
  "Como implementar autenticação JWT?",
  "Qual é a melhor prática para otimizar queries no PostgreSQL?",
  "Como funciona o pgvector para embeddings?",
  "O que são índices HNSW?",
  "Como implementar cache com Redis?",
  "Qual é a diferença entre REST e GraphQL?",
  "Como funciona o processamento de linguagem natural?"
];

const SAMPLE_ANSWERS = [
  "TypeScript é um superset do JavaScript que adiciona tipagem estática opcional e recursos avançados de programação orientada a objetos.",
  "A busca semântica utiliza embeddings de vetores para encontrar conteúdo similar baseado no significado, não apenas nas palavras exatas.",
  "RAG (Retrieval-Augmented Generation) combina recuperação de informações com geração de texto para fornecer respostas mais precisas e contextuais.",
  "Para implementar autenticação JWT, você precisa gerar tokens no login, validá-los em cada requisição e renová-los quando necessário.",
  "Para otimizar queries no PostgreSQL, use índices apropriados, evite selects desnecessários e considere particionamento para tabelas grandes."
];

const SAMPLE_SOURCES = [
  {
    document_id: "doc-1",
    chunk_ids: ["chunk-1", "chunk-2"],
    context: "TypeScript adiciona tipos estáticos ao JavaScript, permitindo detectar erros em tempo de desenvolvimento."
  },
  {
    document_id: "doc-2",
    chunk_ids: ["chunk-3", "chunk-4"],
    context: "Vetores são representações numéricas de significado semântico, permitindo comparações matemáticas de similaridade."
  }
];

// Função para gerar dados sintéticos
async function generateSyntheticEvaluations() {
  console.log('🧪 Gerando dados sintéticos para avaliações...\n');

  try {
    // 1. Buscar algumas interações existentes ou criar novas
    console.log('📊 Verificando interações existentes...');
    const { data: existingInteractions, error: interactionsError } = await supabase
      .from('interactions')
      .select('id, customer_id, message')
      .limit(10);

    if (interactionsError) {
      console.error('❌ Erro ao buscar interações:', interactionsError.message);
      return;
    }

    let interactionsToUse = existingInteractions || [];

    // Se não há interações suficientes, vamos criar algumas
    if (interactionsToUse.length < 10) {
      console.log('📝 Criando interações sintéticas...');

      // Primeiro, verificar se existe algum customer
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .limit(1);

      let customerId = customers?.[0]?.id;

      if (!customerId) {
        // Criar um customer sintético
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            phone: '+5511999999999',
            name: 'Usuário Teste'
          })
          .select('id')
          .single();

        if (customerError) {
          console.error('❌ Erro ao criar customer:', customerError.message);
          return;
        }
        customerId = newCustomer.id;
      }

      // Criar interações sintéticas
      for (let i = 0; i < 10; i++) {
        const { data: newInteraction, error: interactionError } = await supabase
          .from('interactions')
          .insert({
            customer_id: customerId,
            channel: 'test',
            message: SAMPLE_QUESTIONS[i % SAMPLE_QUESTIONS.length],
            sentiment: Math.random() * 2 - 1 // Entre -1 e 1
          })
          .select('id, customer_id, message')
          .single();

        if (interactionError) {
          console.error(`❌ Erro ao criar interação ${i + 1}:`, interactionError.message);
          continue;
        }

        interactionsToUse.push(newInteraction);
      }
    }

    console.log(`✅ Usando ${interactionsToUse.length} interações para testes\n`);

    // 2. Gerar avaliações que atingirão os limiares
    console.log('📝 Gerando avaliações que atingirão os limiares...\n');

    const evaluations = [];
    let evaluationCount = 0;

    // Cenário 1: Uma avaliação severity='muito' → deve criar flag imediata
    console.log('🎯 Cenário 1: Avaliação crítica direta');
    const criticalEval = await createEvaluation(
      interactionsToUse[0].id,
      SAMPLE_QUESTIONS[0],
      SAMPLE_ANSWERS[0],
      'incorreto',
      'muito',
      'Resposta completamente incorreta e perigosa',
      SAMPLE_SOURCES[0]
    );
    evaluations.push(criticalEval);
    evaluationCount++;
    console.log('   ✅ Flag criado por avaliação crítica\n');

    // Cenário 2: Uma sequência com 3 'media' → cria flag na terceira
    console.log('🎯 Cenário 2: Sequência de 3 críticas médias');
    for (let i = 0; i < 3; i++) {
      const evalResult = await createEvaluation(
        interactionsToUse[1].id,
        SAMPLE_QUESTIONS[1],
        SAMPLE_ANSWERS[1],
        'incorreto',
        'media',
        `Avaliação média ${i + 1}: resposta imprecisa`,
        SAMPLE_SOURCES[1]
      );
      evaluations.push(evalResult);
      evaluationCount++;

      if (i === 2) {
        console.log('   ✅ Flag criado na terceira avaliação média\n');
      } else {
        console.log(`   📝 Avaliação ${i + 1}/3 criada`);
      }
    }

    // Cenário 3: Uma sequência com 5 'baixa' → cria flag na quinta
    console.log('🎯 Cenário 3: Sequência de 5 críticas baixas');
    for (let i = 0; i < 5; i++) {
      const evalResult = await createEvaluation(
        interactionsToUse[2].id,
        SAMPLE_QUESTIONS[2],
        SAMPLE_ANSWERS[2],
        'incorreto',
        'baixa',
        `Avaliação baixa ${i + 1}: resposta incompleta`,
        SAMPLE_SOURCES[0]
      );
      evaluations.push(evalResult);
      evaluationCount++;

      if (i === 4) {
        console.log('   ✅ Flag criado na quinta avaliação baixa\n');
      } else {
        console.log(`   📝 Avaliação ${i + 1}/5 criada`);
      }
    }

    // Cenário 4: Avaliações positivas (não devem criar flags)
    console.log('🎯 Cenário 4: Avaliações positivas');
    for (let i = 0; i < 10; i++) {
      const evalResult = await createEvaluation(
        interactionsToUse[3 + (i % 3)].id,
        SAMPLE_QUESTIONS[i % SAMPLE_QUESTIONS.length],
        SAMPLE_ANSWERS[i % SAMPLE_ANSWERS.length],
        'aprovado',
        null,
        'Resposta adequada e precisa',
        SAMPLE_SOURCES[i % SAMPLE_SOURCES.length]
      );
      evaluations.push(evalResult);
      evaluationCount++;
    }
    console.log('   ✅ 10 avaliações positivas criadas\n');

    // Cenário 5: Mais algumas críticas misturadas
    console.log('🎯 Cenário 5: Críticas adicionais para testar limites');
    const mixedEvaluations = [
      { severity: 'baixa', count: 3 },
      { severity: 'media', count: 2 },
      { severity: 'muito', count: 1 }
    ];

    for (const config of mixedEvaluations) {
      for (let i = 0; i < config.count; i++) {
        const evalResult = await createEvaluation(
          interactionsToUse[6 + Math.floor(Math.random() * 4)].id,
          SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)],
          SAMPLE_ANSWERS[Math.floor(Math.random() * SAMPLE_ANSWERS.length)],
          'incorreto',
          config.severity as 'baixa' | 'media' | 'muito',
          `Avaliação ${config.severity}: teste de limite`,
          SAMPLE_SOURCES[Math.floor(Math.random() * SAMPLE_SOURCES.length)]
        );
        evaluations.push(evalResult);
        evaluationCount++;
      }
    }
    console.log('   ✅ Críticas adicionais criadas\n');

    // 3. Verificar resultados finais
    console.log('📊 Verificando resultados finais...');

    // Contar flags criados
    const { data: flags, error: flagsError } = await supabase
      .from('semantic_flags')
      .select('id, flag_reason, status');

    if (flagsError) {
      console.error('❌ Erro ao contar flags:', flagsError.message);
    } else {
      console.log(`   🚩 Total de flags criados: ${flags.length}`);
      const reasons = flags.reduce((acc, flag) => {
        acc[flag.flag_reason] = (acc[flag.flag_reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(reasons).forEach(([reason, count]) => {
        console.log(`      - ${reason}: ${count}`);
      });
    }

    // Contar avaliações
    const { data: totalEvaluations, error: evalCountError } = await supabase
      .from('answer_evaluations')
      .select('id');

    if (evalCountError) {
      console.error('❌ Erro ao contar avaliações:', evalCountError.message);
    } else {
      console.log(`   📝 Total de avaliações criadas: ${totalEvaluations.length}`);
    }

    // Contar contadores de qualidade
    const { data: qualityCounters, error: counterError } = await supabase
      .from('answer_quality_counters')
      .select('question_hash, answer_hash, count_baixa, count_media, count_muito');

    if (counterError) {
      console.error('❌ Erro ao contar contadores:', counterError.message);
    } else {
      console.log(`   📊 Total de pares pergunta/resposta únicos: ${qualityCounters.length}`);
      const totalDisapprovals = qualityCounters.reduce((acc, counter) => ({
        baixa: acc.baixa + counter.count_baixa,
        media: acc.media + counter.count_media,
        muito: acc.muito + counter.count_muito
      }), { baixa: 0, media: 0, muito: 0 });

      console.log(`   👎 Total de reprovações por severidade:`);
      console.log(`      - Baixa: ${totalDisapprovals.baixa}`);
      console.log(`      - Média: ${totalDisapprovals.media}`);
      console.log(`      - Muito: ${totalDisapprovals.muito}`);
    }

    console.log('\n🎉 Seeds sintéticos gerados com sucesso!');
    console.log('📋 Resumo:');
    console.log(`   - Avaliações criadas: ${evaluationCount}`);
    console.log(`   - Cenários de teste implementados: 5`);
    console.log(`   - Limiares testados: avaliação crítica, 3x média, 5x baixa`);
    console.log('\n💡 Agora você pode executar os testes para validar o sistema!');

  } catch (error) {
    console.error('❌ Erro ao gerar seeds sintéticos:', error);
    process.exit(1);
  }
}

// Função auxiliar para criar avaliação
async function createEvaluation(
  interactionId: string,
  questionText: string,
  answerText: string,
  rating: 'aprovado' | 'incorreto',
  severity: 'baixa' | 'media' | 'muito' | null,
  notes: string,
  usedSources: any
) {
  try {
    const { data, error } = await supabase.rpc('rpc_record_evaluation', {
      p_interaction_id: interactionId,
      p_question_text: questionText,
      p_answer_text: answerText,
      p_used_sources: usedSources,
      p_rating: rating,
      p_severity: severity,
      p_notes: notes
    });

    if (error) {
      console.error(`❌ Erro ao criar avaliação: ${error.message}`);
      throw error;
    }

    return {
      evaluation_id: data.evaluation_id,
      flag_created: data.flag_created
    };
  } catch (error) {
    console.error('Erro na função createEvaluation:', error);
    throw error;
  }
}

// CLI
const program = new Command();

program
  .name('seed-evaluations')
  .description('Gera dados sintéticos para testar o sistema de avaliação de respostas')
  .version('1.0.0');

program
  .command('generate')
  .description('Gera seeds sintéticos para avaliações e flags semânticos')
  .action(async () => {
    await generateSyntheticEvaluations();
  });

program
  .command('clean')
  .description('Remove todos os dados de teste gerados')
  .action(async () => {
    console.log('🧹 Limpando dados de teste...');

    try {
      // Remover flags
      const { error: flagsError } = await supabase
        .from('semantic_flags')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Não deletar se não existir

      if (flagsError) {
        console.error('❌ Erro ao remover flags:', flagsError.message);
      } else {
        console.log('✅ Flags removidos');
      }

      // Remover avaliações
      const { error: evalError } = await supabase
        .from('answer_evaluations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (evalError) {
        console.error('❌ Erro ao remover avaliações:', evalError.message);
      } else {
        console.log('✅ Avaliações removidas');
      }

      // Remover contadores
      const { error: counterError } = await supabase
        .from('answer_quality_counters')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (counterError) {
        console.error('❌ Erro ao remover contadores:', counterError.message);
      } else {
        console.log('✅ Contadores removidos');
      }

      console.log('\n🧹 Limpeza concluída!');
    } catch (error) {
      console.error('❌ Erro durante limpeza:', error);
      process.exit(1);
    }
  });

// Executar CLI
program.parse(process.argv);

// Mostrar ajuda se nenhum comando foi fornecido
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
