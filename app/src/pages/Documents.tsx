import { useState, useEffect } from 'react';
import { FileText, Trash2, Eye, RefreshCw } from 'lucide-react';
import { documentsAPI } from '../services/api';

export default function Documents() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentsAPI.list();
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente deletar este documento?')) return;
    
    try {
      await documentsAPI.delete(id);
      loadDocuments();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const handleView = async (id: string) => {
    try {
      const response = await documentsAPI.get(id);
      setSelectedDoc(response.data.document);
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Documentos</h1>
          <p className="text-gray-600 mt-1">{documents.length} documentos cadastrados</p>
        </div>
        <button
          onClick={loadDocuments}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw size={18} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando documentos...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">Nenhum documento encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <FileText className="text-blue-600 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">{doc.title}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>{doc.type.toUpperCase()}</span>
                      <span>{formatFileSize(doc.size)}</span>
                      <span>{doc.characterCount?.toLocaleString()} caracteres</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(doc.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Visualizar"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Deletar"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Visualização */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">{selectedDoc.title}</h2>
            </div>
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{selectedDoc.content}</pre>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
