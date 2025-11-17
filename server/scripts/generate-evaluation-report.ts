#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { supabase } from '../src/config/supabase';
import { execSync } from 'child_process';

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

// Interface para estatísticas
interface EvaluationStats {
  total_evaluations: number;
  approved_count: number;
  incorrect_count: number;
  approval_rate: number;
}

interface SeverityStats {
  baixa: number;
  media: number;
  muito: number;
}

interface QualityCounters {
  total_baixa: number;
  total_media: number;
  total_muito: number;
}

interface FlagStats {
  total_flags: number;
  resolved_flags: number;
  resolution_rate: number;
  status_distribution: {
    pendente: number;
    aprovado: number;
    eliminado: number;
  };
  reason_distribution: Record<string, number>;
  recent_flags: any[];
}

interface SupabaseSnapshot {
  evaluations_overview: EvaluationStats;
  severity_distribution: SeverityStats;
  quality_counters: QualityCounters;
  flags_overview: FlagStats;
  sample_evaluations: any[];
  problematic_responses: any[];
  used_sources_analysis: any[];
  generated_at: string;
}

// Função para executar testes das avaliações
async function runEvaluationTests(): Promise<boolean> {
  console.log('🧪 Executando testes das avaliações...\n');

  try {
    // Executar apenas os testes de avaliações
    execSync('npm test -- --testPathPattern=evaluations', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });

    console.log('✅ Testes executados com sucesso!\n');
    return true;
  } catch (error) {
    console.error('❌ Falha na execução dos testes:', error);
    return false;
  }
}

