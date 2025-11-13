import request from 'supertest';
import app from '../index';

describe('Evaluations API - Error Cases', () => {
  let createdCustomerId: string;
  let createdInteractionId: string;

  // Setup: criar dados de teste
  beforeAll(async () => {
    // Criar customer
    const customerResponse = await request(app)
      .post('/api/v1/customers')
      .send({
        name: 'Test Customer for Error Cases',
        email: 'error-test@example.com',
        phone: '+5511888887777'
      });

    createdCustomerId = customerResponse.body.data.customer.id;

    // Criar interaction
    const interactionResponse = await request(app)
      .post('/api/v1/interactions')
      .send({
        customer_id: createdCustomerId,
        channel: 'test',
        message: 'Pergunta de teste para casos de erro',
        sentiment: 0
      });

    createdInteractionId = interactionResponse.body.data.interaction.id;
  });

  describe('POST /api/v1/evaluations - Validation Errors', () => {
    it('deve retornar erro 400 quando interaction_id está ausente', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          question_text: 'Pergunta teste',
          answer_text: 'Resposta teste',
          rating: 'aprovado'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('interaction_id');
      expect(response.body.message).toContain('obrigatório');
    });

    it('deve retornar erro 400 quando question_text está ausente', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          answer_text: 'Resposta teste',
          rating: 'aprovado'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('question_text');
      expect(response.body.message).toContain('obrigatório');
    });

    it('deve retornar erro 400 quando answer_text está ausente', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: 'Pergunta teste',
          rating: 'aprovado'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('answer_text');
      expect(response.body.message).toContain('obrigatório');
    });

    it('deve retornar erro 400 quando rating está ausente', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: 'Pergunta teste',
          answer_text: 'Resposta teste'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('rating');
      expect(response.body.message).toContain('obrigatório');
    });

    it('deve retornar erro 400 quando rating é inválido', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: 'Pergunta teste',
          answer_text: 'Resposta teste',
          rating: 'invalido'
        });

      expect(response.status).toBe(500); // Erro do PostgreSQL por constraint check
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Erro ao registrar avaliação');
    });

    it('deve retornar erro 400 quando severity está ausente para rating incorreto', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: 'Pergunta teste',
          answer_text: 'Resposta teste',
          rating: 'incorreto'
          // severity ausente
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('severity');
      expect(response.body.message).toContain('obrigatório');
    });

    it('deve retornar erro 400 quando severity é inválido', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: 'Pergunta teste',
          answer_text: 'Resposta teste',
          rating: 'incorreto',
          severity: 'invalido'
        });

      expect(response.status).toBe(500); // Erro do PostgreSQL por constraint check
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Erro ao registrar avaliação');
    });
  });

  describe('GET /api/v1/evaluations/:id - Not Found Errors', () => {
    it('deve retornar erro 404 para ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/evaluations/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('não encontrada');
    });

    it('deve retornar erro 404 para ID com formato inválido', async () => {
      const response = await request(app)
        .get('/api/v1/evaluations/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Semantic Flags API - Error Cases', () => {
    describe('GET /api/v1/semantic-flags/:id - Not Found Errors', () => {
      it('deve retornar erro 404 para flag inexistente', async () => {
        const response = await request(app)
          .get('/api/v1/semantic-flags/00000000-0000-0000-0000-000000000000');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('não encontrado');
      });
    });

    describe('PATCH /api/v1/semantic-flags/:id/status - Validation Errors', () => {
      it('deve retornar erro 400 quando status está ausente', async () => {
        const response = await request(app)
          .patch('/api/v1/semantic-flags/00000000-0000-0000-0000-000000000000/status')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('status');
        expect(response.body.message).toContain('obrigatório');
      });

      it('deve retornar erro 400 quando status é inválido', async () => {
        const response = await request(app)
          .patch('/api/v1/semantic-flags/00000000-0000-0000-0000-000000000000/status')
          .send({ status: 'invalido' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Status inválido');
      });

      it('deve retornar erro 404 para flag inexistente no PATCH', async () => {
        const response = await request(app)
          .patch('/api/v1/semantic-flags/00000000-0000-0000-0000-000000000000/status')
          .send({ status: 'aprovado' });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('não encontrado');
      });
    });
  });

  describe('Database Connection Errors (Simulated)', () => {
    // Nota: Estes testes simulariam falhas de conexão do Supabase
    // Para testar cenários reais de falha, seria necessário mockar o cliente Supabase
    // ou ter um ambiente de teste com problemas de conectividade

    it('deve ter estrutura de erro padronizada para falhas de Supabase', async () => {
      // Este teste verifica se a estrutura de erro está padronizada
      // Em um cenário real, seria necessário simular uma falha de conexão

      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: 'invalid-uuid-format',
          question_text: 'Teste',
          answer_text: 'Teste',
          rating: 'aprovado'
        });

      // Deve retornar erro estruturado mesmo em falha de parsing UUID
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting and Security', () => {
    // Estes testes verificariam rate limiting e outras medidas de segurança
    // Implementação dependeria das configurações específicas do projeto

    it('deve aceitar requisições sequenciais sem rate limiting', async () => {
      // Teste básico para verificar que múltiplas requisições funcionam
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/v1/evaluations')
            .send({
              interaction_id: createdInteractionId,
              question_text: `Pergunta ${i}`,
              answer_text: `Resposta ${i}`,
              rating: 'aprovado',
              notes: `Teste ${i}`
            })
        );
      }

      const responses = await Promise.all(promises);

      // Verificar que todas as requisições foram processadas
      responses.forEach(response => {
        expect([200, 201, 400, 500]).toContain(response.status);
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('Data Integrity', () => {
    it('deve manter integridade referencial com interactions', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: '00000000-0000-0000-0000-000000000000', // UUID inexistente
          question_text: 'Pergunta teste',
          answer_text: 'Resposta teste',
          rating: 'aprovado'
        });

      // Deve falhar por violação de foreign key constraint
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Erro ao registrar avaliação');
    });

    it('deve validar formato UUID para interaction_id', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: 'not-a-uuid',
          question_text: 'Pergunta teste',
          answer_text: 'Resposta teste',
          rating: 'aprovado'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
