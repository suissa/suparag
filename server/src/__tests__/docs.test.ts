import request from 'supertest';
import app from '../index';
import path from 'path';
import fs from 'fs';

describe('Documents API', () => {
  let createdDocId: string;

  describe('POST /api/v1/docs', () => {
    it('should upload a text file', async () => {
      // Criar arquivo temporário
      const testFile = path.join(__dirname, 'test.txt');
      fs.writeFileSync(testFile, 'Este é um arquivo de teste para upload');

      const response = await request(app)
        .post('/api/v1/docs')
        .attach('file', testFile);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.document).toHaveProperty('id');
      expect(response.body.document).toHaveProperty('filename', 'test.txt');
      expect(response.body.document).toHaveProperty('type', 'txt');

      createdDocId = response.body.document.id;

      // Limpar arquivo temporário
      fs.unlinkSync(testFile);
    });

    it('should upload a markdown file', async () => {
      const testFile = path.join(__dirname, 'test.md');
      fs.writeFileSync(testFile, '# Teste\n\nEste é um arquivo markdown de teste');

      const response = await request(app)
        .post('/api/v1/docs')
        .attach('file', testFile);

      expect(response.status).toBe(201);
      expect(response.body.document).toHaveProperty('type', 'md');

      fs.unlinkSync(testFile);
    });

    it('should return 400 if no file is uploaded', async () => {
      const response = await request(app).post('/api/v1/docs');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No file uploaded');
    });

    it('should return error for invalid file type', async () => {
      const testFile = path.join(__dirname, 'test.png');
      fs.writeFileSync(testFile, 'fake image data');

      const response = await request(app)
        .post('/api/v1/docs')
        .attach('file', testFile);

      // Multer retorna 500 para erros de validação de arquivo
      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Tipo de arquivo não permitido');

      fs.unlinkSync(testFile);
    });
  });

  describe('GET /api/v1/docs', () => {
    it('should list all documents', async () => {
      const response = await request(app).get('/api/v1/docs');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('documents');
      expect(Array.isArray(response.body.documents)).toBe(true);
    });

    it('should return documents with correct structure', async () => {
      const response = await request(app).get('/api/v1/docs');

      if (response.body.documents.length > 0) {
        const doc = response.body.documents[0];
        expect(doc).toHaveProperty('id');
        expect(doc).toHaveProperty('title');
        expect(doc).toHaveProperty('filename');
        expect(doc).toHaveProperty('type');
        expect(doc).toHaveProperty('size');
      }
    });
  });

  describe('GET /api/v1/docs/:id', () => {
    it('should return a specific document', async () => {
      if (!createdDocId) {
        // Criar um documento se não existir
        const testFile = path.join(__dirname, 'temp.txt');
        fs.writeFileSync(testFile, 'Documento temporário');
        const uploadRes = await request(app)
          .post('/api/v1/docs')
          .attach('file', testFile);
        createdDocId = uploadRes.body.document.id;
        fs.unlinkSync(testFile);
      }

      const response = await request(app).get(`/api/v1/docs/${createdDocId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.document).toHaveProperty('id', createdDocId);
      expect(response.body.document).toHaveProperty('content');
    });

    it('should return 404 for non-existent document', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/v1/docs/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Document not found');
    });
  });

  describe('DELETE /api/v1/docs/:id', () => {
    it('should delete a document', async () => {
      // Criar documento para deletar
      const testFile = path.join(__dirname, 'delete-test.txt');
      fs.writeFileSync(testFile, 'Documento para deletar');
      const uploadRes = await request(app)
        .post('/api/v1/docs')
        .attach('file', testFile);
      const docId = uploadRes.body.document.id;
      fs.unlinkSync(testFile);

      const response = await request(app).delete(`/api/v1/docs/${docId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('id', docId);
    });
  });
});
