import request from 'supertest';
import app from '../index';

describe('Charts API - Success Cases', () => {
  let createdCustomerId: string;

  // Setup: criar customer de teste
  beforeAll(async () => {
    const customerResponse = await request(app)
      .post('/api/v1/customers')
      .send({
        name: 'Test Customer for Charts',
        email: 'charts-test@example.com',
        phone: '+5511999996666'
      });

    createdCustomerId = customerResponse.body.data.customer.id;
  });

  describe('POST /api/charts/:chartId/explain/audio', () => {
    it('deve criar explicação de gráfico com texto', async () => {
      const response = await request(app)
        .post('/api/charts/chart-1/explain/audio')
        .send({
          userId: createdCustomerId,
          metricSnapshot: {
            sales: 1000,
            revenue: 5000,
            customers: 50
          },
          explanationText: 'Este gráfico mostra as métricas principais de vendas.',
          generateAudio: false // Não gerar áudio nos testes
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('explanationId');
      expect(response.body.data).toHaveProperty('explanationText');
    });

    it('deve gerar explicação automaticamente se não fornecido texto', async () => {
      const response = await request(app)
        .post('/api/charts/chart-2/explain/audio')
        .send({
          userId: createdCustomerId,
          metricSnapshot: {
            sales: 2000,
            revenue: 10000
          },
          generateAudio: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('explanationText');
      expect(response.body.data.explanationText.length).toBeGreaterThan(0);
    });

    it('deve rejeitar chartId vazio', async () => {
      const response = await request(app)
        .post('/api/charts//explain/audio')
        .send({
          userId: createdCustomerId,
          metricSnapshot: {}
        });

      expect(response.status).toBe(404); // Rota não encontrada
    });

    it('deve rejeitar userId inválido', async () => {
      const response = await request(app)
        .post('/api/charts/chart-3/explain/audio')
        .send({
          userId: 'invalid-uuid',
          metricSnapshot: {}
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/charts/:chartId/explanations', () => {
    it('deve listar explicações de um gráfico', async () => {
      // Primeiro criar uma explicação
      await request(app)
        .post('/api/charts/chart-list-1/explain/audio')
        .send({
          userId: createdCustomerId,
          metricSnapshot: { sales: 1000 },
          generateAudio: false
        });

      // Depois listar
      const response = await request(app)
        .get('/api/charts/chart-list-1/explanations')
        .query({ userId: createdCustomerId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('deve rejeitar requisição sem userId', async () => {
      const response = await request(app)
        .get('/api/charts/chart-4/explanations');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('obrigatório');
    });
  });

  describe('GET /api/charts/explanations/:explanationId', () => {
    let createdExplanationId: string;

    beforeAll(async () => {
      // Criar explicação para buscar depois
      const createResponse = await request(app)
        .post('/api/charts/chart-get-1/explain/audio')
        .send({
          userId: createdCustomerId,
          metricSnapshot: { sales: 1000 },
          generateAudio: false
        });

      createdExplanationId = createResponse.body.data.explanationId;
    });

    it('deve buscar explicação por ID', async () => {
      const response = await request(app)
        .get(`/api/charts/explanations/${createdExplanationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', createdExplanationId);
      expect(response.body.data).toHaveProperty('chart_id', 'chart-get-1');
    });

    it('deve retornar 500 para ID inexistente (erro do Supabase)', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/charts/explanations/${fakeId}`);

      // Supabase retorna erro, então esperamos 500
      expect([404, 500]).toContain(response.status);
    });
  });
});

