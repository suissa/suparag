import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Table } from '../../components/Table';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { useCustomers, useCreateCustomer, useDeleteCustomer } from '../../hooks/useCustomers';
import type { Customer } from '../../services/supabaseClient';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const deleteCustomer = useDeleteCustomer();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    segment: '',
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.company?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createCustomer.mutateAsync(formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', company: '', segment: '' });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este cliente?')) {
      try {
        await deleteCustomer.mutateAsync(id);
      } catch (error) {
        console.error('Erro ao deletar cliente:', error);
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'company', label: 'Empresa' },
    { 
      key: 'total_spent', 
      label: 'Gasto Total',
      render: (customer: Customer) => 
        customer.total_spent ? `R$ ${customer.total_spent.toFixed(2)}` : '-'
    },
    { 
      key: 'churn_risk', 
      label: 'Risco Churn',
      render: (customer: Customer) => {
        const risk = customer.churn_risk || 0;
        const color = risk > 0.7 ? 'text-red-500' : risk > 0.4 ? 'text-yellow-500' : 'text-green-500';
        return <span className={color}>{(risk * 100).toFixed(0)}%</span>;
      }
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (customer: Customer) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon="visibility"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customers/${customer.id}`);
            }}
          >
            Ver
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon="delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(customer.id);
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
            <h1 className="text-3xl font-bold text-white">Clientes</h1>
            <p className="text-white/60 mt-1">Gerencie seus clientes e relacionamentos</p>
          </div>
          <Button icon="add" onClick={() => setIsModalOpen(true)}>
            Novo Cliente
          </Button>
        </div>

        <div className="flex gap-4">
          <Input
            icon="search"
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        <Table
          data={filteredCustomers}
          columns={columns}
          loading={isLoading}
          emptyMessage="Nenhum cliente encontrado"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Cliente"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Telefone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Empresa"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
          <Input
            label="Segmento"
            value={formData.segment}
            onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createCustomer.isPending}>
              Criar Cliente
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
