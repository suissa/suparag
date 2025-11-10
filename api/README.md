# API Documentation

## Endpoints

### 1. Health Check
**GET** `/api/health`

Verifica se a API está funcionando.

**Resposta:**
```json
{
  "status": "ok",
  "message": "API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Upload de Documentos
**POST** `/api/v1/docs`

Faz upload de documentos para o sistema RAG.

**Content-Type:** `multipart/form-data`

**Parâmetros:**
- `file` (File, obrigatório): Arquivo PDF, TXT ou MD (máx. 10MB)

**Tipos aceitos:**
- `application/pdf` (.pdf)
- `text/plain` (.txt)
- `text/markdown` (.md)

**Exemplo de Request (cURL):**
```bash
curl -X POST http://localhost:4000/api/v1/docs \
  -F "file=@documento.pdf"
```

**Exemplo de Request (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/v1/docs', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "document": {
    "id": "doc_1234567890_abc123",
    "filename": "documento.pdf",
    "type": "pdf",
    "size": 45678,
    "uploadedAt": "2024-01-15T10:30:00.000Z",
    "contentPreview": "Este é o início do conteúdo extraído do documento...",
    "characterCount": 5432
  }
}
```

**Erros:**

| Código | Erro | Descrição |
|--------|------|-----------|
| 400 | No file uploaded | Nenhum arquivo foi enviado |
| 400 | Invalid file type | Tipo de arquivo não permitido |
| 400 | File too large | Arquivo excede 10MB |
| 405 | Method not allowed | Método HTTP não é POST |
| 500 | Upload failed | Erro interno no servidor |

**Exemplo de Erro (400):**
```json
{
  "error": "Invalid file type",
  "message": "Only PDF, TXT, and MD files are allowed",
  "received": "image/png"
}
```

---

## Próximos Endpoints (TODO)

### 3. Listar Documentos
**GET** `/api/v1/docs`

Lista todos os documentos enviados.

### 4. Obter Documento
**GET** `/api/v1/docs/:id`

Retorna detalhes de um documento específico.

### 5. Deletar Documento
**DELETE** `/api/v1/docs/:id`

Remove um documento do sistema.

### 6. Chat com IA
**POST** `/api/v1/chat`

Envia mensagem para o chat com contexto RAG.

### 7. Webhook WhatsApp
**POST** `/api/v1/webhook/whatsapp`

Recebe mensagens do WhatsApp via Evolution API.

---

## Variáveis de Ambiente

```env
# OpenRouter API
OPENROUTER_API_KEY=your-api-key-here

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://evodevs.cordex.ai
EVOLUTION_API_KEY=V0e3EBKbaJFnKREYfFCqOnoi904vAPV7

# Database (Supabase/PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Configurações
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,txt,md
```

---

## Instalação de Dependências

```bash
npm install formidable pdf-parse
```

---

## Deploy na Vercel

1. Configure as variáveis de ambiente no painel da Vercel
2. O `vercel.json` já está configurado para rotear `/api/*`
3. As funções serverless são criadas automaticamente para cada arquivo em `/api`

---

## Estrutura de Arquivos

```
api/
├── README.md              # Esta documentação
├── health.js              # Health check endpoint
└── v1/
    ├── docs.js            # Upload de documentos
    ├── docs.test.md       # Exemplos de teste
    └── (futuros endpoints)
```
