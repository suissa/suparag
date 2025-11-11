Chat de IA com RAG + WhatsApp
Crie um sistema de chat com IA, RAG e integração WhatsApp via Evolution API

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