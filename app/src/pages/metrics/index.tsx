import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Card';
import { useMetrics } from '../../hooks/useMetrics';
import { useLeadAnalysis } from '../../hooks/useLeads';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function MetricsPage() {
  const { data: metrics, isLoading: isMetricsLoading } = useMetrics();
  const { data: leadAnalysis, isLoading: isLeadsLoading } = useLeadAnalysis();

  const isLoading = isMetricsLoading || isLeadsLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!metrics || !leadAnalysis) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-white/60">
          Erro ao carregar métricas
        </div>
      </DashboardLayout>
    );
  }

  const ticketsData = Object.entries(metrics.ticketsByStatus).map(([name, value]) => ({
    name: name === 'open' ? 'Aberto' : 
          name === 'in_progress' ? 'Em Progresso' : 
          name === 'resolved' ? 'Resolvido' : 'Fechado',
    value,
  }));

  const interactionsData = Object.entries(metrics.interactionsByChannel).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Preparar dados para gráficos de leads
  const statusDistribution = leadAnalysis.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusDistributionData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name === 'novo' ? 'Novo' : 
          name === 'ativo' ? 'Ativo' : 
          name === 'quente' ? 'Quente' : 
          name === 'em_negociacao' ? 'Em Negociação' : 
          name === 'convertido' ? 'Convertido' : 'Frio',
    value,
  }));

  // Top 5 leads por probabilidade de conversão
  const topLeads = [...leadAnalysis]
    .sort((a, b) => b.conversionProbability - a.conversionProbability)
    .slice(0, 5)
    .map(lead => ({
      name: `Lead ${lead.customerId.substring(0, 8)}`,
      probability: lead.conversionProbability
    }));

  const COLORS = ['#13a4ec', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const StatCard = ({ title, value, icon, color = 'primary' }: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#111c22] rounded-xl p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm mb-1">{title}</p>
          <p className={`text-3xl font-bold text-${color}`}>{value}</p>
        </div>
        <div className={`bg-${color}/20 rounded-full p-4`}>
          <span className={`material-symbols-outlined text-${color} text-3xl`}>
            {icon}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Métricas</h1>
          <p className="text-white/60 mt-1">Visão geral do desempenho do CRM</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Clientes"
            value={metrics.totalCustomers}
            icon="people"
            color="primary"
          />
          <StatCard
            title="Tickets Abertos"
            value={metrics.openTickets}
            icon="confirmation_number"
            color="yellow-500"
          />
          <StatCard
            title="Risco Churn Médio"
            value={`${(metrics.avgChurnRisk * 100).toFixed(1)}%`}
            icon="trending_down"
            color="red-500"
          />
          <StatCard
            title="Sentimento Médio"
            value={metrics.avgSentiment.toFixed(2)}
            icon="sentiment_satisfied"
            color="green-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Tickets por Status" icon="pie_chart">
            {ticketsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ticketsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ticketsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111c22', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/60 text-center py-12">Nenhum ticket registrado</p>
            )}
          </Card>

          <Card title="Interações por Canal" icon="bar_chart">
            {interactionsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={interactionsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {interactionsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111c22', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/60 text-center py-12">Nenhuma interação registrada</p>
            )}
          </Card>
        </div>

        {/* Seção de Análise de Leads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Distribuição de Status dos Leads" icon="leaderboard">
            {statusDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111c22', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/60 text-center py-12">Nenhum lead registrado</p>
            )}
          </Card>

          <Card title="Top Leads por Probabilidade de Conversão" icon="trending_up">
            {topLeads.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topLeads}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    tick={{ fill: '#fff' }} 
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    scale="band" 
                    tick={{ fill: '#fff' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111c22', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`${value}%`, 'Probabilidade']}
                  />
                  <Bar dataKey="probability" fill="#13a4ec" name="Probabilidade de Conversão">
                    {topLeads.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/60 text-center py-12">Nenhum lead registrado</p>
            )}
          </Card>
        </div>

        <Card title="Resumo Detalhado" icon="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-3">Tickets por Status</h4>
              <div className="space-y-2">
                {Object.entries(metrics.ticketsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-white/70 capitalize">{status}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Interações por Canal</h4>
              <div className="space-y-2">
                {Object.entries(metrics.interactionsByChannel).map(([channel, count]) => (
                  <div key={channel} className="flex items-center justify-between">
                    <span className="text-white/70 capitalize">{channel}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}