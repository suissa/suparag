import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Table, type Column } from '../../components/Table';
import { useSemanticFlags, useSemanticFlagOperations, type SemanticFlag } from '../../hooks/useSemanticFlags';
import { SemanticFlagModal } from '../../components/SemanticFlagModal';

const SemanticFlagsPage = () => {
  const [selectedFlag, setSelectedFlag] = useState<SemanticFlag | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pendente'
  });

  const { data: flags = [], isLoading, error } = useSemanticFlags(filters);
  const updateFlagStatusMutation = useSemanticFlagOperations();

  const handleViewFlag = (flag: SemanticFlag) => {
    setSelectedFlag(flag);
    setShowModal(true);
  };

  const handleUpdateStatus = async (flagId: string, status: 'pendente' | 'aprovado' | 'eliminado') => {
    try {
      await updateFlagStatusMutation.updateFlagStatus(flagId, status);
      setShowModal(false);
      setSelectedFlag(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      // Em produção, mostrar toast de erro
    }
  };

  const columns: Column<SemanticFlag>[] = [
    {
      key: 'question_text',
      label: 'Pergunta',
      render: (flag) => (
        <div className="max-w-xs truncate" title={flag.question_text}>
          {flag.question_text}
        </div>
      ),
    },
    {
      key: 'flag_reason',
      label: 'Motivo da Flag',
      render: (flag) => (
        <div className="max-w-sm" title={flag.flag_reason}>
          {flag.flag_reason}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (flag) => {
        const statusConfig = {
          pendente: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
          aprovado: { color: 'bg-green-100 text-green-800', label: 'Aprovado' },
          eliminado: { color: 'bg-red-100 text-red-800', label: 'Eliminado' }
        } as const;

        const config = statusConfig[flag.status];

        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Criado em',
      render: (flag) => new Date(flag.created_at).toLocaleDateString('pt-BR'),
    },
    {
      key: 'resolved_at',
      label: 'Resolvido em',
      render: (flag) => flag.resolved_at
        ? new Date(flag.resolved_at).toLocaleDateString('pt-BR')
        : '-',
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (flag) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewFlag(flag)}
          >
            Revisar
          </Button>
          {flag.status === 'pendente' && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleUpdateStatus(flag.id, 'aprovado')}
              >
                Aprovar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleUpdateStatus(flag.id, 'eliminado')}
              >
                Eliminar
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-12">
            <div className="text-red-500 text-lg font-medium mb-2">
              Erro ao carregar flags semânticas
            </div>
            <div className="text-gray-600">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Flags Semânticas
            </h1>
            <p className="text-gray-400">
              Curadoria de respostas problemáticas identificadas automaticamente
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {flags.length}
            </div>
            <div className="text-sm text-gray-400">Total de Flags</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {flags.filter((f: any) => f.status === 'pendente').length}
            </div>
            <div className="text-sm text-gray-400">Pendentes</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {flags.filter((f: any) => f.status === 'aprovado').length}
            </div>
            <div className="text-sm text-gray-400">Aprovadas</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {flags.filter((f: any) => f.status === 'eliminado').length}
            </div>
            <div className="text-sm text-gray-400">Eliminadas</div>
          </Card>
        </motion.div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                <option value="pendente">Pendente</option>
                <option value="aprovado">Aprovado</option>
                <option value="eliminado">Eliminado</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Tabela */}
        <Card>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-400">Carregando flags semânticas...</div>
            </div>
          ) : (
            <Table
              columns={columns}
              data={flags}
              emptyMessage="Nenhuma flag semântica encontrada"
            />
          )}
        </Card>
      </motion.div>

      {/* Modal de Detalhes */}
      <SemanticFlagModal
        flag={selectedFlag}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedFlag(null);
        }}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default SemanticFlagsPage;
