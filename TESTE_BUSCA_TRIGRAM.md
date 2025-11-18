# Relatório de Testes de Busca Trigram (pg_trgm)

## Objetivo
Testar o funcionamento da busca fuzzy usando pg_trgm no PostgreSQL/Supabase, verificando como o score de similaridade varia conforme removemos palavras da busca.

## Documentos de Teste Inseridos

| ID | Título | Conteúdo |
|----|--------|----------|
| aefeddf3 | Teste Horário Funcionamento | Nosso horário de funcionamento é de segunda a sexta das 9h às 18h |
| 2fdeda6f | Teste Contato Telefone | Entre em contato pelo telefone 11 99999-9999 ou email contato@empresa.com |
| 521a72db | Teste Preço Produto | O preço do produto é R$ 99,90 com desconto de 10% para pagamento à vista |

## Resultados dos Testes

### 1. Busca: "horário de funcionamento"

| Documento | Score | Trigram Match (%) |
|-----------|-------|-------------------|
| Teste Horário Funcionamento | **0.4167** | ✅ SIM (41.67%) |
| Teste Preço Produto | 0.1053 | ❌ NÃO (10.53%) |
| Teste Contato Telefone | 0.0267 | ❌ NÃO (2.67%) |

**Análise:** Busca completa retorna o documento correto com 41.67% de similaridade e passa no threshold do trigram match.

---

### 2. Busca: "horário funcionamento" (sem "de")

| Documento | Score | Trigram Match (%) |
|-----------|-------|-------------------|
| Teste Horário Funcionamento | **0.3667** | ✅ SIM (36.67%) |
| Teste Preço Produto | 0.0658 | ❌ NÃO (6.58%) |
| Teste Contato Telefone | 0.0278 | ❌ NÃO (2.78%) |

**Análise:** Remover palavra de ligação ("de") reduz score em ~5%, mas ainda passa no threshold.

---

### 3. Busca: "horário" (apenas 1 palavra)

| Documento | Score | Trigram Match (%) |
|-----------|-------|-------------------|
| Teste Horário Funcionamento | **0.1333** | ❌ NÃO (13.33%) |
| Teste Contato Telefone | 0.0000 | ❌ NÃO (0%) |
| Teste Preço Produto | 0.0000 | ❌ NÃO (0%) |

**Análise:** Palavra única não passa no threshold do trigram match (< 30%), mesmo tendo 13.33% de similaridade.

---

### 4. Busca: "funcionamento" (apenas 1 palavra)

| Documento | Score | Trigram Match (%) |
|-----------|-------|-------------------|
| Teste Horário Funcionamento | **0.2333** | ❌ NÃO (23.33%) |
| Teste Preço Produto | 0.0735 | ❌ NÃO (7.35%) |
| Teste Contato Telefone | 0.0313 | ❌ NÃO (3.13%) |

**Análise:** Palavra mais longa tem score melhor (23.33%), mas ainda não passa no threshold.

---

### 5. Busca: "contato telefone"

| Documento | Score | Trigram Match (%) |
|-----------|-------|-------------------|
| Teste Contato Telefone | **0.3269** | ✅ SIM (32.69%) |
| Teste Preço Produto | 0.0704 | ❌ NÃO (7.04%) |
| Teste Horário Funcionamento | 0.0132 | ❌ NÃO (1.32%) |

**Análise:** Duas palavras relevantes retornam 32.69% e passam no threshold.

---

### 6. Busca: "contato" (apenas 1 palavra)

| Documento | Score | Trigram Match (%) |
|-----------|-------|-------------------|
| Teste Contato Telefone | **0.1538** | ❌ NÃO (15.38%) |
| Teste Preço Produto | 0.0806 | ❌ NÃO (8.06%) |
| Teste Horário Funcionamento | 0.0149 | ❌ NÃO (1.49%) |

**Análise:** Palavra única não passa no threshold.

---

### 7. Busca: "telefone" (apenas 1 palavra)

| Documento | Score | Trigram Match (%) |
|-----------|-------|-------------------|
| Teste Contato Telefone | **0.1731** | ❌ NÃO (17.31%) |
| Teste Horário Funcionamento | 0.0000 | ❌ NÃO (0%) |
| Teste Preço Produto | 0.0000 | ❌ NÃO (0%) |

**Análise:** Palavra única não passa no threshold.

---

### 8. Busca: "preço produto"

