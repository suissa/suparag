import { Modal } from './Modal';
import type { Evaluation } from '../hooks/useEvaluations';

interface EvaluationDetailsModalProps {
  evaluation: Evaluation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EvaluationDetailsModal({
  evaluation,
  isOpen,
  onClose
}: EvaluationDetailsModalProps) {
  if (!evaluation) return null;

  const getRatingColor = (rating: string) => {
    return rating === 'aprovado'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'baixa': return 'bg-yellow-100 text-yellow-800';
      case 'media': return 'bg-orange-100 text-orange-800';
      case 'muito': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingLabel = (rating: string) => {
    return rating === 'aprovado' ? 'Aprovado' : 'Incorreto';
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'baixa': return 'Baixa';
      case 'media': return 'Média';
      case 'muito': return 'Muito Alta';
      default: return 'N/A';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes da Avaliação">
      <div className="space-y-6">
        {/* Status da Avaliação */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-400">Avaliação:</span>
            <div className="mt-1">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(evaluation.rating)}`}>
                {getRatingLabel(evaluation.rating)}
              </span>
            </div>
          </div>
          {evaluation.severity && (
            <div>
              <span className="text-sm text-gray-400">Severidade:</span>
              <div className="mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(evaluation.severity)}`}>
                  {getSeverityLabel(evaluation.severity)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pergunta */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Pergunta</h3>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-300 leading-relaxed">{evaluation.question_text}</p>
          </div>
        </div>

        {/* Resposta */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Resposta</h3>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-300 leading-relaxed">{evaluation.answer_text}</p>
          </div>
        </div>

        {/* Fontes Utilizadas */}
        {evaluation.used_sources && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Fontes Utilizadas</h3>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-300">Documento ID:</span>
                    <div className="text-gray-400 font-mono">{evaluation.used_sources.document_id}</div>
                  </div>
                  {evaluation.used_sources.chunk_ids && (
                    <div>
                      <span className="font-medium text-gray-300">Chunks:</span>
                      <div className="text-gray-400">{evaluation.used_sources.chunk_ids.length} chunks</div>
                    </div>
                  )}
                </div>

                {evaluation.used_sources.chunk_ids && (
                  <div>
                    <span className="font-medium text-gray-300">IDs dos Chunks:</span>
                    <div className="text-gray-400 font-mono text-xs mt-1">
                      {evaluation.used_sources.chunk_ids.join(', ')}
                    </div>
                  </div>
                )}

                {evaluation.used_sources.context && (
                  <div>
                    <span className="font-medium text-gray-300">Contexto Relevante:</span>
                    <div className="text-gray-300 italic mt-1 p-3 bg-gray-800 rounded border-l-4 border-blue-500">
                      "{evaluation.used_sources.context}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notas */}
        {evaluation.notes && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Notas da Avaliação</h3>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-200 leading-relaxed">{evaluation.notes}</p>
            </div>
          </div>
        )}

        {/* Informações Técnicas */}
        <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-700">
          <div>
            <span className="text-gray-400">ID da Interação:</span>
            <div className="text-gray-300 font-mono text-xs mt-1 break-all">
              {evaluation.interaction_id}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Avaliado em:</span>
            <div className="text-gray-300 mt-1">
              {new Date(evaluation.created_at).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Flag Associada (se existir) */}
        {evaluation.flag_id && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-yellow-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-yellow-300 font-medium">Flag Semântica Associada</h4>
                <p className="text-yellow-200 text-sm">
                  Esta avaliação gerou uma flag semântica para curadoria devido aos limiares atingidos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botão Fechar */}
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
