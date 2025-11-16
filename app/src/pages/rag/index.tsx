import { useState } from 'react';
import type { FormEvent } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Table } from '../../components/Table';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Card } from '../../components/Card';
import { useRagDocuments, useCreateRagDocument, useDeleteRagDocument, useSemanticSearch } from '../../hooks/useRagDocs';
import type { RagDocument, SearchMatch } from '../../services/supabaseClient';

export default function RagPage() {
  const { data: documents = [], isLoading } = useRagDocuments();
  const createDocument = useCreateRagDocument();
  const deleteDocument = useDeleteRagDocument();
  const semanticSearch = useSemanticSearch();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source: '',
  });

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Gerar embedding sintético
      const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
      await createDocument.mutateAsync({ ...formData, embedding });
      setIsModalOpen(false);
      setFormData({ title: '', content: '', source: '' });
    } catch (error) {
      console.error('Erro ao criar documento:', error);
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
        onClose={() => setIsModalOpen(false)}
        title="Novo Documento RAG"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Conteúdo *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-primary"
              rows={8}
              required
            />
          </div>

          <Input
            label="Origem"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            placeholder="Ex: manual.pdf, artigo.md"
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createDocument.isPending}>
              Criar Documento
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
