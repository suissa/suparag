import request from 'supertest';
import app from '../index';

describe('Settings API', () => {
  describe('GET /api/v1/settings', () => {
    it('should return all settings', async () => {
      const response = await request(app).get('/api/v1/settings');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('settings');
      expect(typeof response.body.settings).toBe('object');
    });

    it('should return settings with expected keys', async () => {
      const response = await request(app).get('/api/v1/settings');

      expect(response.body.settings).toHaveProperty('openrouter_api_key');
      expect(response.body.settings).toHaveProperty('selected_model');
      expect(response.body.settings).toHaveProperty('system_prompt');
    });
  });

  describe('GET /api/v1/settings/:key', () => {
    it('should return a specific setting', async () => {
      const response = await request(app).get('/api/v1/settings/selected_model');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('key', 'selected_model');
      expect(response.body).toHaveProperty('value');
    });

    it('should return 404 for non-existent setting', async () => {
      const response = await request(app).get('/api/v1/settings/non_existent_key');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Setting not found');
    });
  });

  describe('POST /api/v1/settings', () => {
    it('should create a new setting', async () => {
      const newSetting = {
        key: 'test_setting',
        value: 'test_value'
      };

      const response = await request(app)
        .post('/api/v1/settings')
        .send(newSetting);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.setting).toHaveProperty('key', 'test_setting');
      expect(response.body.setting).toHaveProperty('value', 'test_value');
    });

    it('should update existing setting', async () => {
      const updatedSetting = {
        key: 'selected_model',
        value: 'gpt-4-turbo'
      };

      const response = await request(app)
        .post('/api/v1/settings')
        .send(updatedSetting);

      expect(response.status).toBe(201);
      expect(response.body.setting).toHaveProperty('value', 'gpt-4-turbo');
    });

    it('should return 400 if key is missing', async () => {
      const response = await request(app)
        .post('/api/v1/settings')
        .send({ value: 'test' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should return 400 if value is missing', async () => {
      const response = await request(app)
        .post('/api/v1/settings')
        .send({ key: 'test' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });
  });

  describe('PUT /api/v1/settings/:key', () => {
    it('should update a setting', async () => {
      const response = await request(app)
        .put('/api/v1/settings/selected_model')
        .send({ value: 'claude-3' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.setting).toHaveProperty('value', 'claude-3');
    });

    it('should return 400 if value is missing', async () => {
      const response = await request(app)
        .put('/api/v1/settings/selected_model')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required field');
    });
  });

  describe('DELETE /api/v1/settings/:key', () => {
    it('should delete a setting', async () => {
      // Primeiro criar uma setting para deletar
      await request(app)
        .post('/api/v1/settings')
        .send({ key: 'temp_setting', value: 'temp' });

      const response = await request(app)
        .delete('/api/v1/settings/temp_setting');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('key', 'temp_setting');
    });
  });
});
