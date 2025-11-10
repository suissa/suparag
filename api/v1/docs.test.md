# Testando a API de Upload de Documentos

## Endpoint
`POST /api/v1/docs`

## Como testar

### 1. Usando cURL (TXT)
```bash
curl -X POST http://localhost:4000/api/v1/docs \
  -F "file=@documento.txt"
```

### 2. Usando cURL (MD)
```bash
curl -X POST http://localhost:4000/api/v1/docs \
  -F "file=@README.md"
```

### 3. Usando cURL (PDF)
```bash
curl -X POST http://localhost:4000/api/v1/docs \
  -F "file=@documento.pdf"
```

### 4. Usando JavaScript (Fetch)
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/v1/docs', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

### 5. Usando Postman
1. Selecione método POST
2. URL: `http://localhost:4000/api/v1/docs`
3. Body > form-data
4. Key: `file` (tipo: File)
5. Value: Selecione seu arquivo

## Resposta de Sucesso (201)
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
    "contentPreview": "Este é o início do conteúdo...",
    "characterCount": 5432
  }
}
```

## Erros Possíveis

### 400 - Nenhum arquivo enviado
```json
{
  "error": "No file uploaded",
  "message": "Please upload a file using the \"file\" field"
}
```

### 400 - Tipo de arquivo inválido
```json
{
  "error": "Invalid file type",
  "message": "Only PDF, TXT, and MD files are allowed",
  "received": "image/png"
}
```

### 400 - Arquivo muito grande
```json
{
  "error": "File too large",
  "message": "Maximum file size is 10MB",
  "received": "15.5MB"
}
```

### 405 - Método não permitido
```json
{
  "error": "Method not allowed",
  "message": "Use POST to upload documents"
}
```

### 500 - Erro no servidor
```json
{
  "error": "Upload failed",
  "message": "An error occurred while uploading the file"
}
```
