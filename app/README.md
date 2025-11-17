# SUPARAG - Dashboard

Interface web para o sistema de Chat AI com RAG + WhatsApp.

## 🚀 Instalação

```bash
cd app
npm install
```

## 🔧 Configuração

O arquivo `.env` já está configurado para conectar com a API local:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

## 📦 Executar

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🎨 Funcionalidades

### 1. Upload de Documentos
- Upload de arquivos PDF, TXT e MD
- Validação de tipo e tamanho (máx. 10MB)
- Preview do conteúdo extraído
- Feedback visual de sucesso/erro

### 2. Listagem de Documentos
- Visualização de todos os documentos
- Detalhes: tipo, tamanho, caracteres, data
- Visualizar conteúdo completo
- Deletar documentos

### 3. Configurações
- Gerenciar configurações do sistema
- OpenRouter API Key
- Modelo selecionado
- System Prompt

### 4. Chat (Em desenvolvimento)
- Interface de chat com IA
- Integração com RAG
- Histórico de conversas

### 5. Grafo (Em desenvolvimento)
- Visualização do grafo de conhecimento
- Relações entre documentos
- Busca de caminhos

## 🧪 Testar Integração

1. **Iniciar o servidor backend:**
```bash
cd server
npm run dev
```

2. **Iniciar o frontend:**
```bash
cd app
npm run dev
```

3. **Acessar:** http://localhost:5173

4. **Testar upload:**
   - Clique em "Escolher Arquivo"
   - Selecione um arquivo PDF, TXT ou MD
   - Clique em "Fazer Upload"
   - Verifique o sucesso e os detalhes do documento

5. **Verificar no banco:**
   - Acesse a página "Documentos"
   - Veja o documento listado
   - Clique no ícone de olho para visualizar o conteúdo

## 📊 Estrutura

```
app/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Layout principal com sidebar
│   ├── pages/
│   │   ├── Upload.tsx          # Página de upload
│   │   ├── Documents.tsx       # Listagem de documentos
│   │   └── Settings.tsx        # Configurações
│   ├── services/
│   │   └── api.ts              # Cliente API (axios)
│   ├── App.tsx                 # Rotas principais
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind CSS
├── .env                        # Variáveis de ambiente
├── tailwind.config.js          # Configuração Tailwind
└── package.json
```

## 🎨 Tecnologias

- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones

## 🔗 API Endpoints Utilizados

- `POST /api/v1/docs` - Upload de documentos
- `GET /api/v1/docs` - Listar documentos
- `GET /api/v1/docs/:id` - Obter documento
- `DELETE /api/v1/docs/:id` - Deletar documento
- `GET /api/v1/settings` - Listar configurações
- `POST /api/v1/settings` - Atualizar configuração

## 🐛 Troubleshooting

### Erro de CORS
Se encontrar erro de CORS, verifique se o servidor backend está com CORS habilitado:
```typescript
app.use(cors());
```

### API não conecta
Verifique se:
1. O servidor backend está rodando na porta 4000
2. A URL no `.env` está correta
3. Não há firewall bloqueando a conexão

### Build falha
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```
