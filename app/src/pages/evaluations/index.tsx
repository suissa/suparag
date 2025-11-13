import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Table, type Column } from '../../components/Table';
import { useEvaluations, type Evaluation } from '../../hooks/useEvaluations';
import { EvaluationDetailsModal } from '../../components/EvaluationDetailsModal';

const EvaluationsPage = () => {
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    rating: '',
    severity: '',
    limit: 50
  });

  const { data: evaluations = [], isLoading, error } = useEvaluations(filters);

  const handleViewDetails = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setShowDetailsModal(true);
  };

  const columns: Column<Evaluation>[] = [
    {
      key: 'question_text',
      label: 'Pergunta',
      render: (evaluation) => (
        <div className="max-w-xs truncate" title={evaluation.question_text}>
          {evaluation.question_text}
        </div>
      ),
    },
    {
      key: 'answer_text',
      label: 'Resposta',
      render: (evaluation) => (
        <div className="max-w-xs truncate" title={evaluation.answer_text}>
          {evaluation.answer_text}
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Avaliação',
      render: (evaluation) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          evaluation.rating === 'aprovado'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {evaluation.rating === 'aprovado' ? 'Aprovado' : 'Incorreto'}
        </span>
      ),
    },
    {
      key: 'severity',
      label: 'Severidade',
      render: (evaluation) => {
        if (!evaluation.severity) {
          return <span className="text-gray-400">-</span>;
        }

        const colors = {
          baixa: 'bg-yellow-100 text-yellow-800',
          media: 'bg-orange-100 text-orange-800',
          muito: 'bg-red-100 text-red-800'
        } as const;

        const severity = evaluation.severity as keyof typeof colors;

        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${colors[severity]}`}>
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Data',
      render: (evaluation) => new Date(evaluation.created_at).toLocaleDateString('pt-BR'),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (evaluation) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(evaluation)}
        >
          Detalhes
        </Button>
      ),
    },
  ];

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-12">
            <div className="text-red-500 text-lg font-medium mb-2">
              Erro ao carregar avaliações
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
              Avaliações de Respostas
            </h1>
            <p className="text-gray-400">
              Gerencie e visualize todas as avaliações realizadas no sistema
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Avaliação
              </label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                <option value="aprovado">Aprovado</option>
                <option value="incorreto">Incorreto</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Severidade
              </label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="muito">Muito Alta</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Limite
              </label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={25}>25 registros</option>
                <option value={50}>50 registros</option>
                <option value={100}>100 registros</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Tabela */}
        <Card>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-400">Carregando avaliações...</div>
            </div>
          ) : (
            <Table
              columns={columns}
              data={evaluations}
              emptyMessage="Nenhuma avaliação encontrada"
            />
          )}
        </Card>
      </motion.div>

      {/* Modal de Detalhes */}
      <EvaluationDetailsModal
        evaluation={selectedEvaluation}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvaluation(null);
        }}
      />
    </div>
  );
};

export default EvaluationsPage;
