import request from 'supertest';
import app from '../index';

describe('Leads API', () => {
  describe('GET /api/v1/leads/analysis', () => {
    it('should return lead analysis data', async () => {
      const response = await request(app)
        .get('/api/v1/leads/analysis');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      
      //Data should be an array
      expect(Array.isArray(response.body.data)).toBe(true);
    }, 60000); // Timeout de 60 segundos para análise de leads
  });

  describe('GET /api/v1/leads/:customerId/metrics', () => {
    it('should return 404 if customerId is missing', async () => {
      const response = await request(app)
        .get('/api/v1/leads/metrics'); //Missing customerId

      expect(response.status).toBe(404);
    });

    it('should return 200 with metrics for any customerId', async () => {
      const response = await request(app)
        .get('/api/v1/leads/non-existent-customer/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/v1/leads/:customerId/status', () => {
    it('should return 404 if customerId is missing', async () => {
      const response = await request(app)
        .get('/api/v1/leads/status'); //Missing customerId

      expect(response.status).toBe(404);
    });

    it('should return lead status for valid customerId', async () => {
      const response = await request(app)
        .get('/api/v1/leads/test-customer/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
    });
  });

  describe('GET /api/v1/leads/:customerId/abandonment', () => {
    it('should return 404 if customerId is missing', async () => {
      const response = await request(app)
        .get('/api/v1/leads/abandonment'); //Missing customerId

      expect(response.status).toBe(404);
    });

    it('should return abandonment points for valid customerId', async () => {
      const response = await request(app)
        .get('/api/v1/leads/test-customer/abandonment');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/leads/:customerId/conversion', () => {
    it('should return 404 if customerId is missing', async () => {
      const response = await request(app)
        .get('/api/v1/leads/conversion'); //Missing customerId

      expect(response.status).toBe(404);
    });

    it('should return conversion analysis for valid customerId', async () => {
      const response = await request(app)
        .get('/api/v1/leads/test-customer/conversion');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('probability');
    });
  });
});