import { useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Table } from '../../components/Table';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { useInteractions, useCreateInteraction, useDeleteInteraction } from '../../hooks/useInteractions';
import { useCustomers } from '../../hooks/useCustomers';
import { type Interaction } from '../../services/supabaseClient';

export default function InteractionsPage() {
  const { data: interactions = [], isLoading } = useInteractions();
  const { data: customers = [] } = useCustomers();
  const createInteraction = useCreateInteraction();
  const deleteInteraction = useDeleteInteraction();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    channel: 'chat' as 'chat' | 'email' | 'whatsapp' | 'phone',
    message: '',
    sentiment: 0,
  });

  const filteredInteractions = interactions.filter(interaction => {
    const matchesSearch = interaction.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = !channelFilter || interaction.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Gerar embedding sintético
      const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
      await createInteraction.mutateAsync({ ...formData, embedding });
      setIsModalOpen(false);
      setFormData({ customer_id: '', channel: 'chat', message: '', sentiment: 0 });
    } catch (error) {
      console.error('Erro ao criar interação:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta interação?')) {
      try {
        await deleteInteraction.mutateAsync(id);
      } catch (error) {
        console.error('Erro ao deletar interação:', error);
      }
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-500';
    if (sentiment < -0.3) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.3) return 'Positivo';
    if (sentiment < -0.3) return 'Negativo';
    return 'Neutro';
  };

  const columns = [
    { 
      key: 'customer_id', 
      label: 'Cliente',
      render: (interaction: Interaction) => {
        const customer = customers.find(c => c.id === interaction.customer_id);
        return customer?.name || 'Desconhecido';
      }
    },
    { 
      key: 'channel', 
      label: 'Canal',
      render: (interaction: Interaction) => (
        <span className="px-2 py-1 rounded bg-primary/20 text-primary text-xs">
          {interaction.channel}
        </span>
      )
    },
    { 
      key: 'message', 
      label: 'Mensagem',
      render: (interaction: Interaction) => (
        <span className="line-clamp-2">{interaction.message}</span>
      )
    },
    { 
      key: 'sentiment', 
      label: 'Sentimento',
      render: (interaction: Interaction) => {
        const sentiment = interaction.sentiment || 0;
        return (
          <span className={getSentimentColor(sentiment)}>
            {getSentimentLabel(sentiment)}
          </span>
        );
      }
    },
    { 
      key: 'created_at', 
      label: 'Data',
      render: (interaction: Interaction) => 
        new Date(interaction.created_at).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (interaction: Interaction) => (
        <Button
          size="sm"
          variant="danger"
          icon="delete"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(interaction.id);
          }}
        >
          Deletar
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Interações</h1>
            <p className="text-white/60 mt-1">Histórico de comunicações com clientes</p>
          </div>
          <Button icon="add" onClick={() => setIsModalOpen(true)}>
            Nova Interação
          </Button>
        </div>

        <div className="flex gap-4">
          <Input
            icon="search"
            placeholder="Buscar interações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
          >
            <option value="">Todos os canais</option>
            <option value="chat">Chat</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Telefone</option>
          </select>
        </div>

        <Table
          data={filteredInteractions}
          columns={columns}
          loading={isLoading}
          emptyMessage="Nenhuma interação encontrada"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Interação"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Cliente *
            </label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
              required
            >
              <option value="">Selecione um cliente</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Canal *
            </label>
            <select
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
              required
            >
              <option value="chat">Chat</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Telefone</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Mensagem *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-primary"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Sentimento (-1 a 1)
            </label>
            <input
              type="number"
              step="0.1"
              min="-1"
              max="1"
              value={formData.sentiment}
              onChange={(e) => setFormData({ ...formData, sentiment: parseFloat(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createInteraction.isPending}>
              Criar Interação
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
