Chat de IA com RAG + WhatsApp
Crie um sistema de chat com IA, RAG e integração WhatsApp via Evolution API

📌 Registro de mudanças: [CHANGELOG.md](./CHANGELOG.md)

✅ Requisitos
1. Painel de Configurações
API Key da Open Router
Seletor de modelo (GPT-4, Claude, Llama, etc.)
System Prompt editável
2. RAG - Sistema de Documentos
Upload de arquivos (PDF, TXT, MD)
Listar e deletar documentos
Usar documentos como contexto nas respostas
3. Integração WhatsApp
Webhook para receber mensagens
Processar com IA + RAG
Enviar respostas via Evolution API
4. Interface de Teste
Interface de chat local para testar
Histórico de conversas
5. Stack Técnico
Frontend: React + TypeScript + Vite
Backend: API Routes (Vercel) ou Express
Banco: Supabase, Firebase, MongoDB ou PostgreSQL
Deploy: Vercel (obrigatório)
🔑 Credenciais
Evolution API URL: https://evodevs.cordex.ai

Evolution API Key: V0e3EBKbaJFnKREYfFCqOnoi904vAPV7
integre todas as rotas e gere os testes com jest 
Docs: doc.evolution-api.com

📦 Entrega
GitHub público com código + README + PROCESSO.md
Deploy Vercel funcionando
Credenciais do banco no README para acesso
🔥 Padrão de Commits
[AI] = Código gerado por IA | [MANUAL] = Ajuste manual | [REFACTOR] = Refatoração

Importante: Um commit por prompt! Commits [AI] devem incluir o prompt enviado para a IA na descrição.

git commit -m "[AI] Add configuration form" -m "Prompt: Create a config form with API key and model selector"
git commit -m "[MANUAL] Fix TypeScript errors"
git commit -m "[AI] Implement document upload" -m "Prompt: Add PDF upload with file validation"
git commit -m "[REFACTOR] Extract RAG logic"
Extras (Opcionais)
Dashboard com métricas
Visualização de kanban (fases) para os chats
Integração com MCPs
Busca e filtros nas conversas
Exportação de conversas (PDF/JSON)
Sistema de avaliação de respostas

## Como foi feito

Este ciclo começou mapeando as histórias de clientes reais que chegam pelo WhatsApp pedindo demonstrações rápidas. Extraí as dúvidas recorrentes do time comercial, escrevi diálogos completos (cliente + atendente) e converti tudo em JSON pronto para o importador `server/src/scripts/importWhatsAppHistory.ts`. Cada mensagem segue a linha do tempo verdadeira do lead, descreve 1 produto adquirido e é preparada para receber embeddings reais via OpenRouter.

## Como funciona

1. Salve os arquivos dentro de `server/data/example`.
2. Execute o importador (`bun --cwd server scripts/run-import.ts import -p server/data/example`) com as credenciais do Supabase.
3. A cada mensagem o script cria o cliente (caso não exista), gera embeddings reais (com fallback sintético) e guarda o sentimento para alimentar métricas.

Os novos cenários cobrem cafeteria, logística, saúde, educação, moda e turismo para testar se o pipeline reage bem a perfis distintos.

## Como testar

1. Configure o `.env` em `server/` com `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` e `OPENROUTER_API_KEY`.
2. Rode `bun --cwd server scripts/run-import.ts import -p server/data/example` para popular `customers` + `interactions`.
3. Confira em `npm --prefix app run dev` (ou `bun --cwd app dev`) se os cards de métricas refletem as novas conversões.

## Fontes

- [Principais Métricas de um Ecommerce — Mago do Ecommerce](https://www.youtube.com/watch?v=kZmVJfO0N-0&utm_source=openai)
- [OpenAI — Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Supabase — Documentação Oficial](https://supabase.com/docs)