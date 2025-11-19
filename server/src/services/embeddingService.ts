/**
 * Serviço para gerar embeddings usando OpenRouter API
 */
export class EmbeddingService {
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiUrl = 'https://openrouter.ai/api/v1/embeddings';
    this.model = 'openai/text-embedding-3-small'; // Modelo de embedding
    
    console.log('[EmbeddingService] Inicializado');
  }

  /**
   * Busca API key do env
   */
  private getApiKeyFromEnv(): string | undefined {
    try {
      // Tentar pegar do objeto env primeiro (mais confiável)
      const { env } = require('../config/env');
      if (env?.openRouter?.apiKey) {
        console.log('[EmbeddingService] ✅ API key encontrada no env.openRouter');
        return env.openRouter.apiKey;
      }

      // Fallback: tentar pegar diretamente do process.env
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (apiKey) {
        console.log('[EmbeddingService] ✅ API key encontrada no process.env');
        return apiKey;
      }

      console.warn('[EmbeddingService] ❌ API key não encontrada no env');
      return undefined;
    } catch (error) {
      console.error('[EmbeddingService] Erro ao buscar API key do env:', error);
      return undefined;
    }
  }

  /**
   * Busca API key do banco de dados (tabela settings)
   */
  private async getApiKeyFromDatabase(): Promise<string | undefined> {
    try {
      const { supabase } = await import('../config/supabase');
      const { data, error } = await supabase
        .from('settings')
        .select('openrouter_api_key')
        .single();

      if (error || !data?.openrouter_api_key) {
        console.warn('[EmbeddingService] API key não encontrada no banco');
        return undefined;
      }

      console.log('[EmbeddingService] ✅ API key encontrada no banco');
      return data.openrouter_api_key;
    } catch (error) {
      console.error('[EmbeddingService] Erro ao buscar API key do banco:', error);
      return undefined;
    }
  }

  /**
   * Gera embedding para um texto usando OpenRouter
   * 
   * @param text - Texto para gerar embedding
   * @returns Array de números representando o embedding (1536 dimensões)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`[EmbeddingService] Gerando embedding para texto de ${text.length} caracteres`);

      // Tentar pegar API key do env primeiro, depois do banco
      let apiKey = this.getApiKeyFromEnv();
      
      if (!apiKey) {
        console.log('[EmbeddingService] API key não encontrada no env, buscando no banco...');
        apiKey = await this.getApiKeyFromDatabase();
      }

      if (!apiKey) {
        throw new Error('API key do OpenRouter não configurada (nem no env nem no banco)');
      }

      console.log(`[EmbeddingService] Usando API key: ${apiKey.substring(0, 10)}...`);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:4000',
          'X-Title': 'NeuroPgRag'
        },
        body: JSON.stringify({
          model: this.model,
          input: text.substring(0, 8000) // Limitar a 8000 caracteres
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
      }

      const data: any = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Resposta inválida da API de embeddings');
      }

      const embedding: number[] = data.data[0].embedding;
      console.log(`[EmbeddingService] Embedding gerado com sucesso (${embedding.length} dimensões)`);

      return embedding;
    } catch (error) {
      console.error('[EmbeddingService] Erro ao gerar embedding:', error);
      
      // NÃO usar fallback de zeros pois causa problemas com operador <=>
      throw new Error(`Falha ao gerar embedding: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Gera embeddings para múltiplos textos em batch
   * 
   * @param texts - Array de textos
   * @returns Array de embeddings
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }
    
    return embeddings;
  }

  /**
   * Gera uma resposta de texto usando LLM via OpenRouter
   * 
   * @param prompt - Prompt para o LLM
   * @param model - Modelo a ser usado (padrão: gpt-3.5-turbo)
   * @returns Texto gerado pelo LLM
   */
  async generateCompletion(prompt: string, model: string = 'openai/gpt-3.5-turbo'): Promise<string> {
    try {
      console.log(`[EmbeddingService] Gerando completion com modelo ${model}`);

      // Tentar pegar API key do env primeiro, depois do banco
      let apiKey = this.getApiKeyFromEnv();
      
      if (!apiKey) {
        console.log('[EmbeddingService] API key não encontrada no env, buscando no banco...');
        apiKey = await this.getApiKeyFromDatabase();
      }

      if (!apiKey) {
        throw new Error('API key do OpenRouter não configurada');
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:4000',
          'X-Title': 'NeuroPgRag'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
      }

      const data: any = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Resposta inválida da API de completion');
      }

      const completion: string = data.choices[0].message.content;
      console.log(`[EmbeddingService] Completion gerado com sucesso (${completion.length} caracteres)`);

      return completion;
    } catch (error) {
      console.error('[EmbeddingService] Erro ao gerar completion:', error);
      throw new Error(`Falha ao gerar completion: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

// Exportar instância singleton
export const embeddingService = new EmbeddingService();
