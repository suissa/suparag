import { env } from '../config/env';

/**
 * Serviço para gerar embeddings usando OpenRouter API
 */
export class EmbeddingService {
  private apiKey: string | undefined;
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiKey = env.openrouter.apiKey;
    this.apiUrl = 'https://openrouter.ai/api/v1/embeddings';
    this.model = 'openai/text-embedding-3-small'; // Modelo de embedding
    
    console.log('[EmbeddingService] Inicializado');
    console.log(`[EmbeddingService] API Key do env: ${this.apiKey ? '✅ Encontrada' : '❌ Não encontrada'}`);
  }

  /**
   * Busca API key do banco de dados (tabela settings)
   */
  private async getApiKeyFromDatabase(): Promise<string | null> {
    try {
      const { supabase } = await import('../config/supabase');
      const { data, error } = await supabase
        .from('settings')
        .select('openrouter_api_key')
        .single();

      if (error || !data?.openrouter_api_key) {
        console.warn('[EmbeddingService] API key não encontrada no banco');
        return null;
      }

      console.log('[EmbeddingService] ✅ API key encontrada no banco');
      return data.openrouter_api_key;
    } catch (error) {
      console.error('[EmbeddingService] Erro ao buscar API key do banco:', error);
      return null;
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
      let apiKey = this.apiKey;
      
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

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Resposta inválida da API de embeddings');
      }

      const embedding = data.data[0].embedding;
      console.log(`[EmbeddingService] Embedding gerado com sucesso (${embedding.length} dimensões)`);

      return embedding;
    } catch (error) {
      console.error('[EmbeddingService] Erro ao gerar embedding:', error);
      
      // Fallback: retornar embedding sintético (zeros)
      console.warn('[EmbeddingService] Usando embedding sintético como fallback');
      return Array(1536).fill(0);
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
}

// Exportar instância singleton
export const embeddingService = new EmbeddingService();
