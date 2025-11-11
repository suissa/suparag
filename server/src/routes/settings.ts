import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/v1/settings - Listar todas as configurações
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }

    // Converter array para objeto key-value
    const settings: Record<string, string> = {};
    data.forEach(item => {
      settings[item.key] = item.value;
    });

    return res.json({
      success: true,
      settings
    });
  } catch (error: any) {
    console.error('Erro ao listar configurações:', error);
    return res.status(500).json({
      error: 'Failed to list settings',
      message: error.message
    });
  }
});

// GET /api/v1/settings/:key - Obter configuração específica
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Setting not found',
          message: `Configuração '${key}' não encontrada`
        });
      }
      throw new Error(`Erro ao buscar configuração: ${error.message}`);
    }

    return res.json({
      success: true,
      key: data.key,
      value: data.value
    });
  } catch (error: any) {
    console.error('Erro ao obter configuração:', error);
    return res.status(500).json({
      error: 'Failed to get setting',
      message: error.message
    });
  }
});

// POST /api/v1/settings - Criar ou atualizar configuração
router.post('/', async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Os campos "key" e "value" são obrigatórios'
      });
    }

    // Upsert (insert ou update)
    const { data, error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar configuração: ${error.message}`);
    }

    console.log(`✅ Configuração salva: ${key}`);

    return res.status(201).json({
      success: true,
      message: 'Configuração salva com sucesso',
      setting: {
        key: data.key,
        value: data.value
      }
    });
  } catch (error: any) {
    console.error('Erro ao salvar configuração:', error);
    return res.status(500).json({
      error: 'Failed to save setting',
      message: error.message
    });
  }
});

// PUT /api/v1/settings/:key - Atualizar configuração
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'O campo "value" é obrigatório'
      });
    }

    const { data, error } = await supabase
      .from('settings')
      .update({ value })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar configuração: ${error.message}`);
    }

    console.log(`✅ Configuração atualizada: ${key}`);

    return res.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      setting: {
        key: data.key,
        value: data.value
      }
    });
  } catch (error: any) {
    console.error('Erro ao atualizar configuração:', error);
    return res.status(500).json({
      error: 'Failed to update setting',
      message: error.message
    });
  }
});

// DELETE /api/v1/settings/:key - Deletar configuração
router.delete('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('key', key);

    if (error) {
      throw new Error(`Erro ao deletar configuração: ${error.message}`);
    }

    console.log(`🗑️ Configuração deletada: ${key}`);

    return res.json({
      success: true,
      message: 'Configuração deletada com sucesso',
      key
    });
  } catch (error: any) {
    console.error('Erro ao deletar configuração:', error);
    return res.status(500).json({
      error: 'Failed to delete setting',
      message: error.message
    });
  }
});

export default router;
