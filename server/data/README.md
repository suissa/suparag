# Dataset de Importação WhatsApp

📌 Histórico completo em [CHANGELOG.md](../../CHANGELOG.md)

## Como foi feito

- Levantei as principais objeções e perfis presentes nas qualificações reais (cafeteria, logística, saúde, imóveis, educação, turismo e ONG).
- Modelei cada cliente em um arquivo JSON (formato `{ phone, messages[] }`) respeitando cronologia e resultado final: compra de 1 produto.
- Mantive mensagens humanizadas para que o importador gere embeddings reais coerentes com cada pedido.

## Como funciona

1. O script `server/src/scripts/importWhatsAppHistory.ts` lê todos os JSON da pasta `example/`.
2. Para cada mensagem, ele aplica a função de mapeamento, gera embeddings via OpenRouter (com fallback sintético) e calcula sentimento.
3. Os registros são inseridos nas tabelas `customers` e `interactions`, permitindo métricas de funil e análises com pgvector.

## Como testar

1. Configure o `.env` dentro de `server/` com `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` e `OPENROUTER_API_KEY`.
2. Rode `bun --cwd server scripts/run-import.ts import -p server/data/example`.
3. Verifique no dashboard (rota `/customers`) se os novos leads, interações e métricas aparecem, incluindo tempo até a compra de 1 produto.

## Fontes

- [Principais Métricas de um Ecommerce — Mago do Ecommerce](https://www.youtube.com/watch?v=kZmVJfO0N-0&utm_source=openai)
- [OpenAI — Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Supabase — Documentação Oficial](https://supabase.com/docs)

