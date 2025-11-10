import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

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

    // Preparar resposta
    const document: DocumentResponse = {
      id: generateDocId(),
      filename: req.file.originalname,
      type: req.file.originalname.substring(req.file.originalname.lastIndexOf('.') + 1),
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      contentPreview: extractedText.substring(0, 200),
      characterCount: extractedText.length,
    };

    // TODO: Salvar no banco de dados
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

// GET /api/v1/docs - Listar documentos (TODO)
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Endpoint para listar documentos (em desenvolvimento)',
    documents: []
  });
});

// GET /api/v1/docs/:id - Obter documento específico (TODO)
router.get('/:id', (req: Request, res: Response) => {
  res.json({
    message: 'Endpoint para obter documento (em desenvolvimento)',
    id: req.params.id
  });
});

// DELETE /api/v1/docs/:id - Deletar documento (TODO)
router.delete('/:id', (req: Request, res: Response) => {
  res.json({
    message: 'Endpoint para deletar documento (em desenvolvimento)',
    id: req.params.id
  });
});

export default router;
