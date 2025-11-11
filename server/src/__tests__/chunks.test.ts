import request from 'supertest';
import app from '../index';
import path from 'path';
import fs from 'fs';

describe('Chunks API', () => {
  let testDocId: string;
  let testChunkId: string;

  beforeAll(async () => {
    // Criar um documento para usar nos testes
    const testFile = path.join(__dirname, 'chunk-test.txt');
    fs.writeFileSync(testFile, 'Documento para testar chunks');
    const uploadRes = await request(app)
      .post('/api/v1/docs')
      .attach('file', testFile);
    testDocId = uploadRes.body.document.id;
    fs.unlinkSync(testFile);
  });

  describe('POST /api/v1/chunks', () => {
    it('should create a chunk', async () => {
      const chunkData = {
        document_id: testDocId,
        chunk_index: 0,
        chunk_text: 'Este é o primeiro chunk do documento',
        metadata: { tokens: 10 }
      };

      const response = await request(app)
        .post('/api/v1/chunks')
        .send(chunkData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.chunk).toHaveProperty('id');
      expect(response.body.chunk).toHaveProperty('document_id', testDocId);
      expect(response.body.chunk).toHaveProperty('chunk_index', 0);
      expect(response.body.chunk).toHaveProperty('chunk_text', chunkData.chunk_text);

      testChunkId = response.body.chunk.id;
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/chunks')
        .send({ chunk_text: 'Texto sem document_id' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should create chunk without metadata', async () => {
      const chunkData = {
        document_id: testDocId,
        chunk_index: 1,
        chunk_text: 'Segundo chunk sem metadata'
      };

      const response = await request(app)
        .post('/api/v1/chunks')
        .send(chunkData);

      expect(response.status).toBe(201);
      expect(response.body.chunk).toHaveProperty('metadata');
    });
  });

  describe('GET /api/v1/chunks', () => {
    it('should list all chunks', async () => {
      const response = await request(app).get('/api/v1/chunks');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('chunks');
      expect(Array.isArray(response.body.chunks)).toBe(true);
    });

    it('should filter chunks by document_id', async () => {
      const response = await request(app)
        .get('/api/v1/chunks')
        .query({ document_id: testDocId });

      expect(response.status).toBe(200);
      expect(response.body.chunks.length).toBeGreaterThan(0);
      response.body.chunks.forEach((chunk: any) => {
        expect(chunk.document_id).toBe(testDocId);
      });
    });

    it('should return chunks ordered by chunk_index', async () => {
      const response = await request(app)
        .get('/api/v1/chunks')
        .query({ document_id: testDocId });

      const chunks = response.body.chunks;
      for (let i = 1; i < chunks.length; i++) {
        expect(chunks[i].chunk_index).toBeGreaterThanOrEqual(chunks[i - 1].chunk_index);
      }
    });
  });

  describe('GET /api/v1/chunks/:id', () => {
    it('should return a specific chunk', async () => {
      const response = await request(app).get(`/api/v1/chunks/${testChunkId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.chunk).toHaveProperty('id', testChunkId);
      expect(response.body.chunk).toHaveProperty('chunk_text');
    });

    it('should return 404 for non-existent chunk', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/v1/chunks/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Chunk not found');
    });
  });

  describe('DELETE /api/v1/chunks/:id', () => {
    it('should delete a chunk', async () => {
      // Criar chunk para deletar
      const chunkData = {
        document_id: testDocId,
        chunk_index: 99,
        chunk_text: 'Chunk para deletar'
      };
      const createRes = await request(app)
        .post('/api/v1/chunks')
        .send(chunkData);
      const chunkId = createRes.body.chunk.id;

      const response = await request(app).delete(`/api/v1/chunks/${chunkId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('id', chunkId);
    });
  });

  afterAll(async () => {
    // Limpar documento de teste
    if (testDocId) {
      await request(app).delete(`/api/v1/docs/${testDocId}`);
    }
  });
});
