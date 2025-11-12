/**
 * Gera um embedding sintético de 1536 dimensões para testes
 * Os valores são gerados aleatoriamente entre -1 e 1
 * 
 * @param text - Texto para gerar o embedding (usado apenas como seed)
 * @returns Array de 1536 números entre -1 e 1
 */
export function generateSyntheticEmbedding(text: string): number[] {
  // Usar o texto como seed para gerar valores consistentes
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Gerar 1536 valores aleatórios entre -1 e 1
  const embedding = Array.from({ length: 1536 }, (_, i) => {
    // Usar seed + índice para gerar valores pseudo-aleatórios consistentes
    const x = Math.sin(seed + i) * 10000;
    return (x - Math.floor(x)) * 2 - 1;
  });

  return embedding;
}

/**
 * Gera um embedding completamente aleatório de 1536 dimensões
 * 
 * @returns Array de 1536 números aleatórios entre -1 e 1
 */
export function generateRandomEmbedding(): number[] {
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
}

/**
 * Normaliza um embedding para ter magnitude 1 (unit vector)
 * 
 * @param embedding - Array de números
 * @returns Embedding normalizado
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  
  if (magnitude === 0) return embedding;
  
  return embedding.map(val => val / magnitude);
}

/**
 * Calcula a similaridade de cosseno entre dois embeddings
 * 
 * @param a - Primeiro embedding
 * @param b - Segundo embedding
 * @returns Valor entre -1 e 1 (1 = idênticos, -1 = opostos)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings devem ter o mesmo tamanho');
  }

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}
