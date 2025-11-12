/**
 * Analisa o sentimento de um texto e retorna um valor entre -1 (negativo) e 1 (positivo)
 * 
 * NOTA: Esta é uma implementação simples baseada em palavras-chave
 * Em produção, considere usar bibliotecas como sentiment, natural ou APIs de NLP
 */

const positiveWords = [
  'bom', 'ótimo', 'excelente', 'maravilhoso', 'perfeito', 'adorei', 'amei',
  'feliz', 'alegre', 'satisfeito', 'obrigado', 'obrigada', 'parabéns',
  'incrível', 'fantástico', 'legal', 'bacana', 'top', 'show', 'massa',
  'gostei', 'aprovado', 'sim', 'claro', 'certeza', 'com certeza',
  'interessante', 'útil', 'ajudou', 'resolveu', 'funcionou', 'sucesso',
  'comprar', 'quero', 'vou', 'vamos', 'fechado', 'fechar', 'aceito'
];

const negativeWords = [
  'ruim', 'péssimo', 'horrível', 'terrível', 'não', 'nunca', 'jamais',
  'problema', 'erro', 'falha', 'bug', 'defeito', 'quebrado', 'parado',
  'triste', 'chateado', 'irritado', 'frustrado', 'decepcionado',
  'cancelar', 'desistir', 'reclamar', 'reclamação', 'insatisfeito',
  'difícil', 'complicado', 'confuso', 'lento', 'demorado', 'caro',
  'não funciona', 'não gostei', 'não quero', 'não serve', 'não vale'
];

const intensifiers = [
  'muito', 'demais', 'extremamente', 'super', 'mega', 'ultra',
  'bastante', 'bem', 'totalmente', 'completamente'
];

export function analyzeSentiment(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0; // Neutro para textos vazios
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  let score = 0;
  let wordCount = 0;
  let intensifierMultiplier = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Verificar intensificadores
    if (intensifiers.includes(word)) {
      intensifierMultiplier = 1.5;
      continue;
    }

    // Verificar palavras positivas
    if (positiveWords.some(pw => word.includes(pw))) {
      score += 1 * intensifierMultiplier;
      wordCount++;
      intensifierMultiplier = 1; // Reset
    }

    // Verificar palavras negativas
    if (negativeWords.some(nw => word.includes(nw))) {
      score -= 1 * intensifierMultiplier;
      wordCount++;
      intensifierMultiplier = 1; // Reset
    }
  }

  // Se não encontrou palavras de sentimento, retornar neutro
  if (wordCount === 0) {
    return 0;
  }

  // Normalizar o score para o intervalo [-1, 1]
  const normalizedScore = score / Math.max(wordCount, 1);
  
  // Garantir que está no intervalo [-1, 1]
  return Math.max(-1, Math.min(1, normalizedScore));
}

/**
 * Classifica o sentimento em categorias
 */
export function classifySentiment(score: number): 'positivo' | 'neutro' | 'negativo' {
  if (score > 0.2) return 'positivo';
  if (score < -0.2) return 'negativo';
  return 'neutro';
}

/**
 * Calcula o sentimento médio de múltiplos textos
 */
export function averageSentiment(texts: string[]): number {
  if (texts.length === 0) return 0;

  const scores = texts.map(analyzeSentiment);
  const sum = scores.reduce((acc, score) => acc + score, 0);
  
  return sum / texts.length;
}

/**
 * Analisa a evolução do sentimento ao longo do tempo
 */
export function sentimentTrend(messages: Array<{ text: string; timestamp: string }>): {
  trend: 'melhorando' | 'piorando' | 'estável';
  scores: number[];
} {
  const scores = messages.map(msg => analyzeSentiment(msg.text));

  if (scores.length < 2) {
    return { trend: 'estável', scores };
  }

  // Calcular média da primeira metade vs segunda metade
  const midPoint = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, midPoint);
  const secondHalf = scores.slice(midPoint);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const difference = secondAvg - firstAvg;

  let trend: 'melhorando' | 'piorando' | 'estável';
  if (difference > 0.1) {
    trend = 'melhorando';
  } else if (difference < -0.1) {
    trend = 'piorando';
  } else {
    trend = 'estável';
  }

  return { trend, scores };
}