| Documento | Score | Trigram Match (%) |
|-----------|-------|-------------------|
| Teste Preço Produto | **0.2034** | ❌ NÃO (20.34%) |
| Teste Contato Telefone | 0.0492 | ❌ NÃO (4.92%) |
| Teste Horário Funcionamento | 0.0141 | ❌ NÃO (1.41%) |

**Análise:** Duas palavras curtas não atingem threshold (20.34% < 30%).

---

### 9. Busca: "preço" (apenas 1 palavra)

| Documento | Score | Trigram Match (%) |
|-----------|-------|-------------------|
| Teste Preço Produto | **0.1017** | ❌ NÃO (10.17%) |
| Teste Contato Telefone | 0.0357 | ❌ NÃO (3.57%) |
| Teste Horário Funcionamento | 0.0000 | ❌ NÃO (0%) |

**Análise:** Palavra curta (5 letras) tem score baixo.

---

### 10. Busca: "produto" (apenas 1 palavra)

| Documento | Score | Trigram Match (%) |
|-----------|-------|-------------------|
| Teste Preço Produto | **0.1356** | ❌ NÃO (13.56%) |
| Teste Contato Telefone | 0.0345 | ❌ NÃO (3.45%) |
| Teste Horário Funcionamento | 0.0149 | ❌ NÃO (1.49%) |

**Análise:** Palavra média (7 letras) tem score melhor que "preço", mas ainda não passa.

---

## Conclusões

### 1. Threshold do Trigram Match
O operador `%` (trigram match) do PostgreSQL tem um **threshold padrão de ~30%**. Apenas buscas que atingem esse score são retornadas quando usamos `WHERE content % 'busca'`.

### 2. Scores Observados

| Tipo de Busca | Score Típico | Passa no Threshold? |
|---------------|--------------|---------------------|
| Frase completa (3+ palavras) | 35-45% | ✅ SIM |
| Duas palavras relevantes | 30-40% | ✅ SIM (borderline) |
| Duas palavras curtas | 20-25% | ❌ NÃO |
| Uma palavra longa (10+ letras) | 20-25% | ❌ NÃO |
| Uma palavra média (7-9 letras) | 13-17% | ❌ NÃO |
| Uma palavra curta (5-6 letras) | 10-15% | ❌ NÃO |

### 3. Problema Identificado no Sistema

**Por que o chat retornava 0.0% de similaridade?**

1. ✅ As funções RPC estavam buscando na tabela `documents` (sem embeddings)
2. ✅ Corrigimos para buscar em `rag_documents` (com embeddings)
3. ❌ **MAS**: As buscas dos usuários provavelmente são palavras únicas ou frases curtas que não atingem o threshold de 30%

**Exemplo:**
- Busca: "horário" → Score: 13.33% → **NÃO retorna resultado**
- Busca: "funcionamento" → Score: 23.33% → **NÃO retorna resultado**
- Busca: "horário funcionamento" → Score: 36.67% → **✅ Retorna resultado**

### 4. Recomendações

#### Opção 1: Reduzir o threshold do pg_trgm
```sql
SET pg_trgm.similarity_threshold = 0.1;  -- Padrão é 0.3 (30%)
```

#### Opção 2: Não usar o operador % (sempre calcular similarity)
```sql
-- Ao invés de:
WHERE content % search_term

-- Usar:
WHERE similarity(content, search_term) > 0.1
ORDER BY similarity(content, search_term) DESC
```

#### Opção 3: Combinar múltiplas estratégias
- Busca vetorial (embeddings) para semântica
- Busca trigram para palavras exatas
- Busca ILIKE para matches parciais
- **Retornar resultados mesmo com score baixo** (0.1+)

### 5. Próximos Passos

1. ✅ Atualizar funções RPC para não usar operador `%`
2. ✅ Retornar resultados com score > 0.1 (10%)
3. ✅ Testar no chat com buscas reais
4. ✅ Gerar embeddings para os documentos de teste
5. ✅ Testar busca híbrida (trigram + vetorial)

---

## Dados Técnicos

- **Extensão:** pg_trgm 1.6
- **Threshold padrão:** 0.3 (30%)
- **Operador:** `%` (trigram match)
- **Função:** `similarity(text, text)` retorna REAL entre 0 e 1
- **Tabela:** `rag_documents` (20 docs com embeddings + 3 docs de teste)
