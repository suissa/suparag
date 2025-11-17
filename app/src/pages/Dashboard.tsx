import { useState, useEffect } from 'react';
import { Upload as UploadIcon, Search, Eye, Trash2, LayoutDashboard, Settings, HelpCircle } from 'lucide-react';
import { documentsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import ChatPanel from '../components/ChatPanel';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface Document {
  id: string;
  filename: string;
  type: string;
  size: number;
  uploadedAt: string;
  status?: 'ready' | 'processing' | 'error';
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await documentsAPI.list();
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await documentsAPI.upload(file);
      await loadDocuments();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      try {
        await documentsAPI.delete(id);
        await loadDocuments();
      } catch (error) {
        console.error('Erro ao excluir documento:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string = 'ready') => {
    const styles = {
      ready: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300',
      processing: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300',
      error: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
    };

    const labels = {
      ready: 'Ready',
      processing: 'Processing',
      error: 'Error'
    };

    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        <span className={`size-1.5 rounded-full ${status === 'ready' ? 'bg-green-500' : status === 'processing' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
        {labels[status as keyof typeof labels]}
      </div>
    );
  };

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout> 
    <div className="relative flex h-screen w-full flex-row overflow-hidden">
      {/* Sidebar */}
      

      {/* Document Management Panel */}
      <div className="flex h-full flex-col border-r border-gray-200 dark:border-[#325567] bg-white dark:bg-[#111c22] w-full lg:w-1/2">
        <div className="p-6">
          {/* Page Heading */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-72 flex-col gap-1">
              <p className="text-gray-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
                My Documents
              </p>
              <p className="text-gray-500 dark:text-[#92b7c9] text-base font-normal leading-normal">
                Manage and chat with your documents.
              </p>
            </div>
            <label className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90">
              <UploadIcon size={18} />
              <span className="truncate">Upload Document</span>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {/* Search Bar */}
          <div className="pt-6">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-gray-100 dark:bg-[#233c48]">
                <div className="text-gray-400 dark:text-[#92b7c9] flex items-center justify-center pl-4">
                  <Search size={20} />
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-gray-400 dark:placeholder:text-[#92b7c9] px-2 text-base font-normal leading-normal"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </label>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 pt-4 overflow-x-auto">
            <button className="flex h-8 shrink-0 items-center justify-center gap-x-1.5 rounded-lg bg-gray-100 dark:bg-[#233c48] px-3">
              <p className="text-gray-700 dark:text-white text-sm font-medium leading-normal">All</p>
            </button>
            <button className="flex h-8 shrink-0 items-center justify-center gap-x-1.5 rounded-lg bg-gray-100 dark:bg-[#233c48] px-3">
              <p className="text-gray-700 dark:text-white text-sm font-medium leading-normal">Category</p>
            </button>
            <button className="flex h-8 shrink-0 items-center justify-center gap-x-1.5 rounded-lg bg-gray-100 dark:bg-[#233c48] px-3">
              <p className="text-gray-700 dark:text-white text-sm font-medium leading-normal">Date Uploaded</p>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-[#325567] bg-white dark:bg-[#111c22]">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-[#192b33]">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-white">Title</th>
                  <th className="hidden md:table-cell px-4 py-3 text-sm font-medium text-gray-600 dark:text-white">Date</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-sm font-medium text-gray-600 dark:text-white">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-[#92b7c9]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#325567]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="h-[72px] px-4 py-2 text-center text-gray-500 dark:text-[#92b7c9]">
                      Loading...
                    </td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-[72px] px-4 py-2 text-center text-gray-500 dark:text-[#92b7c9]">
                      No documents found
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="h-[72px] px-4 py-2 text-gray-900 dark:text-white text-sm font-normal leading-normal">
                        {doc.filename}
                      </td>
                      <td className="hidden md:table-cell h-[72px] px-4 py-2 text-gray-500 dark:text-[#92b7c9] text-sm">
                        {formatDate(doc.uploadedAt)}
                      </td>
                      <td className="hidden lg:table-cell h-[72px] px-4 py-2 text-sm">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="h-[72px] px-4 py-2">
                        <div className="flex gap-1">
                          <button className="text-gray-500 dark:text-[#92b7c9] hover:text-primary p-1">
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-gray-500 dark:text-[#92b7c9] hover:text-red-500 p-1"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RAG Chat Panel */}
      <div className="hidden lg:flex h-full w-1/2">
        <ChatPanel />
      </div>
    </div>
    </DashboardLayout>
  );
}
