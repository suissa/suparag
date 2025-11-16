import { analyzeAllLeads, computeEngagementMetrics, detectAbandonmentPoints, analyzeConversionIntent } from '../analytics/leadAnalysis';
import { ensureDirectory, writeJsonFile } from '../utils/files';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ReportData {
  generatedAt: string;
  summary: {
    totalLeads: number;
    hotLeads: number;
    activeLeads: number;
    coldLeads: number;
    avgConversionProbability: number;
  };
  leads: any[];
}

/**
 * Gera relatório HTML com métricas de leads
 */
export async function generateLeadReport(outputDir: string = 'reports'): Promise<void> {
  try {
    console.log('📊 Gerando relatório de leads...');

    // Garantir que o diretório existe
    await ensureDirectory(outputDir);

    // Analisar todos os leads
    const metrics = await analyzeAllLeads();

    // Calcular resumo
    const summary = {
      totalLeads: metrics.length,
      hotLeads: metrics.filter(m => m.status === 'quente' || m.status === 'em_negociacao').length,
      activeLeads: metrics.filter(m => m.status === 'ativo').length,
      coldLeads: metrics.filter(m => m.status === 'frio').length,
      avgConversionProbability: metrics.reduce((sum, m) => sum + m.conversionProbability, 0) / metrics.length || 0
    };

    // Preparar dados do relatório
    const reportData: ReportData = {
      generatedAt: new Date().toISOString(),
      summary,
      leads: metrics
    };

    // Gerar JSON
    const jsonPath = path.join(outputDir, 'lead-insights.json');
    await writeJsonFile(jsonPath, reportData);

    // Gerar HTML
    const htmlPath = path.join(outputDir, 'lead-insights.html');
    const html = generateHTML(reportData);
    await fs.writeFile(htmlPath, html, 'utf-8');

    console.log(`✅ Relatório JSON salvo em: ${jsonPath}`);
    console.log(`✅ Relatório HTML salvo em: ${htmlPath}`);

  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
    throw error;
  }
}

function generateHTML(data: ReportData): string {
  const { summary, leads } = data;

  // Top 10 leads por probabilidade de conversão
  const topLeads = leads.slice(0, 10);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Leads - WhatsApp CRM</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }

    .timestamp {
      opacity: 0.9;
      font-size: 0.9em;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }

    .summary-card {
      background: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
      transition: transform 0.3s;
    }

    .summary-card:hover {
      transform: translateY(-5px);
    }

    .summary-card h3 {
      color: #667eea;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }

    .summary-card .value {
      font-size: 2.5em;
      font-weight: bold;
      color: #333;
    }

    .charts {
      padding: 40px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
    }

    .chart-container {
      background: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .chart-container h2 {
      margin-bottom: 20px;
      color: #667eea;
    }

    .leads-table {
      padding: 40px;
    }

    .leads-table h2 {
      margin-bottom: 20px;
      color: #667eea;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    th, td {
      padding: 15px;
      text-align: left;
    }

    tbody tr:nth-child(even) {
      background: #f8f9fa;
    }

    tbody tr:hover {
      background: #e9ecef;
    }

    .status-badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: bold;
      text-transform: uppercase;
    }

    .status-quente { background: #ff6b6b; color: white; }
    .status-em_negociacao { background: #ff922b; color: white; }
    .status-ativo { background: #51cf66; color: white; }
    .status-novo { background: #4dabf7; color: white; }
    .status-frio { background: #868e96; color: white; }

    .probability {
      font-weight: bold;
      font-size: 1.1em;
    }

    .probability.high { color: #51cf66; }
    .probability.medium { color: #ff922b; }
    .probability.low { color: #868e96; }

    footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Relatório de Leads WhatsApp</h1>
      <p class="timestamp">Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
    </header>

    <div class="summary">
      <div class="summary-card">
        <h3>Total de Leads</h3>
        <div class="value">${summary.totalLeads}</div>
      </div>
      <div class="summary-card">
        <h3>Leads Quentes</h3>
        <div class="value">${summary.hotLeads}</div>
      </div>
      <div class="summary-card">
        <h3>Leads Ativos</h3>
        <div class="value">${summary.activeLeads}</div>
      </div>
      <div class="summary-card">
        <h3>Leads Frios</h3>
        <div class="value">${summary.coldLeads}</div>
      </div>
      <div class="summary-card">
        <h3>Prob. Conversão Média</h3>
        <div class="value">${summary.avgConversionProbability.toFixed(1)}%</div>
      </div>
    </div>

    <div class="charts">
      <div class="chart-container">
        <h2>Distribuição por Status</h2>
        <canvas id="statusChart"></canvas>
      </div>
      <div class="chart-container">
        <h2>Top 10 Leads por Conversão</h2>
        <canvas id="conversionChart"></canvas>
      </div>
    </div>

    <div class="leads-table">
      <h2>🔥 Top 10 Leads Prioritários</h2>
      <table>
        <thead>
          <tr>
            <th>Posição</th>
            <th>Cliente ID</th>
            <th>Status</th>
            <th>Mensagens</th>
            <th>Sentimento</th>
            <th>Prob. Conversão</th>
            <th>Última Interação</th>
          </tr>
        </thead>
        <tbody>
          ${topLeads.map((lead, index) => `
            <tr>
              <td><strong>#${index + 1}</strong></td>
              <td>${lead.customerId.substring(0, 8)}...</td>
              <td><span class="status-badge status-${lead.status}">${lead.status}</span></td>
              <td>${lead.totalMessages}</td>
              <td>${lead.avgSentiment > 0 ? '😊' : lead.avgSentiment < 0 ? '😞' : '😐'} ${lead.avgSentiment.toFixed(2)}</td>
              <td><span class="probability ${lead.conversionProbability > 70 ? 'high' : lead.conversionProbability > 40 ? 'medium' : 'low'}">${lead.conversionProbability.toFixed(0)}%</span></td>
              <td>${lead.lastInteractionDays.toFixed(1)} dias</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <footer>
      <p>Relatório gerado automaticamente pelo NeuroPgRag CRM</p>
      <p>© 2025 - Todos os direitos reservados</p>
    </footer>
  </div>

  <script>
    // Gráfico de Status
    const statusData = ${JSON.stringify(getStatusDistribution(leads))};
    new Chart(document.getElementById('statusChart'), {
      type: 'doughnut',
      data: {
        labels: statusData.labels,
        datasets: [{
          data: statusData.values,
          backgroundColor: [
            '#ff6b6b',
            '#ff922b',
            '#51cf66',
            '#4dabf7',
            '#868e96'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    // Gráfico de Conversão
    const conversionData = ${JSON.stringify(getTopConversions(topLeads))};
    new Chart(document.getElementById('conversionChart'), {
      type: 'bar',
      data: {
        labels: conversionData.labels,
        datasets: [{
          label: 'Probabilidade de Conversão (%)',
          data: conversionData.values,
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  </script>
</body>
</html>
  `;
}

function getStatusDistribution(leads: any[]) {
  const distribution: { [key: string]: number } = {};
  
  leads.forEach(lead => {
    distribution[lead.status] = (distribution[lead.status] || 0) + 1;
  });

  return {
    labels: Object.keys(distribution),
    values: Object.values(distribution)
  };
}

function getTopConversions(leads: any[]) {
  return {
    labels: leads.map((_, i) => `Lead #${i + 1}`),
    values: leads.map(l => l.conversionProbability)
  };
}
