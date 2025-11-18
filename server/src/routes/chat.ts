import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import axios from 'axios';
import { embeddingService } from '../services/embeddingService';
import { env } from '../config/env';

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

    // 2. Gerar embedding da pergunta usando EmbeddingService
    console.log('🔄 Gerando embedding da pergunta...');
    const embedding = await embeddingService.generateEmbedding(message);
    console.log(`✅ Embedding gerado: ${embedding.length} dimensões`);

    // 3. BUSCA MULTI-ESTRATÉGIA: Executar todas as 4 funções em paralelo
    console.log('🔍 Executando busca multi-estratégia (4 métodos)...');
    
    const [
      vectorialResult,
      hybridResult,
      fuzzyResult,
      ilikeResult
    ] = await Promise.all([
      // 3.1. Busca vetorial pura (cosine similarity)
      supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5
      }).then(r => ({ method: 'vectorial', ...r })),
      
      // 3.2. Busca híbrida (vetorial + trigram)
      supabase.rpc('search_documents_hybrid_simple', {
        search_term: message,
        search_embedding: embedding,
        trigram_limit: 50,
        final_limit: 5
      }).then(r => ({ method: 'hybrid', ...r })),
      
      // 3.3. Busca fuzzy (trigram)
      supabase.rpc('search_documents_fuzzy', {
        search_term: message
      }).then(r => ({ method: 'fuzzy', ...r })),
      
      // 3.4. Busca ILIKE (pattern matching)
      supabase.rpc('search_documents_ilike', {
        search_term: message
      }).then(r => ({ method: 'ilike', ...r }))
    ]);

    // Log dos resultados de cada método
    console.log(`📊 Resultados da busca multi-estratégia:`);
    console.log(`  - Vetorial: ${vectorialResult.data?.length || 0} docs`);
    console.log(`  - Híbrida: ${hybridResult.data?.length || 0} docs`);
    console.log(`  - Fuzzy: ${fuzzyResult.data?.length || 0} docs`);
    console.log(`  - ILIKE: ${ilikeResult.data?.length || 0} docs`);

    // Verificar erros
    if (vectorialResult.error) console.error('❌ Erro busca vetorial:', vectorialResult.error);
    if (hybridResult.error) console.error('❌ Erro busca híbrida:', hybridResult.error);
    if (fuzzyResult.error) console.error('❌ Erro busca fuzzy:', fuzzyResult.error);
    if (ilikeResult.error) console.error('❌ Erro busca ILIKE:', ilikeResult.error);

    // 4. Combinar e deduplicar resultados
    const allResults = [
      ...(vectorialResult.data || []).map((d: any) => ({ ...d, source: 'vectorial', score: d.similarity })),
      ...(hybridResult.data || []).map((d: any) => ({ ...d, source: 'hybrid', score: d.combined_score })),
      ...(fuzzyResult.data || []).map((d: any) => ({ ...d, source: 'fuzzy', score: d.score })),
      ...(ilikeResult.data || []).map((d: any) => ({ ...d, source: 'ilike', score: d.score || 1 }))
    ];

    // Deduplicar por ID e manter o melhor score
    const uniqueResults = new Map<string, any>();
    allResults.forEach(doc => {
      const existing = uniqueResults.get(doc.id);
      if (!existing || doc.score > existing.score) {
        uniqueResults.set(doc.id, doc);
      }
    });

    // Ordenar por score e pegar top 5
    const chunks = Array.from(uniqueResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    console.log(`✅ Total após deduplicação: ${chunks.length} documentos únicos`);
    chunks.forEach((doc, i) => {
      const scoreStr = typeof doc.score === 'number' ? doc.score.toFixed(3) : String(doc.score || 'N/A');
      console.log(`  ${i + 1}. [${doc.source}] Score: ${scoreStr} - ${doc.title?.substring(0, 50)}...`);
    });

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
          'X-Title': 'SUPARAG'
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

export default router;
