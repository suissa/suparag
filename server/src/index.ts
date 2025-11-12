import express from 'express';
import cors from 'cors';
import { validateEnv, env } from './config/env';
import docsRouter from './routes/docs';
import settingsRouter from './routes/settings';
import chunksRouter from './routes/chunks';
import webhookRouter from './routes/webhook';
import graphRouter from './routes/graph';
import whatsappRouter from './routes/whatsapp';
import chatRouter from './routes/chat';
import customersRouter from './routes/customers';
import interactionsRouter from './routes/interactions';
import ticketsRouter from './routes/tickets';
import ragRouter from './routes/rag';

// Validar variáveis de ambiente no startup
try {
  validateEnv();
  console.log('✅ Variáveis de ambiente validadas com sucesso');
} catch (error) {
  console.error('❌ Falha na validação de variáveis de ambiente');
  process.exit(1);
}

const app = express();
const PORT = env.port;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/docs', docsRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/chunks', chunksRouter);
app.use('/api/v1/webhook', webhookRouter);
app.use('/api/v1/graph', graphRouter);
app.use('/api/v1/whatsapp', whatsappRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/interactions', interactionsRouter);
app.use('/api/v1/tickets', ticketsRouter);
app.use('/api/v1/rag', ragRouter);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`📄 Docs API: http://localhost:${PORT}/api/v1/docs`);
  console.log(`⚙️  Settings API: http://localhost:${PORT}/api/v1/settings`);
  console.log(`📦 Chunks API: http://localhost:${PORT}/api/v1/chunks`);
  console.log(`📲 Webhook API: http://localhost:${PORT}/api/v1/webhook`);
  console.log(`🕸️  Graph API: http://localhost:${PORT}/api/v1/graph`);
  console.log(`💬 WhatsApp API: http://localhost:${PORT}/api/v1/whatsapp`);
  console.log(`🤖 Chat API: http://localhost:${PORT}/api/v1/chat`);
  console.log(`👥 Customers API: http://localhost:${PORT}/api/v1/customers`);
  console.log(`💬 Interactions API: http://localhost:${PORT}/api/v1/interactions`);
  console.log(`🎫 Tickets API: http://localhost:${PORT}/api/v1/tickets`);
  console.log(`🔍 RAG API: http://localhost:${PORT}/api/v1/rag`);
});

export default app;