// Função para coletar snapshot do Supabase
async function collectSupabaseSnapshot(): Promise<SupabaseSnapshot> {
  console.log('📊 Coletando snapshot do Supabase...\n');

  // Buscar estatísticas das avaliações
  const { data: evaluations, error: evalError } = await supabase
    .from('answer_evaluations')
    .select('rating, severity, question_text, answer_text, used_sources, created_at')
    .order('created_at', { ascending: false });

  if (evalError) {
    throw new Error(`Erro ao buscar avaliações: ${evalError.message}`);
  }

  // Calcular estatísticas gerais
  const totalEvaluations = evaluations.length;
  const approvedCount = evaluations.filter(e => e.rating === 'aprovado').length;
  const incorrectCount = evaluations.filter(e => e.rating === 'incorreto').length;
  const approvalRate = totalEvaluations > 0 ? (approvedCount / totalEvaluations) * 100 : 0;

  const severityStats: SeverityStats = {
    baixa: evaluations.filter(e => e.severity === 'baixa').length,
    media: evaluations.filter(e => e.severity === 'media').length,
    muito: evaluations.filter(e => e.severity === 'muito').length
  };

  // Buscar contadores de qualidade
  const { data: counters, error: counterError } = await supabase
    .from('answer_quality_counters')
    .select('question_hash, answer_hash, count_baixa, count_media, count_muito, question_text, answer_text');

  if (counterError) {
    throw new Error(`Erro ao buscar contadores: ${counterError.message}`);
  }

  const qualityCounters: QualityCounters = counters.reduce((acc, counter) => ({
    total_baixa: acc.total_baixa + counter.count_baixa,
    total_media: acc.total_media + counter.count_media,
    total_muito: acc.total_muito + counter.count_muito
  }), { total_baixa: 0, total_media: 0, total_muito: 0 });

  // Buscar estatísticas dos flags
  const { data: flags, error: flagsError } = await supabase
    .from('semantic_flags')
    .select('status, flag_reason, question_text, answer_text, disapproval_counters, created_at, resolved_at')
    .order('created_at', { ascending: false });

  if (flagsError) {
    throw new Error(`Erro ao buscar flags: ${flagsError.message}`);
  }

  const totalFlags = flags.length;
  const resolvedFlags = flags.filter(f => f.resolved_at !== null).length;
  const resolutionRate = totalFlags > 0 ? (resolvedFlags / totalFlags) * 100 : 0;

  const statusStats = {
    pendente: flags.filter(f => f.status === 'pendente').length,
    aprovado: flags.filter(f => f.status === 'aprovado').length,
    eliminado: flags.filter(f => f.status === 'eliminado').length
  };

  const reasonStats = flags.reduce((acc, flag) => {
    acc[flag.flag_reason] = (acc[flag.flag_reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentFlags = flags.slice(0, 5);

  // Amostras de avaliações
  const sampleEvaluations = evaluations.slice(0, 10);

  // Respostas problemáticas (com flags)
  const problematicResponses = flags.map(flag => ({
    question: flag.question_text,
    answer: flag.answer_text,
    reason: flag.flag_reason,
    disapproval_counters: flag.disapproval_counters,
    status: flag.status
  }));

  // Análise de used_sources
  const usedSourcesAnalysis = evaluations
    .filter(e => e.used_sources)
    .map(e => ({
      question: e.question_text.substring(0, 100) + '...',
      sources: e.used_sources,
      rating: e.rating,
      severity: e.severity
    }))
    .slice(0, 20);

  return {
    evaluations_overview: {
      total_evaluations: totalEvaluations,
      approved_count: approvedCount,
      incorrect_count: incorrectCount,
      approval_rate: Math.round(approvalRate * 100) / 100
    },
    severity_distribution: severityStats,
    quality_counters: qualityCounters,
    flags_overview: {
      total_flags: totalFlags,
      resolved_flags: resolvedFlags,
      resolution_rate: Math.round(resolutionRate * 100) / 100,
      status_distribution: statusStats,
      reason_distribution: reasonStats,
      recent_flags: recentFlags
    },
    sample_evaluations: sampleEvaluations,
    problematic_responses: problematicResponses,
    used_sources_analysis: usedSourcesAnalysis,
    generated_at: new Date().toISOString()
  };
}

// Função para gerar relatório HTML
function generateHTMLReport(snapshot: SupabaseSnapshot, outputPath: string) {
  console.log('📄 Gerando relatório HTML...\n');

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Avaliação de Respostas - SUPARAG</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .content {
            padding: 30px;
        }

        .section {
            margin-bottom: 40px;
            border-bottom: 1px solid #eee;
            padding-bottom: 30px;
        }

        .section:last-child {
            border-bottom: none;
        }

        .section h2 {
            color: #667eea;
            font-size: 1.8em;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }

        .section h2::before {
            content: '📊';
            margin-right: 10px;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .metric-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #667eea;
        }

        .metric-card.success {
            border-left-color: #28a745;
        }

        .metric-card.warning {
            border-left-color: #ffc107;
        }

        .metric-card.danger {
            border-left-color: #dc3545;
        }

        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }

        .metric-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .chart-container {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .data-table th,
        .data-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }

        .data-table th {
            background: #667eea;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8em;
            letter-spacing: 1px;
        }

        .data-table tr:hover {
            background: #f8f9fa;
        }

        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 500;
        }

        .status-pendente {
            background: #fff3cd;
            color: #856404;
        }

        .status-aprovado {
            background: #d4edda;
            color: #155724;
        }

        .status-eliminado {
            background: #f8d7da;
            color: #721c24;
        }

        .json-data {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }

        .footer {
            background: #343a40;
            color: white;
            text-align: center;
            padding: 20px;
            margin-top: 40px;
        }

        .footer p {
            opacity: 0.8;
            font-size: 0.9em;
        }

        @media (max-width: 768px) {
            .metrics-grid {
                grid-template-columns: 1fr;
            }

            .header h1 {
                font-size: 2em;
            }

            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Sistema de Avaliação de Respostas</h1>
            <p>Relatório de Qualidade e Curadoria Semântica</p>
            <p style="margin-top: 10px; font-size: 0.9em;">
                Gerado em: ${new Date(snapshot.generated_at).toLocaleString('pt-BR')}
            </p>
        </div>

        <div class="content">
            <!-- Visão Geral das Avaliações -->
            <div class="section">
                <h2>Visão Geral das Avaliações</h2>
                <div class="metrics-grid">
                    <div class="metric-card success">
                        <div class="metric-value">${snapshot.evaluations_overview.total_evaluations}</div>
                        <div class="metric-label">Total de Avaliações</div>
                    </div>
                    <div class="metric-card success">
                        <div class="metric-value">${snapshot.evaluations_overview.approved_count}</div>
                        <div class="metric-label">Aprovadas</div>
                    </div>
                    <div class="metric-card warning">
                        <div class="metric-value">${snapshot.evaluations_overview.incorrect_count}</div>
                        <div class="metric-label">Incorretas</div>
                    </div>
                    <div class="metric-card ${snapshot.evaluations_overview.approval_rate >= 80 ? 'success' : snapshot.evaluations_overview.approval_rate >= 60 ? 'warning' : 'danger'}">
                        <div class="metric-value">${snapshot.evaluations_overview.approval_rate}%</div>
                        <div class="metric-label">Taxa de Aprovação</div>
                    </div>
                </div>

                <div class="chart-container">
                    <h3>Distribuição por Severidade</h3>
                    <div class="metrics-grid">
                        <div class="metric-card" style="border-left-color: #17a2b8;">
                            <div class="metric-value">${snapshot.severity_distribution.baixa}</div>
                            <div class="metric-label">Severidade Baixa</div>
                        </div>
                        <div class="metric-card" style="border-left-color: #ffc107;">
                            <div class="metric-value">${snapshot.severity_distribution.media}</div>
                            <div class="metric-label">Severidade Média</div>
                        </div>
                        <div class="metric-card" style="border-left-color: #dc3545;">
                            <div class="metric-value">${snapshot.severity_distribution.muito}</div>
                            <div class="metric-label">Severidade Muito Alta</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contadores de Qualidade -->
            <div class="section">
                <h2>Contadores de Qualidade</h2>
                <p style="margin-bottom: 20px; color: #666;">
                    Contabilização agregada de reprovações por tipo de resposta
                </p>
                <div class="metrics-grid">
                    <div class="metric-card" style="border-left-color: #17a2b8;">
                        <div class="metric-value">${snapshot.quality_counters.total_baixa}</div>
                        <div class="metric-label">Reprovações Baixas</div>
                    </div>
                    <div class="metric-card" style="border-left-color: #ffc107;">
                        <div class="metric-value">${snapshot.quality_counters.total_media}</div>
                        <div class="metric-label">Reprovações Médias</div>
                    </div>
                    <div class="metric-card" style="border-left-color: #dc3545;">
                        <div class="metric-value">${snapshot.quality_counters.total_muito}</div>
                        <div class="metric-label">Reprovações Altas</div>
                    </div>
                </div>
            </div>

            <!-- Flags Semânticos -->
            <div class="section">
                <h2>Flags Semânticos</h2>
                <div class="metrics-grid">
                    <div class="metric-card warning">
                        <div class="metric-value">${snapshot.flags_overview.total_flags}</div>
                        <div class="metric-label">Total de Flags</div>
                    </div>
                    <div class="metric-card success">
                        <div class="metric-value">${snapshot.flags_overview.resolved_flags}</div>
                        <div class="metric-label">Flags Resolvidos</div>
                    </div>
                    <div class="metric-card ${snapshot.flags_overview.resolution_rate >= 80 ? 'success' : 'warning'}">
                        <div class="metric-value">${snapshot.flags_overview.resolution_rate}%</div>
                        <div class="metric-label">Taxa de Resolução</div>
                    </div>
                </div>

                <div class="chart-container">
                    <h3>Status dos Flags</h3>
                    <div class="metrics-grid">
                        <div class="metric-card" style="border-left-color: #ffc107;">
                            <div class="metric-value">${snapshot.flags_overview.status_distribution.pendente}</div>
                            <div class="metric-label">Pendente</div>
                        </div>
                        <div class="metric-card" style="border-left-color: #28a745;">
                            <div class="metric-value">${snapshot.flags_overview.status_distribution.aprovado}</div>
                            <div class="metric-label">Aprovado</div>
                        </div>
                        <div class="metric-card" style="border-left-color: #dc3545;">
                            <div class="metric-value">${snapshot.flags_overview.status_distribution.eliminado}</div>
                            <div class="metric-label">Eliminado</div>
                        </div>
                    </div>
                </div>

                ${snapshot.flags_overview.recent_flags.length > 0 ? `
                <h3>Flags Mais Recentes</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Razão</th>
                            <th>Status</th>
                            <th>Criado em</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${snapshot.flags_overview.recent_flags.map(flag => `
                        <tr>
                            <td>${flag.flag_reason}</td>
                            <td><span class="status-badge status-${flag.status}">${flag.status}</span></td>
                            <td>${new Date(flag.created_at).toLocaleString('pt-BR')}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : '<p style="color: #666; font-style: italic;">Nenhum flag encontrado.</p>'}
            </div>

            <!-- Respostas Problemáticas -->
            ${snapshot.problematic_responses.length > 0 ? `
            <div class="section">
                <h2>Respostas Problemáticas</h2>
                <p style="margin-bottom: 20px; color: #666;">
                    Respostas que geraram flags semânticos para curadoria
                </p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Pergunta</th>
                            <th>Resposta</th>
                            <th>Razão do Flag</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${snapshot.problematic_responses.map(response => `
                        <tr>
                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${response.question}</td>
                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${response.answer}</td>
                            <td>${response.reason}</td>
                            <td><span class="status-badge status-${response.status}">${response.status}</span></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <!-- Análise de Fontes Utilizadas -->
            ${snapshot.used_sources_analysis.length > 0 ? `
            <div class="section">
                <h2>Análise de Fontes Utilizadas</h2>
                <p style="margin-bottom: 20px; color: #666;">
                    Como as respostas utilizaram as fontes de conhecimento
                </p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Pergunta</th>
                            <th>Fontes Utilizadas</th>
                            <th>Avaliação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${snapshot.used_sources_analysis.map(analysis => `
                        <tr>
                            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${analysis.question}</td>
                            <td>
                                <div class="json-data" style="margin: 0; font-size: 0.8em;">
${JSON.stringify(analysis.sources, null, 2)}
                                </div>
                            </td>
                            <td>
                                <span class="status-badge ${analysis.rating === 'aprovado' ? 'status-aprovado' : 'status-eliminado'}">
                                    ${analysis.rating}
                                </span>
                                ${analysis.severity ? `<br><small>Severidade: ${analysis.severity}</small>` : ''}
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <!-- Snapshot JSON -->
            <div class="section">
                <h2>📋 Snapshot Completo do Supabase</h2>
                <p style="margin-bottom: 20px; color: #666;">
                    Dados brutos exportados do banco para auditoria e análise detalhada
                </p>
                <div class="json-data">
${JSON.stringify(snapshot, null, 2)}
                </div>
            </div>
        </div>

        <div class="footer">
            <p>🔬 Relatório gerado automaticamente pelo sistema de avaliação de respostas</p>
            <p>⚡ SUPARAG - Sistema de Chat AI com RAG + Qualidade de Respostas</p>
        </div>
    </div>
</body>
</html>`;

  // Criar diretório se não existir
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Salvar arquivo HTML
  fs.writeFileSync(outputPath, html, 'utf8');

  // Salvar snapshot JSON
  const jsonPath = outputPath.replace('.html', '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2), 'utf8');

  console.log(`✅ Relatório HTML salvo em: ${outputPath}`);
  console.log(`✅ Snapshot JSON salvo em: ${jsonPath}`);
}

// CLI
const program = new Command();

program
  .name('generate-evaluation-report')
  .description('Gera relatório HTML completo das avaliações com snapshot do Supabase')
  .version('1.0.0');

program
  .command('generate')
  .description('Gera relatório completo executando testes + coletando dados')
  .option('-o, --output <path>', 'Caminho do arquivo HTML de saída', 'reports/evaluation-feedback-report.html')
  .action(async (options) => {
    try {
      console.log('🚀 Iniciando geração de relatório de avaliações...\n');

      // 1. Executar testes
      console.log('📋 ETAPA 1: Executando testes');
      console.log('─'.repeat(50));
      const testsPassed = await runEvaluationTests();

      if (!testsPassed) {
        console.log('⚠️  Testes falharam, mas continuando com a geração do relatório...');
      }

      // 2. Coletar snapshot
      console.log('\n📊 ETAPA 2: Coletando dados do Supabase');
      console.log('─'.repeat(50));
      const snapshot = await collectSupabaseSnapshot();

      // 3. Gerar relatório
      console.log('\n📄 ETAPA 3: Gerando relatório HTML');
      console.log('─'.repeat(50));
      generateHTMLReport(snapshot, options.output);

      // 4. Resumo final
      console.log('\n🎉 RELATÓRIO GERADO COM SUCESSO!');
      console.log('─'.repeat(50));
      console.log(`📊 Avaliações analisadas: ${snapshot.evaluations_overview.total_evaluations}`);
      console.log(`🚩 Flags identificados: ${snapshot.flags_overview.total_flags}`);
      console.log(`✅ Taxa de aprovação: ${snapshot.evaluations_overview.approval_rate}%`);
      console.log(`📁 Arquivos gerados:`);
      console.log(`   - ${options.output}`);
      console.log(`   - ${options.output.replace('.html', '.json')}`);
      console.log('\n💡 Abra o arquivo HTML no navegador para visualizar o relatório completo!');

    } catch (error) {
      console.error('❌ Erro durante geração do relatório:', error);
      process.exit(1);
    }
  });

program
  .command('snapshot-only')
  .description('Coleta apenas o snapshot do Supabase sem executar testes')
  .option('-o, --output <path>', 'Caminho do arquivo HTML de saída', 'reports/evaluation-feedback-report.html')
  .action(async (options) => {
    try {
      console.log('📊 Coletando snapshot do Supabase...\n');

      const snapshot = await collectSupabaseSnapshot();
      generateHTMLReport(snapshot, options.output);

      console.log('✅ Snapshot coletado e relatório gerado com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao coletar snapshot:', error);
      process.exit(1);
    }
  });

// Executar CLI
program.parse(process.argv);

// Mostrar ajuda se nenhum comando foi fornecido
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
