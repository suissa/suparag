import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import { supabase, Document } from '../config/supabase';

const router = Router();

// Configuração do Multer para upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Filtro de tipos de arquivo
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['application/pdf', 'text/plain', 'text/markdown'];
  const allowedExts = ['.pdf', '.txt', '.md'];
  
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use PDF, TXT ou MD'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

// Interface para o documento
interface DocumentResponse {
  id: string;
  filename: string;
  type: string;
  size: number;
  uploadedAt: string;
  contentPreview: string;
  characterCount: number;
}

// Função para extrair texto do arquivo
async function extractText(file: Express.Multer.File): Promise<string> {
  const fileBuffer = await fs.readFile(file.path);
  
  // Detectar tipo pelo mimetype ou extensão
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    try {
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text;
    } catch (error) {
      console.error('Erro ao extrair texto do PDF:', error);
      throw new Error('Falha ao processar PDF');
    }
  } else if (file.mimetype === 'text/plain' || ext === '.txt') {
    return fileBuffer.toString('utf-8');
  } else if (file.mimetype === 'text/markdown' || ext === '.md') {
    return fileBuffer.toString('utf-8');
  }
  
  throw new Error('Tipo de arquivo não suportado');
}

// Gerar ID único
function generateDocId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// POST /api/v1/docs - Upload de documento
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Por favor, envie um arquivo usando o campo "file"'
      });
    }

    // Extrair texto do arquivo
    const extractedText = await extractText(req.file);

    // Limpar arquivo temporário
    await fs.unlink(req.file.path).catch(() => {});

    // Preparar dados para salvar no Supabase
    const fileType = req.file.originalname.substring(req.file.originalname.lastIndexOf('.') + 1);
    const documentData: Document = {
      title: req.file.originalname,
      content: extractedText,
      metadata: {
        filename: req.file.originalname,
        type: fileType,
        size: req.file.size,
        characterCount: extractedText.length,
      }
    };

    // Salvar no Supabase
    const { data, error } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar no Supabase:', error);
      throw new Error(`Falha ao salvar documento: ${error.message}`);
    }

    console.log(`✅ Documento salvo no Supabase: ${data.id}`);

    // Preparar resposta
    const document: DocumentResponse = {
      id: data.id,
      filename: data.metadata.filename,
      type: data.metadata.type,
      size: data.metadata.size,
      uploadedAt: data.created_at,
      contentPreview: data.content.substring(0, 200),
      characterCount: data.metadata.characterCount,
    };

    // TODO: Processar para RAG (chunking, embeddings)
    
    console.log(`✅ Documento processado: ${document.filename} (${document.characterCount} caracteres)`);

    return res.status(201).json({
      success: true,
      message: 'Documento enviado com sucesso',
      document
    });

  } catch (error: any) {
    console.error('Erro no upload:', error);
    
    // Limpar arquivo se existir
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    return res.status(500).json({
      error: 'Upload failed',
      message: error.message || 'Erro ao processar o arquivo'
    });
  }
});

// GET /api/v1/docs - Listar documentos
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, metadata, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar documentos: ${error.message}`);
    }

    const documents = data.map(doc => ({
      id: doc.id,
      title: doc.title,
      filename: doc.metadata.filename,
      type: doc.metadata.type,
      size: doc.metadata.size,
      characterCount: doc.metadata.characterCount,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    }));

    return res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error: any) {
    console.error('Erro ao listar documentos:', error);
    return res.status(500).json({
      error: 'Failed to list documents',
      message: error.message
    });
  }
});

// GET /api/v1/docs/:id - Obter documento específico
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Document not found',
          message: `Documento com ID ${id} não encontrado`
        });
      }
      throw new Error(`Erro ao buscar documento: ${error.message}`);
    }

    return res.json({
      success: true,
      document: {
        id: data.id,
        title: data.title,
        content: data.content,
        metadata: data.metadata,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter documento:', error);
    return res.status(500).json({
      error: 'Failed to get document',
      message: error.message
    });
  }
});

// DELETE /api/v1/docs/:id - Deletar documento
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar documento: ${error.message}`);
    }

    console.log(`🗑️ Documento deletado: ${id}`);

    return res.json({
      success: true,
      message: 'Documento deletado com sucesso',
      id
    });
  } catch (error: any) {
    console.error('Erro ao deletar documento:', error);
    return res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

export default router;
