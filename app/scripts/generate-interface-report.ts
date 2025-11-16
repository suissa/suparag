#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api/v1';

interface PlaywrightResult {
  testResults?: Array<{
    title: string;
    status: string;
    duration: number;
    error?: string;
    screenshots?: Array<{ path: string }>;
  }>;
  summary?: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    duration: number;
  };
}

interface SupabaseSnapshot {
  evaluations_overview: {
    total_evaluations: number;
    approved_count: number;
    incorrect_count: number;
    approval_rate: number;
  };
  severity_distribution: {
    baixa: number;
    media: number;
    muito: number;
  };
  flags_overview: {
    total_flags: number;
    resolved_flags: number;
    resolution_rate: number;
    status_distribution: Record<string, number>;
  };
  generated_at: string;
}

// Função para executar testes Playwright
async function runPlaywrightTests(): Promise<PlaywrightResult> {
  console.log('🎭 Executando testes Playwright...\n');

  try {
    // Executar apenas os testes de UI
    execSync('npx playwright test tests/ui.*.spec.ts --reporter=json', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });

    // Ler resultados dos testes
    const resultsPath = path.resolve(__dirname, '..', 'reports', 'test-results.json');
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      return results;
    }

    return {};
  } catch (error) {
    console.error('❌ Erro ao executar testes Playwright:', error);
    return { summary: { passed: 0, failed: 1, skipped: 0, total: 1, duration: 0 } };
  }
}

