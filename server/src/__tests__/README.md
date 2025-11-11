# Testes - NeuroPgRag Server

Testes automatizados usando Jest e Supertest.

## 🧪 Executar Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage
```

## 📋 Suítes de Testes

### 1. Health Check (`health.test.ts`)
- ✅ Verifica se a API está rodando
- ✅ Valida formato do timestamp

### 2. Settings API (`settings.test.ts`)
- ✅ GET /api/v1/settings - Listar todas as configurações
- ✅ GET /api/v1/settings/:key - Obter configuração específica
- ✅ POST /api/v1/settings - Criar/atualizar configuração
- ✅ PUT /api/v1/settings/:key - Atualizar configuração
- ✅ DELETE /api/v1/settings/:key - Deletar configuração
- ✅ Validações de campos obrigatórios
- ✅ Tratamento de erros 404

### 3. Documents API (`docs.test.ts`)
- ✅ POST /api/v1/docs - Upload de arquivos (TXT, MD, PDF)
- ✅ GET /api/v1/docs - Listar documentos
- ✅ GET /api/v1/docs/:id - Obter documento específico
- ✅ DELETE /api/v1/docs/:id - Deletar documento
- ✅ Validação de tipos de arquivo
- ✅ Tratamento de erros de upload

### 4. Chunks API (`chunks.test.ts`)
- ✅ POST /api/v1/chunks - Criar chunk
- ✅ GET /api/v1/chunks - Listar chunks (com filtro por document_id)
- ✅ GET /api/v1/chunks/:id - Obter chunk específico
- ✅ DELETE /api/v1/chunks/:id - Deletar chunk
- ✅ Validação de campos obrigatórios
- ✅ Ordenação por chunk_index

## 🎯 Cobertura de Testes

Execute `npm run test:coverage` para ver o relatório de cobertura.

O relatório será gerado em `coverage/index.html`.

## 📝 Estrutura dos Testes

```
src/__tests__/
├── health.test.ts      # Testes de health check
├── settings.test.ts    # Testes da API de configurações
├── docs.test.ts        # Testes da API de documentos
├── chunks.test.ts      # Testes da API de chunks
└── README.md           # Esta documentação
```

## 🔧 Configuração

Os testes usam:
- **Jest** - Framework de testes
- **Supertest** - Testes de API HTTP
- **ts-jest** - Suporte a TypeScript

Configuração em `jest.config.js`.

## ⚠️ Notas Importantes

1. Os testes criam e deletam dados reais no Supabase
2. Certifique-se de ter as variáveis de ambiente configuradas
3. Use um banco de dados de teste separado se possível
4. Alguns testes dependem de outros (beforeAll/afterAll)

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Supabase connection failed"
Verifique se o `.env` está configurado corretamente:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Testes falhando
1. Verifique se o servidor não está rodando (porta 4000)
2. Limpe o banco de dados de teste
3. Execute os testes individualmente para identificar o problema
