# NeuroPgRag Server

API Server em Express + TypeScript para Chat AI com RAG + WhatsApp

## 🚀 Instalação

```bash
cd server
npm install
```

## 🔧 Configuração

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente no `.env`

## 📦 Scripts

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Build para produção
npm run build

# Executar produção
npm start

# Lint
npm run lint
```

## 📡 Endpoints

### Health Check
```
GET /health
```

**Resposta:**
```json
{
  "status": "ok",
  "message": "API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Upload de Documentos
```
POST /api/v1/docs
Content-Type: multipart/form-data
```

**Parâmetros:**
- `file` (File): Arquivo PDF, TXT ou MD (máx. 10MB)

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:4000/api/v1/docs \
  -F "file=@documento.pdf"
```

**Exemplo com JavaScript:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:4000/api/v1/docs', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "message": "Documento enviado com sucesso",
  "document": {
    "id": "doc_1234567890_abc123",
    "filename": "documento.pdf",
    "type": "pdf",
    "size": 45678,
    "uploadedAt": "2024-01-15T10:30:00.000Z",
    "contentPreview": "Este é o início do conteúdo...",
    "characterCount": 5432
  }
}
```

**Erros:**
- `400` - Nenhum arquivo enviado
- `400` - Tipo de arquivo inválido
- `400` - Arquivo muito grande (>10MB)
- `500` - Erro ao processar arquivo

---

### Listar Documentos (TODO)
```
GET /api/v1/docs
```

---

### Obter Documento (TODO)
```
GET /api/v1/docs/:id
```

---

### Deletar Documento (TODO)
```
DELETE /api/v1/docs/:id
```

## 🏗️ Estrutura do Projeto

```
server/
├── src/
│   ├── index.ts           # Entry point
│   ├── routes/
│   │   └── docs.ts        # Rotas de documentos
│   ├── controllers/       # (TODO)
│   ├── services/          # (TODO)
│   └── utils/             # (TODO)
├── uploads/               # Arquivos temporários
├── dist/                  # Build de produção
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `4000` |
| `NODE_ENV` | Ambiente | `development` |
| `OPENROUTER_API_KEY` | API Key do OpenRouter | - |
| `EVOLUTION_API_URL` | URL da Evolution API | - |
| `EVOLUTION_API_KEY` | API Key da Evolution | - |
| `DATABASE_URL` | URL do PostgreSQL | - |

## 📝 TODO

- [ ] Integração com banco de dados (PostgreSQL/Supabase)
- [ ] Implementar chunking de documentos
- [ ] Gerar embeddings para RAG
- [ ] Endpoint de chat com IA
- [ ] Webhook do WhatsApp
- [ ] Sistema de autenticação
- [ ] Rate limiting
- [ ] Testes unitários
- [ ] Documentação Swagger/OpenAPI

## 🧪 Testando

```bash
# Testar health check
curl http://localhost:4000/health

# Testar upload de documento
curl -X POST http://localhost:4000/api/v1/docs \
  -F "file=@README.md"
```

## 📚 Tecnologias

- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Multer** - Upload de arquivos
- **pdf-parse** - Extração de texto de PDFs
- **tsx** - TypeScript executor para desenvolvimento
