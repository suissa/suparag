import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/v1/rag/documents - Listar documentos RAG
router.get('/documents', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('documents')
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
      .from('documents')
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

// POST /api/v1/rag/documents - Criar documento RAG
router.post('/documents', async (req: Request, res: Response) => {
  try {
    const { title, content, source } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Campos "title" e "content" são obrigatórios'
      });
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title,
        content,
        source,
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
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
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
      .from('documents')
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
