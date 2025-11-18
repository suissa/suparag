import { useState } from 'react';
import type { FormEvent } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Table } from '../../components/Table';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Card } from '../../components/Card';
import { FileUpload } from '../../components/FileUpload';
import { useRagDocuments, useCreateRagDocument, useDeleteRagDocument, useSemanticSearch } from '../../hooks/useRagDocs';
import type { RagDocument, SearchMatch } from '../../services/supabaseClient';
import api from '../../services/api';

export default function RagPage() {
  const { data: documents = [], isLoading, refetch } = useRagDocuments();
  const createDocument = useCreateRagDocument();
  const deleteDocument = useDeleteRagDocument();
  const semanticSearch = useSemanticSearch();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source: '',
  });

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFormData({ ...formData, title: file.name, source: file.name });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (selectedFile) {
      // Upload de arquivo
      try {
        setIsUploading(true);
        setUploadProgress(0);

        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedFile);

        const response = await api.post('/docs', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total 
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(progress);
          },
        });

        console.log('Documento enviado com sucesso:', response.data);
        
        // Recarregar lista de documentos
        await refetch();
        
        // Fechar modal e limpar estado
        setIsModalOpen(false);
        setSelectedFile(null);
        setFormData({ title: '', content: '', source: '' });
        setUploadProgress(0);
      } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
        alert('Erro ao enviar arquivo. Tente novamente.');
      } finally {
        setIsUploading(false);
      }
    } else {
      // Criação manual (texto)
      try {
        const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
        await createDocument.mutateAsync({ ...formData, embedding });
        setIsModalOpen(false);
        setFormData({ title: '', content: '', source: '' });
      } catch (error) {
        console.error('Erro ao criar documento:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este documento?')) {
      try {
        await deleteDocument.mutateAsync(id);
      } catch (error) {
        console.error('Erro ao deletar documento:', error);
      }
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await semanticSearch.mutateAsync({ 
        query: searchQuery,
        threshold: 0.3,
        limit: 5
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Erro na busca semântica:', error);
    }
  };

  const columns = [
    { key: 'title', label: 'Título' },
    { 
      key: 'content', 
      label: 'Conteúdo',
      render: (doc: RagDocument) => (
        <span className="line-clamp-2">{doc.content}</span>
      )
    },
    { key: 'source', label: 'Origem' },
    { 
      key: 'created_at', 
      label: 'Criado em',
      render: (doc: RagDocument) => 
        new Date(doc.created_at).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (doc: RagDocument) => (
        <Button
          size="sm"
          variant="danger"
          icon="delete"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(doc.id);
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
            <h1 className="text-3xl font-bold text-white">Documentos RAG</h1>
            <p className="text-white/60 mt-1">Base de conhecimento com busca semântica</p>
          </div>
          <Button icon="add" onClick={() => setIsModalOpen(true)}>
            Novo Documento
          </Button>
        </div>

        <Card title="Busca Semântica" icon="search">
          <div className="flex gap-4">
            <Input
              icon="search"
              placeholder="Digite sua busca semântica..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSemanticSearch()}
            />
            <Button 
              icon="search" 
              onClick={handleSemanticSearch}
              loading={semanticSearch.isPending}
            >
              Buscar
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-white font-medium">Resultados da Busca Semântica:</h3>
              {searchResults.map((result, index) => (
                <div 
                  key={result.id} 
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-primary font-medium">
                      Similaridade: {(result.similarity * 100).toFixed(1)}%
                    </span>
                    <span className="text-white/60 text-sm">#{index + 1}</span>
                  </div>
                  <p className="text-white text-sm">{result.title || result.content}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Table
          data={filteredDocuments}
          columns={columns}
          loading={isLoading}
          emptyMessage="Nenhum documento encontrado"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFile(null);
          setFormData({ title: '', content: '', source: '' });
          setUploadProgress(0);
        }}
        title="Novo Documento RAG"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!selectedFile ? (
            <>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Arquivo *
                </label>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  accept=".pdf,.txt,.md"
                  maxSize={10}
                  disabled={isUploading}
                />
              </div>

              <div className="text-center text-white/40 text-sm py-2">
                ou
              </div>

              <Input
                label="Título"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Digite o título manualmente"
              />

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Conteúdo
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-primary"
                  rows={6}
                  placeholder="Ou digite o conteúdo manualmente"
                />
              </div>

              <Input
                label="Origem"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Ex: manual.pdf, artigo.md"
              />
            </>
          ) : (
            <>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{selectedFile.name}</p>
                    <p className="text-white/60 text-sm">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="flex-shrink-0 text-white/60 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {isUploading && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-white/60 mb-1">
                      <span>Enviando...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Input
                label="Título"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título do documento"
                disabled={isUploading}
              />
            </>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsModalOpen(false);
                setSelectedFile(null);
                setFormData({ title: '', content: '', source: '' });
                setUploadProgress(0);
              }}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              loading={isUploading || createDocument.isPending}
              disabled={!selectedFile && !formData.content}
            >
              {selectedFile ? 'Enviar Arquivo' : 'Criar Documento'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
