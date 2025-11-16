#!/usr/bin/env node

import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api/v1';

// Dados de exemplo para seeds
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
  "Como funciona o processamento de linguagem natural?",
  "Qual é a arquitetura de um sistema de RAG?",
  "Como avaliar a qualidade de embeddings?",
  "O que é fine-tuning de modelos de linguagem?",
  "Como implementar rate limiting em APIs?",
  "Qual é a diferença entre synchronous e asynchronous processing?"
];

const SAMPLE_ANSWERS = [
  "TypeScript é um superset do JavaScript que adiciona tipagem estática opcional e recursos avançados de programação orientada a objetos, permitindo detectar erros em tempo de desenvolvimento e melhorar a manutenibilidade do código.",
  "A busca semântica utiliza embeddings de vetores para encontrar conteúdo similar baseado no significado, não apenas nas palavras exatas. Cada documento é convertido em um vetor numérico que representa seu significado semântico.",
  "RAG (Retrieval-Augmented Generation) combina recuperação de informações de uma base de conhecimento com geração de texto. Primeiro recupera documentos relevantes, depois usa esses documentos como contexto para gerar respostas mais precisas e fundamentadas.",
  "Para implementar autenticação JWT, você precisa gerar tokens no login validando credenciais, incluir o token em headers de Authorization, e validar tokens em cada requisição protegida usando middleware.",
  "Para otimizar queries no PostgreSQL, use índices apropriados (B-tree, GIN, GiST), evite SELECT *, analise execution plans com EXPLAIN, considere particionamento para tabelas grandes, e normalize dados adequadamente.",
  "O pgvector é uma extensão do PostgreSQL que adiciona suporte a vetores de alta dimensão e operações de similaridade. Permite armazenar embeddings de ML e executar buscas de similaridade cosseno, euclidiana ou produto interno.",
  "Índices HNSW (Hierarchical Navigable Small World) são estruturas de dados otimizadas para busca aproximada de vizinhos mais próximos em espaços de alta dimensão, oferecendo excelente performance para busca semântica.",
  "Para implementar cache com Redis, configure conexão com Redis, use comandos SET/GET para cache simples, implemente estratégias de invalidação (TTL, LRU), e considere serialização JSON para objetos complexos.",
  "REST é um estilo arquitetural baseado em recursos e métodos HTTP, enquanto GraphQL é uma linguagem de query que permite clientes solicitar exatamente os dados necessários, reduzindo over/under-fetching.",
  "O processamento de linguagem natural (NLP) envolve técnicas para que computadores entendam, interpretem e gerem linguagem humana, incluindo tokenização, análise sintática, embeddings, e modelos de deep learning."
];

