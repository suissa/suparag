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


## Análise dos meus problemas e erros identificados

PROBLEMA: Nunca tinha usado o Supabase nem o pgvector diretamente, apenas via Lovable, fiz sisteminhas simples com RAG esse ano e ficou bom, eu deveria ter pesquisado anteriormente e ter pesquisado a melhor já bem definida e conhecida técnica/função para o pgvector
- SUGESTÃO agora sempre farei a busca teorica e implementada para poder definir corretanabete  a forma que a IA deve seguir. Eu só usei QDrant, FAISS, Pinecone e em produção somente o Weaviate (acho MTO bom) e em minhas pesquisas também encontrei também o Milvus.

- PROBLEMA: o pincipal foi ter utilizado o TRAE e acreditando no seu modo SOLO, tão bem falado antes, eu podia deixar ele SOLO até finalizar uma sequência de funcionalidades. Ele mudou coisas que não deveria, criou coisas dupplicadas, muitos eros de tipagem. NUNCA MAIS cometerei esse erro, fico somente no Kiro e Cursor na IDE e QWEN e Codex no CLI
- SUGESTÃO: definir que ele deve gerar os testes para cada funcionalidade gerada, ele deve ir corrigindo até passar em todos, para ai gerar um texto falando qual a funcionalidade criada, onde foi criada, seu nome e definir que ela não deve ser modificada, se o valor desejado do seu retorno não estiver de acordo o agente deve implementar um parser do resultado da funcionalidade para o tipo que esse agente deseja. Uma funcionalidade só pode ser modificada se eu pedir.

- PROBLEMA: ele não conseguia executar os testes por causa do caminho do WSL
- SUGESTÃO: definir que ao executar um colmando com PATH ele deve adicionar "\" após cada "\" que encontrar, ou usar `wsl -d Ubuntu -e bash -c {comando em UNIX-like}` ou testar o WSL MCP server. 

- PROBLEMA: ele comentava que o banco retornava um valor mas a API outra, até ele falar que podia esta r em cache, ai me liguei que a API estava sem hot-reaload
- SUGESTÃO: mesmo com hot-reload, definir que ele deve reiniciar o servidor para confirmar a mudança

## Melhorias necessárias

- rerank
- rerank human-in-the-loop

## Mudança no meu Vibe Coding

Não vou mais pedir para gerar a API após o banco gerado, principalmente quando existir execulção de funções RPC. Como eu ja modularizo todas as camadas da entidade na sua pasta, vou uma a uma, testando as funcionalidades dessa entidade via MCP, após estar válida, mando gerar o Repoitory cm que será o responsável pela interação com o Supabase:

```ts
export const listCustomers = async () <Customer[] | []> => 
  await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
```
