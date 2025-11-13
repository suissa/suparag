import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Modal } from './Modal';
import type { SemanticFlag } from '../hooks/useSemanticFlags';

interface SemanticFlagModalProps {
  flag: SemanticFlag | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (flagId: string, status: 'pendente' | 'aprovado' | 'eliminado') => void;
}

export function SemanticFlagModal({
  flag,
  isOpen,
  onClose,
  onUpdateStatus
}: SemanticFlagModalProps) {
  const [selectedAction, setSelectedAction] = useState<'aprovado' | 'eliminado' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAction = async (action: 'aprovado' | 'eliminado') => {
    if (!flag) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(flag.id, action);
    } catch (error) {
      console.error('Erro ao atualizar flag:', error);
    } finally {
      setIsUpdating(false);
      setSelectedAction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'eliminado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'aprovado': return 'Aprovado';
      case 'eliminado': return 'Eliminado';
      default: return status;
    }
  };

  if (!flag) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Revisão de Flag Semântica">
      <div className="space-y-6">
        {/* Status Atual */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Status Atual:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(flag.status)}`}>
            {getStatusLabel(flag.status)}
          </span>
        </div>

        {/* Motivo da Flag */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Motivo da Flag</h3>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-200">{flag.flag_reason}</p>
          </div>
        </div>

        {/* Pergunta */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Pergunta</h3>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-300 leading-relaxed">{flag.question_text}</p>
          </div>
        </div>

        {/* Resposta */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Resposta Problemática</h3>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-300 leading-relaxed">{flag.answer_text}</p>
          </div>
        </div>

        {/* Fontes Utilizadas */}
        {flag.used_sources && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Fontes Utilizadas</h3>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 space-y-2">
                <div>
                  <span className="font-medium text-gray-300">Documento:</span>{' '}
                  {flag.used_sources.document_id}
                </div>
                {flag.used_sources.chunk_ids && (
                  <div>
                    <span className="font-medium text-gray-300">Chunks:</span>{' '}
                    {flag.used_sources.chunk_ids.join(', ')}
                  </div>
                )}
                {flag.used_sources.context && (
                  <div>
                    <span className="font-medium text-gray-300">Contexto:</span>{' '}
                    <span className="text-gray-300 italic">
                      "{flag.used_sources.context.substring(0, 200)}..."
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contadores de Disapproval */}
        {flag.disapproval_counters && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Contadores de Reprovação</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {flag.disapproval_counters.baixa || 0}
                </div>
                <div className="text-sm text-yellow-300">Severidade Baixa</div>
              </div>
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {flag.disapproval_counters.media || 0}
                </div>
                <div className="text-sm text-orange-300">Severidade Média</div>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {flag.disapproval_counters.muito || 0}
                </div>
                <div className="text-sm text-red-300">Severidade Muito Alta</div>
              </div>
            </div>
          </div>
        )}

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Criado em:</span>
            <div className="text-white font-medium">
              {new Date(flag.created_at).toLocaleString('pt-BR')}
            </div>
          </div>
          {flag.resolved_at && (
            <div>
              <span className="text-gray-400">Resolvido em:</span>
              <div className="text-white font-medium">
                {new Date(flag.resolved_at).toLocaleString('pt-BR')}
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        {flag.status === 'pendente' && (
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Decisão de Curadoria</h3>

            <AnimatePresence mode="wait">
              {!selectedAction ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => setSelectedAction('aprovado')}
                    className="flex items-center justify-center space-x-2"
                  >
                    <span>✅</span>
                    <span>Aprovar Flag</span>
                  </Button>

                  <Button
                    variant="danger"
                    size="lg"
                    onClick={() => setSelectedAction('eliminado')}
                    className="flex items-center justify-center space-x-2"
                  >
                    <span>❌</span>
                    <span>Eliminar Flag</span>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-semibold text-white mb-2">
                      Confirmar Ação
                    </h4>
                    <p className="text-gray-300">
                      Tem certeza que deseja {selectedAction === 'aprovado' ? 'aprovar' : 'eliminar'} esta flag?
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                    variant="outline"
                    onClick={() => setSelectedAction(null)}
                    disabled={isUpdating}
                    className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant={selectedAction === 'aprovado' ? 'success' : 'danger'}
                      onClick={() => handleAction(selectedAction)}
                      loading={isUpdating}
                      className="flex-1"
                    >
                      {selectedAction === 'aprovado' ? 'Aprovar' : 'Eliminar'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Botão Fechar */}
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