// Função para criar dados sintéticos
async function generateUISyntheticData() {
  console.log('🧪 Gerando dados sintéticos para interface...\n');

  try {
    // Primeiro, garantir que temos algumas interações
    console.log('📝 Verificando interações existentes...');
    let interactions = [];

    try {
      const response = await axios.get(`${API_BASE_URL}/interactions?limit=20`);
      interactions = response.data.data.interactions || [];
    } catch (error) {
      console.log('⚠️  Nenhuma interação encontrada, criando algumas...');
    }

    // Criar interações se necessário
    if (interactions.length < 10) {
      console.log('📝 Criando interações sintéticas...');

      // Criar customer primeiro
      let customerId;
      try {
        const customerResponse = await axios.post(`${API_BASE_URL}/customers`, {
          name: 'Usuário Teste UI',
          email: 'ui-test@example.com',
          phone: '+5511998887777'
        });
        customerId = customerResponse.data.data.customer.id;
      } catch (error) {
        // Customer já existe, buscar
        const customersResponse = await axios.get(`${API_BASE_URL}/customers`);
        customerId = customersResponse.data.data.customers[0]?.id;
      }

      if (customerId) {
        for (let i = 0; i < 10; i++) {
          try {
            const interactionResponse = await axios.post(`${API_BASE_URL}/interactions`, {
              customer_id: customerId,
              channel: 'ui_test',
              message: SAMPLE_QUESTIONS[i % SAMPLE_QUESTIONS.length],
              sentiment: Math.random() * 2 - 1
            });
            interactions.push(interactionResponse.data.data.interaction);
          } catch (error) {
            console.error(`Erro ao criar interação ${i}:`, error.response?.data || error.message);
          }
        }
      }
    }

    console.log(`✅ ${interactions.length} interações disponíveis\n`);

    // Gerar avaliações diversificadas
    console.log('📝 Gerando avaliações diversificadas...\n');

    const evaluationsCreated = [];
    let approvedCount = 0;
    let incorrectCount = 0;

    // 60% avaliações positivas
    for (let i = 0; i < Math.floor(interactions.length * 0.6); i++) {
      const interaction = interactions[i % interactions.length];
      try {
        const evaluation = await createEvaluation({
          interaction_id: interaction.id,
          question_text: interaction.message,
          answer_text: SAMPLE_ANSWERS[i % SAMPLE_ANSWERS.length],
          used_sources: {
            document_id: `doc-${i + 1}`,
            chunk_ids: [`chunk-${i + 1}`, `chunk-${i + 2}`],
            context: "Contexto relevante da documentação"
          },
          rating: 'aprovado',
          notes: `Avaliação positiva ${i + 1} - resposta adequada`
        });
        evaluationsCreated.push(evaluation);
        approvedCount++;
        console.log(`   ✅ Avaliação aprovada ${approvedCount} criada`);
      } catch (error) {
        console.error(`Erro ao criar avaliação aprovada ${i + 1}:`, error.response?.data || error.message);
      }
    }

    // 40% avaliações negativas com diferentes severidades
    const severities: ('baixa' | 'media' | 'muito')[] = ['baixa', 'media', 'muito'];
    for (let i = 0; i < Math.floor(interactions.length * 0.4); i++) {
      const interaction = interactions[(i + Math.floor(interactions.length * 0.6)) % interactions.length];
      const severity = severities[i % severities.length];

      try {
        const evaluation = await createEvaluation({
          interaction_id: interaction.id,
          question_text: interaction.message,
          answer_text: SAMPLE_ANSWERS[(i + 5) % SAMPLE_ANSWERS.length], // Respostas diferentes
          used_sources: {
            document_id: `doc-incorrect-${i + 1}`,
            chunk_ids: [`chunk-incorrect-${i + 1}`],
            context: "Contexto que pode ter levado à resposta incorreta"
          },
          rating: 'incorreto',
          severity,
          notes: `Avaliação incorreta severidade ${severity} - ${getSeverityDescription(severity)}`
        });
        evaluationsCreated.push(evaluation);
        incorrectCount++;
        console.log(`   ⚠️  Avaliação incorreta ${incorrectCount} criada (severidade: ${severity})`);
      } catch (error) {
        console.error(`Erro ao criar avaliação incorreta ${i + 1}:`, error.response?.data || error.message);
      }
    }

    console.log(`\n📊 Resumo das avaliações criadas:`);
    console.log(`   - Aprovadas: ${approvedCount}`);
    console.log(`   - Incorretas: ${incorrectCount}`);
    console.log(`   - Total: ${evaluationsCreated.length}\n`);

    // Aguardar um pouco para garantir que os contadores sejam atualizados
    console.log('⏳ Aguardando atualização dos contadores...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar se flags foram criadas automaticamente
    console.log('🚩 Verificando flags criadas...\n');
    try {
      const flagsResponse = await axios.get(`${API_BASE_URL}/semantic-flags`);
      const flags = flagsResponse.data.data.flags || [];

      console.log(`📊 ${flags.length} flags semânticas encontradas:`);

      const statusCount = flags.reduce((acc: any, flag: any) => {
        acc[flag.status] = (acc[flag.status] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });

      // Mostrar algumas flags criadas
      if (flags.length > 0) {
        console.log('\n🔍 Exemplos de flags criadas:');
        flags.slice(0, 3).forEach((flag: any, index: number) => {
          console.log(`   ${index + 1}. "${flag.flag_reason}" (${flag.status})`);
        });
      }

    } catch (error) {
      console.log('⚠️  Erro ao verificar flags:', error.response?.data?.message || error.message);
    }

    // Estatísticas finais
    console.log('\n🎉 Dados sintéticos gerados com sucesso!');
    console.log('📋 Resumo final:');
    console.log(`   - Interações: ${interactions.length}`);
    console.log(`   - Avaliações: ${evaluationsCreated.length}`);
    console.log(`   - Taxa de aprovação: ${((approvedCount / evaluationsCreated.length) * 100).toFixed(1)}%`);
    console.log('\n💡 Agora você pode testar a interface!');
    console.log('   👉 Navegue para /evaluations para ver a lista');
    console.log('   👉 Use /evaluations/live para testar avaliação ao vivo');
    console.log('   👉 Acesse /semantic-flags para curadoria');

  } catch (error) {
    console.error('❌ Erro geral ao gerar dados sintéticos:', error);
    process.exit(1);
  }
}

// Função auxiliar para criar avaliação
async function createEvaluation(evaluationData: {
  interaction_id: string;
  question_text: string;
  answer_text: string;
  used_sources?: any;
  rating: 'aprovado' | 'incorreto';
  severity?: 'baixa' | 'media' | 'muito';
  notes?: string;
}) {
  const response = await axios.post(`${API_BASE_URL}/evaluations`, evaluationData);
  return response.data.data;
}

// Função auxiliar para descrição de severidade
function getSeverityDescription(severity: string): string {
  switch (severity) {
    case 'baixa': return 'erro menor, resposta ainda parcialmente útil';
    case 'media': return 'erro significativo que impacta usabilidade';
    case 'muito': return 'erro grave que pode ser perigoso ou completamente errado';
    default: return 'severidade desconhecida';
  }
}

// CLI
import { Command } from 'commander';

const program = new Command();

program
  .name('seed-ui-evaluations')
  .description('Gera dados sintéticos para testar a interface de avaliação de respostas')
  .version('1.0.0');

program
  .command('generate')
  .description('Gera dados sintéticos para UI de avaliações')
  .action(async () => {
    await generateUISyntheticData();
  });

program
  .command('clean')
  .description('Remove dados de teste (avaliações e flags)')
  .action(async () => {
    console.log('🧹 Limpando dados de teste da UI...');

    try {
      // Buscar e deletar flags
      try {
        const flagsResponse = await axios.get(`${API_BASE_URL}/semantic-flags`);
        const flags = flagsResponse.data.data.flags || [];

        for (const flag of flags) {
          try {
            await axios.delete(`${API_BASE_URL}/semantic-flags/${flag.id}`);
            console.log(`   ✅ Flag ${flag.id} removida`);
          } catch (error) {
            console.log(`   ⚠️  Erro ao remover flag ${flag.id}`);
          }
        }
      } catch (error) {
        console.log('   ⚠️  Erro ao buscar flags para limpeza');
      }

      // Buscar e deletar avaliações
      try {
        const evaluationsResponse = await axios.get(`${API_BASE_URL}/evaluations?limit=100`);
        const evaluations = evaluationsResponse.data.data.evaluations || [];

        for (const evaluation of evaluations) {
          // Note: O endpoint de delete pode não existir, então ignoramos erros
          try {
            // Se existir endpoint de delete, usar aqui
            console.log(`   📝 Avaliação ${evaluation.id} encontrada (delete não implementado)`);
          } catch (error) {
            // Ignorar
          }
        }
      } catch (error) {
        console.log('   ⚠️  Erro ao buscar avaliações para limpeza');
      }

      console.log('\n🧹 Limpeza concluída! (Nota: delete de avaliações não implementado na API)');
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
