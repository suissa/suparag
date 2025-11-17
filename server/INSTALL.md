# 🚀 Guia de Instalação - SUPARAG Server

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## Passo a Passo

### 1. Instalar dependências

```bash
cd server
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
PORT=4000
NODE_ENV=development

OPENROUTER_API_KEY=your-api-key-here
EVOLUTION_API_URL=https://evodevs.cordex.ai
EVOLUTION_API_KEY=V0e3EBKbaJFnKREYfFCqOnoi904vAPV7
```

### 3. Iniciar servidor em desenvolvimento

```bash
npm run dev
```

O servidor estará rodando em: `http://localhost:4000`

### 4. Testar a API

**Opção 1: Health Check**
```bash
curl http://localhost:4000/health
```

**Opção 2: Upload de documento**
```bash
curl -X POST http://localhost:4000/api/v1/docs \
  -F "file=@README.md"
```

**Opção 3: Script de teste automatizado**
```bash
chmod +x test-upload.sh
./test-upload.sh
```

## 📦 Build para Produção

```bash
# Compilar TypeScript
npm run build

# Executar versão compilada
npm start
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'express'"
```bash
npm install
```

### Erro: "Port 4000 already in use"
Altere a porta no arquivo `.env`:
```env
PORT=5000
```

### Erro ao fazer upload de PDF
Certifique-se de que o `pdf-parse` está instalado:
```bash
npm install pdf-parse
```

## 📝 Próximos Passos

1. Integrar com banco de dados (PostgreSQL/Supabase)
2. Implementar sistema de RAG (chunking + embeddings)
3. Criar endpoint de chat com IA
4. Configurar webhook do WhatsApp
5. Deploy na Vercel ou Railway

## 🔗 Links Úteis

- [Express Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Multer Documentation](https://github.com/expressjs/multer)
- [pdf-parse Documentation](https://www.npmjs.com/package/pdf-parse)
