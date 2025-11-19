import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import { supabase } from '../config/supabase';
import { embeddingService } from '../services/embeddingService';

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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Função para extrair texto do arquivo
async function extractText(file: Express.Multer.File): Promise<string> {
  const fileBuffer = await fs.readFile(file.path);
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    const pdfData = await pdfParse(fileBuffer);
    return pdfData.text;
  } else if (file.mimetype === 'text/plain' || ext === '.txt' || ext === '.md') {
    return fileBuffer.toString('utf-8');
  }
  
  throw new Error('Tipo de arquivo não suportado');
}

// GET /api/v1/rag/documents - Listar documentos RAG
router.get('/documents', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('rag_documents')
      .select('id, title, content, metadata, source, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar documentos',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { documents: data }
    });
  } catch (error: any) {
    console.error('Erro ao listar documentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/v1/rag/documents/:id - Obter documento por ID
router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error} = await supabase
      .from('rag_documents')
      .select('id, title, content, metadata, source, section, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Documento não encontrado'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar documento',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { document: data }
    });
  } catch (error: any) {
    console.error('Erro ao obter documento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/v1/rag/documents - Upload de documento com embedding
router.post('/documents', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // Se tem arquivo, fazer upload
    if (req.file) {
      const extractedText = await extractText(req.file);
      await fs.unlink(req.file.path).catch(() => {});

      console.log(`📄 Texto extraído: ${extractedText.length} caracteres`);

      // Gerar embedding
      console.log('🔄 Gerando embedding...');
      const embedding = await embeddingService.generateEmbedding(extractedText);
      console.log(`✅ Embedding gerado: ${embedding.length} dimensões`);

      const fileType = req.file.originalname.substring(req.file.originalname.lastIndexOf('.') + 1);
      const filename = req.file.originalname;

      // Converter embedding para formato pgvector (string)
      const embeddingStr = `[${embedding.join(',')}]`;
      
      const { data, error } = await supabase
        .from('rag_documents')
        .insert({
          title: filename,
          content: extractedText,
          embedding: embeddingStr,
          source: 'upload',
          metadata: {
            filename,
            type: fileType,
            size: req.file.size,
            characterCount: extractedText.length,
            uploaded_via: 'file_upload'
          }
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Falha ao salvar documento: ${error.message}`);
      }

      console.log(`✅ Documento salvo: ${data.id}`);

      return res.status(201).json({
        success: true,
        message: 'Documento enviado com sucesso',
        document: {
          id: data.id,
          filename: data.metadata.filename,
          type: data.metadata.type,
          size: data.metadata.size,
          uploadedAt: data.created_at,
          contentPreview: data.content.substring(0, 200),
          characterCount: data.metadata.characterCount,
        }
      });
    }

    // Se não tem arquivo, criar documento via JSON
    const { title, content, source } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Campos "title" e "content" são obrigatórios (ou envie um arquivo)'
      });
    }

    const { data, error } = await supabase
      .from('rag_documents')
      .insert({
        title,
        content,
        source: source || 'api',
        metadata: { uploaded_via: 'api' }
      })
      .select('id, title, content, metadata, source, created_at, updated_at')
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar documento',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      data: { document: data }
    });
  } catch (error: any) {
    console.error('Erro ao criar documento:', error);
    
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message || 'Erro ao processar o arquivo'
    });
  }
});

// POST /api/v1/rag/search/documents - Busca semântica em documentos
router.post('/search/documents', async (req: Request, res: Response) => {
  try {
    const { embedding, threshold = 0.5, limit = 5 } = req.body;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({
        success: false,
        message: 'Campo "embedding" é obrigatório e deve ser um array'
      });
    }

    const { data, error } = await supabase
      .rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit
      });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar documentos similares',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { matches: data }
    });
  } catch (error: any) {
    console.error('Erro na busca semântica de documentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/v1/rag/search/interactions - Busca semântica em interações
router.post('/search/interactions', async (req: Request, res: Response) => {
  try {
    const { embedding, threshold = 0.5, limit = 5 } = req.body;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({
        success: false,
        message: 'Campo "embedding" é obrigatório e deve ser um array'
      });
    }

    const { data, error } = await supabase
      .rpc('match_interactions', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit
      });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar interações similares',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { matches: data }
    });
  } catch (error: any) {
    console.error('Erro na busca semântica de interações:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/v1/rag/documents/:id - Deletar documento
router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('rag_documents')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar documento',
        error: error.message
      });
    }

    return res.json({
      success: true,
      data: { message: 'Documento deletado com sucesso' }
    });
  } catch (error: any) {
    console.error('Erro ao deletar documento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
