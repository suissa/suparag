-- ============================================
-- Funções SQL para Análise de Leads
-- ============================================

-- 1. Função para obter métricas agregadas de um lead
CREATE OR REPLACE FUNCTION get_lead_metrics(p_customer_id UUID)
RETURNS TABLE (
  customer_id UUID,
  total_messages BIGINT,
  avg_sentiment NUMERIC,
  first_interaction TIMESTAMPTZ,
  last_interaction TIMESTAMPTZ,
  conversation_duration_days NUMERIC,
  messages_per_day NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_customer_id,
    COUNT(*)::BIGINT as total_messages,
    ROUND(AVG(sentiment)::NUMERIC, 2) as avg_sentiment,
    MIN(created_at) as first_interaction,
    MAX(created_at) as last_interaction,
    ROUND(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 86400, 2) as conversation_duration_days,
    CASE 
      WHEN EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) > 0 
      THEN ROUND((COUNT(*)::NUMERIC / (EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 86400))::NUMERIC, 2)
      ELSE COUNT(*)::NUMERIC
    END as messages_per_day
  FROM interactions
  WHERE customer_id = p_customer_id
  GROUP BY customer_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Função para detectar gaps de conversação
CREATE OR REPLACE FUNCTION get_conversation_gaps(p_customer_id UUID)
RETURNS TABLE (
  gap_days NUMERIC,
  before_timestamp TIMESTAMPTZ,
  after_timestamp TIMESTAMPTZ,
  before_message TEXT,
  after_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH ordered_interactions AS (
    SELECT 
      created_at,
      content,
      LAG(created_at) OVER (ORDER BY created_at) as prev_timestamp,
      LAG(content) OVER (ORDER BY created_at) as prev_content
    FROM interactions
    WHERE customer_id = p_customer_id
    ORDER BY created_at
  )
  SELECT 
    ROUND(EXTRACT(EPOCH FROM (created_at - prev_timestamp)) / 86400, 2) as gap_days,
    prev_timestamp as before_timestamp,
    created_at as after_timestamp,
    SUBSTRING(prev_content, 1, 100) as before_message,
    SUBSTRING(content, 1, 100) as after_message
  FROM ordered_interactions
  WHERE prev_timestamp IS NOT NULL
    AND EXTRACT(EPOCH FROM (created_at - prev_timestamp)) / 86400 > 7
  ORDER BY gap_days DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Função para calcular probabilidades de conversão
CREATE OR REPLACE FUNCTION get_conversion_probabilities()
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  total_messages BIGINT,
  avg_sentiment NUMERIC,
  days_since_last_interaction NUMERIC,
  conversion_score NUMERIC,
  conversion_probability NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH lead_stats AS (
    SELECT 
      c.id as customer_id,
      c.name as customer_name,
      c.phone as customer_phone,
      COUNT(i.id)::BIGINT as total_messages,
      ROUND(AVG(i.sentiment)::NUMERIC, 2) as avg_sentiment,
      ROUND(EXTRACT(EPOCH FROM (NOW() - MAX(i.created_at))) / 86400, 2) as days_since_last_interaction,
      -- Calcular score baseado em múltiplos fatores
      (
        -- Fator 1: Número de mensagens (max 30 pontos)
        LEAST(COUNT(i.id) * 2, 30) +
        -- Fator 2: Sentimento positivo (max 30 pontos)
        LEAST((AVG(i.sentiment) + 1) * 15, 30) +
        -- Fator 3: Recência (max 20 pontos)
        GREATEST(20 - EXTRACT(EPOCH FROM (NOW() - MAX(i.created_at))) / 86400, 0) +
        -- Fator 4: Duração da conversa (max 20 pontos)
        LEAST(EXTRACT(EPOCH FROM (MAX(i.created_at) - MIN(i.created_at))) / 3600, 20)
      )::NUMERIC as conversion_score
    FROM customers c
    LEFT JOIN interactions i ON c.id = i.customer_id
    GROUP BY c.id, c.name, c.phone
    HAVING COUNT(i.id) > 0
  )
  SELECT 
    customer_id,
    customer_name,
    customer_phone,
    total_messages,
    avg_sentiment,
    days_since_last_interaction,
    ROUND(conversion_score, 2) as conversion_score,
    ROUND(LEAST(conversion_score, 100), 2) as conversion_probability
  FROM lead_stats
  ORDER BY conversion_score DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Função para buscar leads quentes (hot leads)
CREATE OR REPLACE FUNCTION get_hot_leads(p_min_probability NUMERIC DEFAULT 70)
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  conversion_probability NUMERIC,
  total_messages BIGINT,
  avg_sentiment NUMERIC,
  days_since_last_interaction NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.customer_id,
    cp.customer_name,
    cp.customer_phone,
    cp.conversion_probability,
    cp.total_messages,
    cp.avg_sentiment,
    cp.days_since_last_interaction
  FROM get_conversion_probabilities() cp
  WHERE cp.conversion_probability >= p_min_probability
  ORDER BY cp.conversion_probability DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para buscar leads frios (cold leads)
CREATE OR REPLACE FUNCTION get_cold_leads(p_days_inactive NUMERIC DEFAULT 30)
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  days_since_last_interaction NUMERIC,
  total_messages BIGINT,
  last_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH last_interactions AS (
    SELECT DISTINCT ON (customer_id)
      customer_id,
      created_at,
      SUBSTRING(content, 1, 100) as last_message
    FROM interactions
    ORDER BY customer_id, created_at DESC
  )
  SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    ROUND(EXTRACT(EPOCH FROM (NOW() - li.created_at)) / 86400, 2) as days_since_last_interaction,
    COUNT(i.id)::BIGINT as total_messages,
    li.last_message
  FROM customers c
  LEFT JOIN interactions i ON c.id = i.customer_id
  LEFT JOIN last_interactions li ON c.id = li.customer_id
  WHERE EXTRACT(EPOCH FROM (NOW() - li.created_at)) / 86400 > p_days_inactive
  GROUP BY c.id, c.name, c.phone, li.created_at, li.last_message
  ORDER BY days_since_last_interaction DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para análise de sentimento ao longo do tempo
CREATE OR REPLACE FUNCTION get_sentiment_trend(p_customer_id UUID)
RETURNS TABLE (
  date DATE,
  avg_sentiment NUMERIC,
  message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    ROUND(AVG(sentiment)::NUMERIC, 2) as avg_sentiment,
    COUNT(*)::BIGINT as message_count
  FROM interactions
  WHERE customer_id = p_customer_id
  GROUP BY DATE(created_at)
  ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- 7. Função para buscar palavras-chave de conversão
CREATE OR REPLACE FUNCTION detect_conversion_keywords(p_customer_id UUID)
RETURNS TABLE (
  keyword TEXT,
  occurrences BIGINT,
  avg_sentiment NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH keywords AS (
    SELECT unnest(ARRAY['comprar', 'fechar', 'contratar', 'assinar', 'pagamento', 
                        'preço', 'valor', 'teste', 'demo', 'funciona']) as keyword
  )
  SELECT 
    k.keyword,
    COUNT(*)::BIGINT as occurrences,
    ROUND(AVG(i.sentiment)::NUMERIC, 2) as avg_sentiment
  FROM keywords k
  LEFT JOIN interactions i ON 
    i.customer_id = p_customer_id AND
    LOWER(i.content) LIKE '%' || k.keyword || '%'
  WHERE i.id IS NOT NULL
  GROUP BY k.keyword
  HAVING COUNT(*) > 0
  ORDER BY occurrences DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comentários e Documentação
-- ============================================

COMMENT ON FUNCTION get_lead_metrics IS 'Retorna métricas agregadas de um lead específico';
COMMENT ON FUNCTION get_conversation_gaps IS 'Detecta gaps de tempo prolongados na conversa';
COMMENT ON FUNCTION get_conversion_probabilities IS 'Calcula probabilidade de conversão para todos os leads';
COMMENT ON FUNCTION get_hot_leads IS 'Retorna leads com alta probabilidade de conversão';
COMMENT ON FUNCTION get_cold_leads IS 'Retorna leads inativos há mais de X dias';
COMMENT ON FUNCTION get_sentiment_trend IS 'Analisa evolução do sentimento ao longo do tempo';
COMMENT ON FUNCTION detect_conversion_keywords IS 'Detecta palavras-chave relacionadas a conversão';

-- ============================================
-- Exemplos de Uso
-- ============================================

-- Obter métricas de um lead específico
-- SELECT * FROM get_lead_metrics('uuid-do-cliente');

-- Detectar gaps de conversação
-- SELECT * FROM get_conversation_gaps('uuid-do-cliente');

-- Listar todos os leads por probabilidade de conversão
-- SELECT * FROM get_conversion_probabilities();

-- Buscar apenas leads quentes (>70% de conversão)
-- SELECT * FROM get_hot_leads(70);

-- Buscar leads frios (inativos há mais de 30 dias)
-- SELECT * FROM get_cold_leads(30);

-- Analisar tendência de sentimento
-- SELECT * FROM get_sentiment_trend('uuid-do-cliente');

-- Detectar palavras-chave de conversão
-- SELECT * FROM detect_conversion_keywords('uuid-do-cliente');
