/**
 * Gera um embedding sintético de 1536 dimensões para um texto
 * 
 * NOTA: Em produção, use a API da OpenAI (text-embedding-ada-002)
 * Esta é uma implementação sintética para desenvolvimento/testes
 */
export function generateSyntheticEmbedding(text: string): number[] {
  const dimensions = 1536;
  const embedding: number[] = [];

  // Usar o texto como seed para gerar valores consistentes
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed += text.charCodeAt(i);
  }

  // Gerar valores pseudo-aleatórios baseados no seed
  for (let i = 0; i < dimensions; i++) {
    // Usar uma função determinística baseada no seed e índice
    const value = Math.sin(seed * (i + 1) * 0.001) * 0.5;
    embedding.push(value);
  }

  // Normalizar o vetor (importante para similaridade de cosseno)
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );

  return embedding.map(val => val / magnitude);
}

/**
 * Gera embedding real usando OpenAI API
 * Descomente e use em produção
 */
/*
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateRealEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Erro ao gerar embedding:', error);
    throw error;
  }
}
*/

/**
 * Calcula a similaridade de cosseno entre dois embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings devem ter o mesmo tamanho');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}
