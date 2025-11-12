# 🧪 Teste de Integração Completa

## Passo 1: Iniciar o Backend

```bash
cd server
npm install
npm run dev
```

Aguarde a mensagem:
```
🚀 Server running on http://localhost:4000
📄 Docs API: http://localhost:4000/api/v1/docs
```

## Passo 2: Iniciar o Frontend

```bash
cd app
npm install
npm run dev
```

Aguarde a mensagem:
```
VITE v7.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Passo 3: Testar Upload

1. Acesse: http://localhost:5173
2. Clique em "Escolher Arquivo"
3. Selecione um arquivo (PDF, TXT ou MD)
4. Clique em "Fazer Upload"
5. Aguarde o processamento
6. Verifique a mensagem de sucesso com os detalhes do documento

## Passo 4: Verificar no Frontend

1. Clique em "Documentos" no menu lateral
2. Veja o documento listado
3. Clique no ícone de olho (👁️) para visualizar o conteúdo completo
4. Verifique os metadados: tipo, tamanho, caracteres, data

## Passo 5: Verificar no Supabase (via MCP)

Execute este comando no terminal do Kiro para verificar os documentos:

```typescript
// Listar documentos
const { data } = await supabase.from('documents').select('*');
console.log(data);
```

Ou use a query SQL direta:

```sql
SELECT 
  id,
  title,
  metadata->>'filename' as filename,
  metadata->>'type' as type,
  metadata->>'size' as size,
  metadata->>'characterCount' as characters,
  created_at
FROM documents
ORDER BY created_at DESC
LIMIT 10;
```

## Passo 6: Testar Configurações

1. Clique em "Configurações" no menu
2. Veja as configurações atuais
3. Modifique um valor (ex: selected_model)
4. Clique em "Salvar"
5. Atualize a página e verifique se o valor foi salvo

## Passo 7: Testar Deleção

1. Volte para "Documentos"
2. Clique no ícone de lixeira (🗑️) em um documento
3. Confirme a deleção
4. Verifique que o documento foi removido da lista

## ✅ Checklist de Testes

- [ ] Backend iniciado sem erros
- [ ] Frontend iniciado sem erros
- [ ] Upload de arquivo TXT funciona
- [ ] Upload de arquivo MD funciona
- [ ] Upload de arquivo PDF funciona
- [ ] Documento aparece na listagem
- [ ] Visualização de documento funciona
- [ ] Deleção de documento funciona
- [ ] Configurações carregam corretamente
- [ ] Salvar configuração funciona
- [ ] Documento está no Supabase

## 🐛 Problemas Comuns

### Frontend não conecta com Backend
- Verifique se o backend está rodando na porta 4000
- Verifique o arquivo `app/.env`
- Verifique o console do navegador para erros de CORS

### Upload falha
- Verifique o tamanho do arquivo (máx. 10MB)
- Verifique o tipo do arquivo (PDF, TXT, MD)
- Verifique os logs do servidor

### Documento não aparece no Supabase
- Verifique as credenciais do Supabase no `server/.env`
- Verifique os logs do servidor para erros de conexão
- Teste a conexão com o Supabase manualmente

## 📊 Métricas Esperadas

Após upload bem-sucedido, você deve ver:

**No Frontend:**
- ID do documento (UUID)
- Nome do arquivo
- Tipo (PDF/TXT/MD)
- Tamanho em bytes
- Número de caracteres
- Data/hora do upload
- Preview do conteúdo (primeiros 200 caracteres)

**No Supabase:**
- Registro na tabela `documents`
- Campo `title` preenchido
- Campo `content` com texto extraído
- Campo `metadata` com informações do arquivo
- Campo `tokens` com tsvector para busca
- Campo `source` = 'upload'
- Timestamps `created_at` e `updated_at`

## 🎉 Sucesso!

Se todos os testes passaram, sua integração está funcionando perfeitamente! 🚀

Próximos passos:
1. Implementar página de Chat
2. Implementar visualização do Grafo
3. Integrar com WhatsApp via Evolution API
4. Implementar sistema RAG completo