// Função para coletar snapshot do Supabase
async function collectSupabaseSnapshot(): Promise<SupabaseSnapshot> {
  console.log('📊 Coletando snapshot do Supabase...\n');

  try {
    // Buscar estatísticas das avaliações
    const [evalStats, flagsStats] = await Promise.all([
      axios.get(`${API_BASE_URL}/evaluations/stats/overview`),
      axios.get(`${API_BASE_URL}/semantic-flags/stats/overview`)
    ]);

    return {
      evaluations_overview: evalStats.data.data,
      severity_distribution: evalStats.data.data.severity_distribution,
      flags_overview: flagsStats.data.data,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Erro ao coletar snapshot:', error);
    return {
      evaluations_overview: { total_evaluations: 0, approved_count: 0, incorrect_count: 0, approval_rate: 0 },
      severity_distribution: { baixa: 0, media: 0, muito: 0 },
      flags_overview: { total_flags: 0, resolved_flags: 0, resolution_rate: 0, status_distribution: {} },
      generated_at: new Date().toISOString()
    };
  }
}

// Função para ler screenshots
function getScreenshots(): string[] {
  const screenshotsDir = path.resolve(__dirname, '..', 'test-results');
  const screenshots: string[] = [];

  try {
    if (fs.existsSync(screenshotsDir)) {
      const files = fs.readdirSync(screenshotsDir);
      screenshots.push(...files.filter(file => file.endsWith('.png')).map(file => path.join(screenshotsDir, file)));
    }
  } catch (error) {
    console.error('Erro ao ler screenshots:', error);
  }

  return screenshots;
}

// Função para gerar relatório HTML
function generateHTMLReport(playwrightResults: PlaywrightResult, supabaseSnapshot: SupabaseSnapshot, screenshots: string[]): void {
  console.log('📄 Gerando relatório HTML...\n');

  const passedTests = playwrightResults.summary?.passed || 0;
  const failedTests = playwrightResults.summary?.failed || 0;
  const totalTests = playwrightResults.summary?.total || 0;
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Interface - Avaliação de Respostas | NeuroPgRag</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            margin-top: 20px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="30" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="70" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
            opacity: 0.1;
        }

        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }

        .content {
            padding: 40px;
        }

        .section {
            margin-bottom: 50px;
            background: #f8f9fa;
            border-radius: 10px;
            padding: 30px;
            border-left: 5px solid #667eea;
        }

        .section h2 {
            color: #667eea;
            font-size: 1.8em;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }

        .section h2::before {
            content: '🎯';
            margin-right: 10px;
            font-size: 1.2em;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
        }

        .metric-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-top: 4px solid #667eea;
            transition: transform 0.3s ease;
        }

        .metric-card:hover {
            transform: translateY(-5px);
        }

        .metric-card.success {
            border-top-color: #28a745;
        }

        .metric-card.warning {
            border-top-color: #ffc107;
        }

        .metric-card.danger {
            border-top-color: #dc3545;
        }

        .metric-card.info {
            border-top-color: #17a2b8;
        }

        .metric-value {
            font-size: 3em;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }

        .metric-label {
            color: #666;
            font-size: 1em;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }

        .test-results {
            background: white;
            border-radius: 10px;
            padding: 25px;
            margin: 20px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .test-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            background: #f8f9fa;
        }

        .test-item.success {
            background: #d4edda;
            border-left: 4px solid #28a745;
        }

        .test-item.failure {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
        }

        .test-name {
            font-weight: 600;
            color: #333;
        }

        .test-status {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
        }

        .status-passed {
            background: #28a745;
            color: white;
        }

        .status-failed {
            background: #dc3545;
            color: white;
        }

        .screenshots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .screenshot {
            border: 2px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            background: #f8f9fa;
        }

        .screenshot img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            display: block;
        }

        .screenshot-title {
            padding: 10px;
            font-weight: 600;
            color: #333;
            background: white;
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
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }

        .data-table th {
            background: #667eea;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 1px;
        }

        .data-table tr:hover {
            background: #f8f9fa;
        }

        .json-data {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
            max-height: 400px;
            overflow-y: auto;
        }

        .footer {
            background: #343a40;
            color: white;
            text-align: center;
            padding: 30px;
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
                font-size: 2.2em;
            }

            .content {
                padding: 20px;
            }

            .screenshots-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖥️ Interface de Avaliação</h1>
            <p>Relatório Completo - Testes UI + Snapshot do Supabase</p>
            <p style="margin-top: 15px; font-size: 0.9em;">
                Gerado em: ${new Date().toLocaleString('pt-BR')}
            </p>
        </div>

        <div class="content">
            <!-- Visão Geral dos Testes -->
            <div class="section">
                <h2>Testes Playwright</h2>
                <div class="metrics-grid">
                    <div class="metric-card success">
                        <div class="metric-value">${passedTests}</div>
                        <div class="metric-label">Testes Aprovados</div>
                    </div>
                    <div class="metric-card danger">
                        <div class="metric-value">${failedTests}</div>
                        <div class="metric-label">Testes Falharam</div>
                    </div>
                    <div class="metric-card ${successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'danger'}">
                        <div class="metric-value">${successRate}%</div>
                        <div class="metric-label">Taxa de Sucesso</div>
                    </div>
                    <div class="metric-card info">
                        <div class="metric-value">${totalTests}</div>
                        <div class="metric-label">Total de Testes</div>
                    </div>
                </div>

                <div class="test-results">
                    <h3 style="margin-bottom: 20px; color: #333;">Resultados Detalhados</h3>
                    ${playwrightResults.testResults?.map(test => `
                        <div class="test-item ${test.status === 'passed' ? 'success' : 'failure'}">
                            <div class="test-name">${test.title}</div>
                            <div class="test-status ${test.status === 'passed' ? 'status-passed' : 'status-failed'}">
                                ${test.status === 'passed' ? '✅ PASSOU' : '❌ FALHOU'}
                            </div>
                        </div>
                    `).join('') || '<p style="color: #666; font-style: italic;">Nenhum resultado detalhado disponível</p>'}
                </div>
            </div>

            <!-- Screenshots -->
            ${screenshots.length > 0 ? `
            <div class="section">
                <h2>Screenshots dos Testes</h2>
                <p style="margin-bottom: 20px; color: #666;">
                    Capturas de tela automáticas dos testes Playwright (${screenshots.length} imagens)
                </p>
                <div class="screenshots-grid">
                    ${screenshots.slice(0, 12).map((screenshot, index) => `
                        <div class="screenshot">
                            <div class="screenshot-title">Screenshot ${index + 1}</div>
                            <img src="${path.relative(path.resolve(__dirname, '..', 'reports'), screenshot)}" alt="Screenshot ${index + 1}" />
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Snapshot do Supabase -->
            <div class="section">
                <h2>📊 Snapshot do Supabase</h2>
                <p style="margin-bottom: 20px; color: #666;">
                    Estado atual dos dados de avaliação no banco (${supabaseSnapshot.generated_at})
                </p>

                <div class="metrics-grid">
                    <div class="metric-card info">
                        <div class="metric-value">${supabaseSnapshot.evaluations_overview.total_evaluations}</div>
                        <div class="metric-label">Total Avaliações</div>
                    </div>
                    <div class="metric-card success">
                        <div class="metric-value">${supabaseSnapshot.evaluations_overview.approved_count}</div>
                        <div class="metric-label">Aprovadas</div>
                    </div>
                    <div class="metric-card warning">
                        <div class="metric-value">${supabaseSnapshot.evaluations_overview.incorrect_count}</div>
                        <div class="metric-label">Incorretas</div>
                    </div>
                    <div class="metric-card ${supabaseSnapshot.evaluations_overview.approval_rate >= 80 ? 'success' : 'warning'}">
                        <div class="metric-value">${supabaseSnapshot.evaluations_overview.approval_rate.toFixed(1)}%</div>
                        <div class="metric-label">Taxa Aprovação</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px;">
                    <div>
                        <h3 style="color: #333; margin-bottom: 15px;">📈 Distribuição por Severidade</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Severidade</th>
                                    <th>Quantidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Baixa</td>
                                    <td>${supabaseSnapshot.severity_distribution.baixa}</td>
                                </tr>
                                <tr>
                                    <td>Média</td>
                                    <td>${supabaseSnapshot.severity_distribution.media}</td>
                                </tr>
                                <tr>
                                    <td>Muito Alta</td>
                                    <td>${supabaseSnapshot.severity_distribution.muito}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <h3 style="color: #333; margin-bottom: 15px;">🚩 Status das Flags</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Quantidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(supabaseSnapshot.flags_overview.status_distribution).map(([status, count]) => `
                                    <tr>
                                        <td>${status.charAt(0).toUpperCase() + status.slice(1)}</td>
                                        <td>${count}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Dados Técnicos -->
            <div class="section">
                <h2>🔧 Dados Técnicos</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h3 style="color: #333; margin-bottom: 15px;">Métricas de Flags</h3>
                        <div class="json-data">
${JSON.stringify({
    total_flags: supabaseSnapshot.flags_overview.total_flags,
    resolved_flags: supabaseSnapshot.flags_overview.resolved_flags,
    resolution_rate: supabaseSnapshot.flags_overview.resolution_rate
}, null, 2)}
                        </div>
                    </div>

                    <div>
                        <h3 style="color: #333; margin-bottom: 15px;">Configuração dos Testes</h3>
                        <div class="json-data">
{
  "framework": "Playwright",
  "browser": "Chromium, Firefox, Webkit",
  "viewport": "Desktop + Mobile",
  "baseURL": "http://localhost:5173",
  "total_test_files": 5,
  "test_categories": [
    "evaluations",
    "semantic-flags",
    "live-evaluation",
    "navigation",
    "accessibility"
  ]
}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cobertura de Funcionalidades -->
            <div class="section">
                <h2>✅ Funcionalidades Implementadas</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h4 style="color: #28a745; margin-bottom: 10px;">🎨 Interface</h4>
                        <ul style="color: #666; font-size: 0.9em;">
                            <li>✅ Páginas responsivas</li>
                            <li>✅ Componentes reutilizáveis</li>
                            <li>✅ Animações Framer Motion</li>
                            <li>✅ Tema dark consistente</li>
                        </ul>
                    </div>

                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h4 style="color: #28a745; margin-bottom: 10px;">🔄 Estado & API</h4>
                        <ul style="color: #666; font-size: 0.9em;">
                            <li>✅ React Query hooks</li>
                            <li>✅ Cache inteligente</li>
                            <li>✅ Tratamento de erros</li>
                            <li>✅ Loading states</li>
                        </ul>
                    </div>

                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h4 style="color: #28a745; margin-bottom: 10px;">🧪 Testes</h4>
                        <ul style="color: #666; font-size: 0.9em;">
                            <li>✅ Playwright E2E</li>
                            <li>✅ Acessibilidade</li>
                            <li>✅ Navegação</li>
                            <li>✅ Responsividade</li>
                        </ul>
                    </div>

                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h4 style="color: #28a745; margin-bottom: 10px;">🎯 Avaliação</h4>
                        <ul style="color: #666; font-size: 0.9em;">
                            <li>✅ Fluxo live</li>
                            <li>✅ Severidade dinâmica</li>
                            <li>✅ Limiares visuais</li>
                            <li>✅ Flags automáticas</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>🎭 Relatório gerado automaticamente pelos testes Playwright + Snapshot Supabase</p>
            <p>⚡ NeuroPgRag - Sistema de Chat AI com RAG + Avaliação de Qualidade</p>
            <p style="margin-top: 10px; font-size: 0.8em;">
                🧪 Testes executados com Playwright | 📊 Dados coletados do Supabase | 📄 Relatório gerado dinamicamente
            </p>
        </div>
    </div>
</body>
</html>`;

  // Criar diretório se não existir
  const reportsDir = path.resolve(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Salvar relatório HTML
  const htmlPath = path.resolve(reportsDir, 'interface-evaluations-report.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  // Salvar snapshot JSON
  const jsonPath = path.resolve(reportsDir, 'interface-evaluations-snapshot.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    playwright_results: playwrightResults,
    supabase_snapshot: supabaseSnapshot,
    screenshots_count: screenshots.length,
    generated_at: new Date().toISOString()
  }, null, 2), 'utf8');

  console.log(`✅ Relatório HTML salvo em: ${htmlPath}`);
  console.log(`✅ Snapshot JSON salvo em: ${jsonPath}`);
}

// Script principal
async function main() {
  try {
    console.log('🚀 Iniciando geração de relatório da interface...\n');

    // 1. Executar testes Playwright
    console.log('📋 ETAPA 1: Executando testes Playwright');
    console.log('─'.repeat(50));
    const playwrightResults = await runPlaywrightTests();

    // 2. Coletar snapshot do Supabase
    console.log('\n📊 ETAPA 2: Coletando dados do Supabase');
    console.log('─'.repeat(50));
    const supabaseSnapshot = await collectSupabaseSnapshot();

    // 3. Obter screenshots
    console.log('\n📸 ETAPA 3: Coletando screenshots');
    console.log('─'.repeat(50));
    const screenshots = getScreenshots();

    // 4. Gerar relatório HTML
    console.log('\n📄 ETAPA 4: Gerando relatório HTML');
    console.log('─'.repeat(50));
    generateHTMLReport(playwrightResults, supabaseSnapshot, screenshots);

    // 5. Resumo final
    console.log('\n🎉 RELATÓRIO DA INTERFACE GERADO COM SUCESSO!');
    console.log('─'.repeat(50));
    console.log(`🧪 Testes executados: ${playwrightResults.summary?.total || 0}`);
    console.log(`✅ Testes aprovados: ${playwrightResults.summary?.passed || 0}`);
    console.log(`❌ Testes falharam: ${playwrightResults.summary?.failed || 0}`);
    console.log(`📊 Avaliações no banco: ${supabaseSnapshot.evaluations_overview.total_evaluations}`);
    console.log(`🚩 Flags semânticas: ${supabaseSnapshot.flags_overview.total_flags}`);
    console.log(`📸 Screenshots gerados: ${screenshots.length}`);
    console.log('\n📁 Arquivos gerados:');
    console.log('   - reports/interface-evaluations-report.html');
    console.log('   - reports/interface-evaluations-snapshot.json');
    console.log('\n💡 Abra o arquivo HTML no navegador para visualizar o relatório completo!');
    console.log('🔗 Execute: npx playwright show-report reports/playwright-report para ver relatório detalhado dos testes');

  } catch (error) {
    console.error('❌ Erro geral durante geração do relatório:', error);
    process.exit(1);
  }
}

// Executar script
if (require.main === module) {
  main();
}
