import { useState } from 'react';
import { Upload as UploadIcon, FileText, CheckCircle, XCircle } from 'lucide-react';
import { documentsAPI } from '../services/api';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await documentsAPI.upload(file);
      setResult(response.data);
      setFile(null);
      // Limpar input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-4xl rounded-lg bg-slate-900/95 p-8">
      <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-col gap-2">
              <p
                className="text-slate-800 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]"
              >
                Upload de Documentos
              </p>
              <p
                className="text-slate-500 dark:text-[#92b7c9] text-base font-normal leading-normal"
              >
                Envie arquivos PDF, TXT ou MD para o sistema RAG
              </p>
            </div>
          </div>

      {/* Upload Area */}
      <div className="bg-transparent rounded-lg border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-400 transition-colors ">
        <div className="text-center">
          <UploadIcon className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">Drag &amp; drop files here</p>
          <p className="text-slate-600 dark:text-white/80 text-sm font-normal leading-normal text-center">Supports PDF, DOCX, TXT. Max file size: 25MB</p>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-input"
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-primary text-white text-sm font-bold leading-normal hover:bg-primary/90"
          >
            Escolher Arquivo
          </label>
        </div>

        {/* File Info */}
        {file && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-600" size={24} />
                <div>
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Enviando...' : 'Fazer Upload'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="text-red-600 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-semibold text-red-800">Erro no Upload</h4>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {result && result.success && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-semibold text-green-800 text-lg">Upload realizado com sucesso!</h4>
              <p className="text-green-600">Documento processado e salvo no banco de dados</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-3 rounded">
              <p className="text-sm text-gray-500">ID</p>
              <p className="font-mono text-sm text-gray-800">{result.document.id}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium text-gray-800">{result.document.filename}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="text-sm text-gray-500">Tipo</p>
              <p className="font-medium text-gray-800">{result.document.type.toUpperCase()}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="text-sm text-gray-500">Tamanho</p>
              <p className="font-medium text-gray-800">{formatFileSize(result.document.size)}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="text-sm text-gray-500">Caracteres</p>
              <p className="font-medium text-gray-800">{result.document.characterCount.toLocaleString()}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="text-sm text-gray-500">Data</p>
              <p className="font-medium text-gray-800">
                {new Date(result.document.uploadedAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {result.document.contentPreview && (
            <div className="mt-4 bg-white p-4 rounded">
              <p className="text-sm text-gray-500 mb-2">Preview do Conteúdo</p>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {result.document.contentPreview}...
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
