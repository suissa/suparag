# Resumo das Correções: Problema de Similarity NaN → 0.0%

## Problema Original
Chat mostrava **NaN% relevance** nos sources, impossibilitando o usuário de ver a relevância dos documentos encontrados.

---

## Investigação e Descobertas

### 1️⃣ Primeira Descoberta: String "NaN"
**Problema:** As funções RPC do Supabase retornavam a **string "NaN"** ao invés de números.

**Evidência:**
```json
{
  "score": "NaN",
  "scoreType": "string",
  "similarity": "NaN", 
  "similarityType": "string"
}
```

**Causa:** JavaScript trata string "NaN" como truthy, então `c.score || c.similarity || 0` retornava "NaN" ao invés de 0.

**Solução Aplicada:**
```typescript
const parseScore = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};
```

**Resultado:** NaN% → 0.0%

---

### 2️⃣ Segunda Descoberta: Tabelas Erradas
**Problema:** Funções RPC buscavam na tabela `documents` (sem embeddings) ao invés de `rag_documents` (com embeddings).

**Evidência:**
- `rag_documents`: 20 docs, 20 embeddings ✅
- `documents`: 70 docs, 0 embeddings ❌

**Funções Afetadas:**
- `search_documents_fuzzy`
- `search_documents_ilike`
- `search_documents_hybrid_simple`

**Solução Aplicada:**
Migration `fix_search_functions_use_rag_documents` - Atualiza todas as funções para usar `rag_documents`.

**Resultado:** Funções agora buscam na tabela correta, mas ainda retornam 0.0%.

---

### 3️⃣ Terceira Descoberta: Threshold do pg_trgm
**Problema:** O operador `%` (trigram match) do PostgreSQL tem threshold padrão de **30%**.

**Evidência dos Testes:**

| Busca | Score | Passa no Threshold? |
|-------|-------|---------------------|
| "horário de funcionamento" | 41.67% | ✅ SIM |
| "horário funcionamento" | 36.67% | ✅ SIM |
| "horário" | 13.33% | ❌ NÃO |
| "funcionamento" | 23.33% | ❌ NÃO |
| "políticas" | 8.06% | ❌ NÃO |

**Causa:** Buscas com palavras únicas ou curtas não atingem 30%, então não retornam resultados.

**Solução Aplicada:**
1. Remover operador `%` das funções
2. Usar `WHERE similarity(content, search_term) > 0.05` diretamente
3. Reduzir threshold para **5%**

**Migrations Aplicadas:**
- `fix_trigram_threshold_remove_percent_operator`
- `fix_timestamp_types_in_search_functions`
- `reduce_trigram_threshold_to_005`

**Resultado:** Funções agora retornam resultados com score ≥ 5%.

---

## Testes Realizados

### Testes no Supabase (SQL Direto)

✅ **Busca: "horário"**
```sql
SELECT * FROM search_documents_fuzzy('horário');
-- Retorna: 1 documento, score 0.133333 (13.33%)
```

✅ **Busca: "políticas"**
```sql
SELECT * FROM search_documents_fuzzy('políticas');
-- Retorna: 5 documentos, scores entre 0.08 e 0.0806 (8%)
```

✅ **Busca: "funcionamento"**
```sql
SELECT * FROM search_documents_fuzzy('funcionamento');
-- Retorna: 1 documento, score 0.233333 (23.33%)
```

### Testes no Chat (Frontend)

❌ **Todas as buscas ainda retornam 0.0%**

**Possíveis Causas:**
1. Servidor Node.js não recarregou as mudanças (tsx watch não detectou)
2. Cache do Supabase client
3. Código antigo ainda sendo executado

---

## Correções Aplicadas

### Backend (server/src/routes/chat.ts)

1. **Função parseScore:**
```typescript
const parseScore = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};
```

2. **Logs detalhados:**
```typescript
console.log('📦 Chunk completo:', JSON.stringify({
  id: c.id?.substring(0, 8),
  score: c.score,
  similarity: c.similarity,
  combined_score: c.combined_score,
  source: c.source
}));
```

### Frontend (app/src/components/ChatPanel.tsx)

1. **Validação de tipo:**
```typescript
// Antes:
{source.similarity ? (source.similarity * 100).toFixed(1) : 'N/A'}

// Depois:
{typeof source.similarity === 'number' ? (source.similarity * 100).toFixed(1) : 'N/A'}
```

2. **Logs de debug:**
```typescript
response.data.sources?.forEach((source: any, idx: number) => {
  console.log(`Source ${idx}:`, {
    documentId: source.documentId,
    similarity: source.similarity,
    similarityType: typeof source.similarity
  });
});
```

### Database (Migrations)

1. **fix_search_functions_use_rag_documents:**
   - Atualiza 3 funções para usar `rag_documents`

2. **fix_trigram_threshold_remove_percent_operator:**
   - Remove operador `%` das funções
   - Usa `similarity(content, search_term) > 0.1` diretamente

3. **fix_timestamp_types_in_search_functions:**
   - Corrige tipos `timestamp without time zone` → `timestamp with time zone`

4. **reduce_trigram_threshold_to_005:**
   - Reduz threshold de 0.1 (10%) para 0.05 (5%)

---

## Status Atual

### ✅ Funcionando no Supabase
- Funções RPC retornam scores corretos
- Threshold de 5% permite buscas com palavras únicas
- Testes SQL confirmam funcionamento

### ❌ Não Funcionando no Chat
- Frontend ainda mostra 0.0%
- Servidor precisa ser reiniciado manualmente
- Logs do servidor não aparecem no console

---

## Próximos Passos

### 1. Reiniciar Servidor Backend
```bash
cd server
npm run dev
```

### 2. Limpar Cache do Navegador
- Ctrl + Shift + R (hard reload)
- Ou limpar cache do navegador

### 3. Verificar Logs do Servidor
- Verificar se os logs `📦 Chunk completo` aparecem
- Confirmar que scores estão chegando como números

### 4. Testar Novamente no Chat
- Buscar por "políticas"
- Buscar por "horário"
- Verificar se scores aparecem corretamente

---

## Documentação Criada

1. **TESTE_BUSCA_TRIGRAM.md** - Relatório completo dos testes de busca
2. **RESUMO_CORRECOES_SIMILARITY.md** - Este arquivo

---

## Commits Realizados

1. `:bug: fix: Corrige validacao de similarity no frontend`
2. `:bug: fix: Corrige parsing de similarity que vinha como string NaN`
3. `:bug: fix: Corrige funcoes RPC para usar rag_documents`
4. `:memo: docs: Adiciona relatorio completo de testes de busca trigram`
5. `:bug: fix: Atualiza funcoes RPC para threshold 0.05 e adiciona logs detalhados`

---

## Conclusão

**Problema resolvido no banco de dados ✅**
- Funções RPC funcionando corretamente
- Threshold ajustado para 5%
- Testes SQL confirmam scores corretos

**Problema pendente no frontend ❌**
- Servidor precisa reiniciar para aplicar mudanças
- Frontend ainda mostra 0.0%

**Recomendação:** Reiniciar o servidor backend manualmente e testar novamente.
