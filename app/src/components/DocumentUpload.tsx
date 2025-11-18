import { useState } from 'react';

interface UploadResponse {
  success: boolean;
  message: string;
  document?: {
    id: string;
    filename: string;
    type: string;
    size: number;
    uploadedAt: string;
    contentPreview: string;
    characterCount: number;
  };
  error?: string;
}

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
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
    if (!file) {
      setError('Por favor, selecione um arquivo');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/rag/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setFile(null);
        // Limpar input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.message || data.error || 'Erro ao fazer upload');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
      console.error('Upload error:', err);
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
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Upload de Documentos</h2>
      <p style={{ color: '#666' }}>Formatos aceitos: PDF, TXT, MD (máx. 10MB)</p>

      <div style={{ marginTop: '20px' }}>
        <input
          id="file-input"
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
        
        {file && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <strong>Arquivo selecionado:</strong>
            <div>Nome: {file.name}</div>
            <div>Tamanho: {formatFileSize(file.size)}</div>
            <div>Tipo: {file.type}</div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            background: uploading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading || !file ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? 'Enviando...' : 'Fazer Upload'}
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00'
        }}>
          <strong>Erro:</strong> {error}
        </div>
      )}

      {result && result.success && result.document && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#efe',
          border: '1px solid #cfc',
          borderRadius: '4px',
        }}>
          <h3 style={{ marginTop: 0, color: '#060' }}>✓ Upload realizado com sucesso!</h3>
          <div><strong>ID:</strong> {result.document.id}</div>
          <div><strong>Nome:</strong> {result.document.filename}</div>
          <div><strong>Tipo:</strong> {result.document.type.toUpperCase()}</div>
          <div><strong>Tamanho:</strong> {formatFileSize(result.document.size)}</div>
          <div><strong>Caracteres:</strong> {result.document.characterCount.toLocaleString()}</div>
          <div><strong>Data:</strong> {new Date(result.document.uploadedAt).toLocaleString('pt-BR')}</div>
          
          {result.document.contentPreview && (
            <div style={{ marginTop: '10px' }}>
              <strong>Preview:</strong>
              <pre style={{
                marginTop: '5px',
                padding: '10px',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '150px'
              }}>
                {result.document.contentPreview}...
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
