import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import path from 'path';

// Desabilita o body parser padrão do Next.js/Vercel para permitir upload de arquivos
export const config = {
  api: {
    bodyParser: false,
  },
};

// Tipos de arquivo permitidos
const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/markdown': 'md',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default async function handler(req, res) {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST to upload documents' 
    });
  }

  try {
    // Parse do formulário multipart
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      keepExtensions: true,
      multiples: false,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Validar se arquivo foi enviado
    const file = files.file?.[0] || files.file;
    
    if (!file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a file using the "file" field'
      });
    }

    // Validar tipo de arquivo
    const fileType = file.mimetype || file.type;
    const fileExtension = ALLOWED_TYPES[fileType];

    if (!fileExtension) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF, TXT, and MD files are allowed',
        received: fileType
      });
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: 'File too large',
        message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        received: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // Ler conteúdo do arquivo
    const fileContent = await fs.readFile(file.filepath);
    
    // Extrair texto baseado no tipo
    let extractedText = '';
    
    if (fileExtension === 'txt' || fileExtension === 'md') {
      extractedText = fileContent.toString('utf-8');
    } else if (fileExtension === 'pdf') {
      // Extrair texto de PDF
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(fileContent);
        extractedText = pdfData.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        extractedText = '[PDF content - parsing failed]';
      }
    }

    // Limpar arquivo temporário
    await fs.unlink(file.filepath).catch(() => {});

    // Preparar resposta
    const document = {
      id: generateDocId(),
      filename: file.originalFilename || file.name,
      type: fileExtension,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      contentPreview: extractedText.substring(0, 200),
      characterCount: extractedText.length,
    };

    // TODO: Salvar no banco de dados
    // TODO: Processar para RAG (embeddings, chunking, etc)

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    return res.status(500).json({
      error: 'Upload failed',
      message: error.message || 'An error occurred while uploading the file'
    });
  }
}

// Gerar ID único para documento
function generateDocId() {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
