import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Table } from '../../components/Table';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from '../../hooks/useTickets';
import { useCustomers } from '../../hooks/useCustomers';
import { Ticket } from '../../services/supabaseClient';

export default function TicketsPage() {
  const { data: tickets = [], isLoading } = useTickets();
  const { data: customers = [] } = useCustomers();
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    subject: '',
    description: '',
    status: 'open' as 'open' | 'in_progress' | 'resolved' | 'closed',
  });

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTicket.mutateAsync(formData);
      setIsModalOpen(false);
      setFormData({ customer_id: '', subject: '', description: '', status: 'open' });
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
    }
  };

  const handleStatusChange = async (id: string, status: Ticket['status']) => {
    try {
      await updateTicket.mutateAsync({ 
        id, 
        status,
        ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este ticket?')) {
      try {
        await deleteTicket.mutateAsync(id);
      } catch (error) {
        console.error('Erro ao deletar ticket:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-500/20 text-yellow-500';
      case 'in_progress': return 'bg-blue-500/20 text-blue-500';
      case 'resolved': return 'bg-green-500/20 text-green-500';
      case 'closed': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Progresso';
      case 'resolved': return 'Resolvido';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  const columns = [
    { 
      key: 'customer_id', 
      label: 'Cliente',
      render: (ticket: Ticket) => {
        const customer = customers.find(c => c.id === ticket.customer_id);
        return customer?.name || 'Desconhecido';
      }
    },
    { key: 'subject', label: 'Assunto' },
    { 
      key: 'status', 
      label: 'Status',
      render: (ticket: Ticket) => (
        <motion.span
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
        >
          {getStatusLabel(ticket.status)}
        </motion.span>
      )
    },
    { 
      key: 'satisfaction', 
      label: 'Satisfação',
      render: (ticket: Ticket) => 
        ticket.satisfaction ? `${ticket.satisfaction.toFixed(1)} ⭐` : '-'
    },
    { 
      key: 'created_at', 
      label: 'Criado em',
      render: (ticket: Ticket) => 
        new Date(ticket.created_at).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (ticket: Ticket) => (
        <div className="flex gap-2">
          {ticket.status !== 'resolved' && (
            <Button
              size="sm"
              variant="secondary"
              icon="check"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(ticket.id, 'resolved');
              }}
            >
              Resolver
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            icon="delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(ticket.id);
            }}
          >
            Deletar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Tickets</h1>
            <p className="text-white/60 mt-1">Gerencie tickets de suporte</p>
          </div>
          <Button icon="add" onClick={() => setIsModalOpen(true)}>
            Novo Ticket
          </Button>
        </div>

        <div className="flex gap-4">
          <Input
            icon="search"
            placeholder="Buscar tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
          >
            <option value="">Todos os status</option>
            <option value="open">Aberto</option>
            <option value="in_progress">Em Progresso</option>
            <option value="resolved">Resolvido</option>
            <option value="closed">Fechado</option>
          </select>
        </div>

        <Table
          data={filteredTickets}
          columns={columns}
          loading={isLoading}
          emptyMessage="Nenhum ticket encontrado"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Ticket"
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
          
          <Input
            label="Assunto *"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-primary"
              rows={4}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createTicket.isPending}>
              Criar Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
