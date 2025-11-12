import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import axios from 'axios';

const router = Router();

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// POST /api/v1/chat - Enviar mensagem e receber resposta RAG
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'O campo "message" é obrigatório'
      });
    }

    // 1. Buscar configurações
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*');

    const settings: Record<string, string> = {};
    settingsData?.forEach(item => {
      settings[item.key] = item.value;
    });

    const apiKey = settings.openrouter_api_key;
    const model = settings.model || 'openai/gpt-3.5-turbo';
    const systemPrompt = settings.system_prompt || 'You are a helpful AI assistant.';

    if (!apiKey) {
      return res.status(400).json({
        error: 'Configuration missing',
        message: 'OpenRouter API key não configurada. Configure em /settings'
      });
    }

    // 2. Gerar embedding da pergunta usando OpenRouter
    const embedding = await getEmbedding(message, apiKey);

    // 3. Buscar contexto relevante usando busca semântica
    const { data: chunks, error: searchError } = await supabase
      .rpc('match_chunks', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5
      });

    if (searchError) {
      console.error('Erro na busca semântica:', searchError);
    }

    console.log(`📊 Busca retornou ${chunks?.length || 0} chunks relevantes`);

    // 4. Construir contexto
    let context = '';
    let hasContext = false;
    
    if (chunks && chunks.length > 0) {
      hasContext = true;
      context = '\n\nRelevant context from documents:\n\n';
      chunks.forEach((chunk: any, index: number) => {
        context += `[Document ${index + 1}]\n${chunk.content}\n\n`;
      });
    } else {
      context = '\n\nIMPORTANT: No relevant documents were found in the knowledge base for this question. You must inform the user that you could not find information about this topic in the available documents.';
    }

    // 5. Construir mensagens
    const enhancedSystemPrompt = systemPrompt + context + (hasContext ? '' : '\n\nYou MUST tell the user that you could not find relevant information in the documents.');
    
    const messages: Message[] = [
      { role: 'system', content: enhancedSystemPrompt },
      { role: 'user', content: message }
    ];

    // 6. Chamar OpenRouter
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'NeuroPgRag'
        }
      }
    );

    const assistantMessage = response.data.choices[0].message.content;

    // 7. Salvar conversa (opcional)
    if (conversationId) {
      await supabase.from('conversations').insert({
        conversation_id: conversationId,
        user_message: message,
        assistant_message: assistantMessage,
        model,
        chunks_used: chunks?.length || 0
      });
    }

    return res.json({
      success: true,
      message: assistantMessage,
      sources: chunks?.map((c: any) => ({
        documentId: c.document_id,
        content: c.content.substring(0, 200) + '...',
        similarity: c.similarity
      })) || []
    });

  } catch (error: any) {
    console.error('Erro no chat:', error);
    return res.status(500).json({
      error: 'Chat failed',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

// Função auxiliar para gerar embedding usando OpenRouter
async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  try {
    // Usar o modelo de embeddings do OpenAI via OpenRouter
    const response = await axios.post(
      'https://openrouter.ai/api/v1/embeddings',
      {
        model: 'openai/text-embedding-3-small',
        input: text
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'NeuroPgRag'
        }
      }
    );

    return response.data.data[0].embedding;
  } catch (error: any) {
    console.error('Erro ao gerar embedding:', error.response?.data || error.message);
    // Fallback: retornar embedding dummy se falhar
    console.warn('⚠️ Usando embedding dummy como fallback');
    return new Array(1536).fill(0).map(() => Math.random());
  }
}

export default router;
