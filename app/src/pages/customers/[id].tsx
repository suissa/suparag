import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useCustomer } from '../../hooks/useCustomers';
import { useInteractions } from '../../hooks/useInteractions';
import { useTickets } from '../../hooks/useTickets';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(id!);
  const { data: interactions = [] } = useInteractions(id);
  const { data: tickets = [] } = useTickets(id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-white/60">Cliente não encontrado</p>
          <Button onClick={() => navigate('/customers')} className="mt-4">
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" icon="arrow_back" onClick={() => navigate('/customers')}>
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-white mt-4">{customer.name}</h1>
            <p className="text-white/60 mt-1">{customer.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Informações" icon="person">
            <div className="space-y-3">
              <div>
                <p className="text-white/60 text-sm">Empresa</p>
                <p className="text-white">{customer.company || '-'}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Telefone</p>
                <p className="text-white">{customer.phone || '-'}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Segmento</p>
                <p className="text-white">{customer.segment || '-'}</p>
              </div>
            </div>
          </Card>

          <Card title="Métricas" icon="analytics">
            <div className="space-y-3">
              <div>
                <p className="text-white/60 text-sm">Gasto Total</p>
                <p className="text-white text-2xl font-bold">
                  R$ {(customer.total_spent || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Risco de Churn</p>
                <p className="text-white text-2xl font-bold">
                  {((customer.churn_risk || 0) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>

          <Card title="Atividade" icon="timeline">
            <div className="space-y-3">
              <div>
                <p className="text-white/60 text-sm">Interações</p>
                <p className="text-white text-2xl font-bold">{interactions.length}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Tickets</p>
                <p className="text-white text-2xl font-bold">{tickets.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Histórico de Interações" icon="chat">
          {interactions.length === 0 ? (
            <p className="text-white/60 text-center py-8">Nenhuma interação registrada</p>
          ) : (
            <div className="space-y-4">
              {interactions.slice(0, 5).map((interaction) => (
                <div key={interaction.id} className="border-b border-white/10 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-primary text-sm font-medium">{interaction.channel}</span>
                    <span className="text-white/60 text-sm">
                      {new Date(interaction.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white">{interaction.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Tickets" icon="confirmation_number">
          {tickets.length === 0 ? (
            <p className="text-white/60 text-center py-8">Nenhum ticket registrado</p>
          ) : (
            <div className="space-y-4">
              {tickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="border-b border-white/10 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{ticket.subject}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      ticket.status === 'open' ? 'bg-yellow-500/20 text-yellow-500' :
                      ticket.status === 'resolved' ? 'bg-green-500/20 text-green-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  {ticket.description && (
                    <p className="text-white/60 text-sm">{ticket.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
