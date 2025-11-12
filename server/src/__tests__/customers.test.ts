import request from 'supertest';
import app from '../index';

describe('Customers API', () => {
  let createdCustomerId: string;

  describe('POST /api/v1/customers', () => {
    it('deve criar um novo cliente com sucesso', async () => {
      const response = await request(app)
        .post('/api/v1/customers')
        .send({
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+5511999999999',
          company: 'Test Corp',
          segment: 'Enterprise'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customer).toHaveProperty('id');
      expect(response.body.data.customer.name).toBe('Test Customer');
      
      createdCustomerId = response.body.data.customer.id;
    });

    it('deve retornar erro quando name está ausente', async () => {
      const response = await request(app)
        .post('/api/v1/customers')
        .send({
          email: 'test2@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('obrigatório');
    });
  });

  describe('GET /api/v1/customers', () => {
    it('deve listar todos os clientes', async () => {
      const response = await request(app)
        .get('/api/v1/customers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.customers)).toBe(true);
      expect(response.body.data.customers.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/customers/:id', () => {
    it('deve obter um cliente específico', async () => {
      const response = await request(app)
        .get(`/api/v1/customers/${createdCustomerId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customer.id).toBe(createdCustomerId);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/customers/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/customers/:id', () => {
    it('deve atualizar um cliente', async () => {
      const response = await request(app)
        .put(`/api/v1/customers/${createdCustomerId}`)
        .send({
          name: 'Updated Customer',
          total_spent: 5000
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customer.name).toBe('Updated Customer');
    });
  });

  describe('DELETE /api/v1/customers/:id', () => {
    it('deve deletar um cliente', async () => {
      const response = await request(app)
        .delete(`/api/v1/customers/${createdCustomerId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
