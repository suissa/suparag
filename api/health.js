// Exemplo de API serverless para Vercel
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
}
