import request from 'supertest';
import app from '../index';

describe('Evaluations API - Success Cases', () => {
  let createdCustomerId: string;
  let createdInteractionId: string;
  let createdEvaluationId: string;
  let createdFlagId: string;

  // Setup: criar dados de teste
  beforeAll(async () => {
    // Criar customer
    const customerResponse = await request(app)
      .post('/api/v1/customers')
      .send({
        name: 'Test Customer for Evaluations',
        email: 'eval-test@example.com',
        phone: '+5511999998888'
      });

    createdCustomerId = customerResponse.body.data.customer.id;

    // Criar interaction
    const interactionResponse = await request(app)
      .post('/api/v1/interactions')
      .send({
        customer_id: createdCustomerId,
        channel: 'test',
        message: 'Qual é a diferença entre TypeScript e JavaScript?',
        sentiment: 0.5
      });

    createdInteractionId = interactionResponse.body.data.interaction.id;
  });

  describe('POST /api/v1/evaluations', () => {
    it('deve registrar avaliação aprovada com sucesso', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: 'Qual é a diferença entre TypeScript e JavaScript?',
          answer_text: 'TypeScript é um superset do JavaScript que adiciona tipagem estática opcional.',
          used_sources: {
            document_id: 'doc-1',
            chunk_ids: ['chunk-1'],
            context: 'TypeScript adiciona tipos estáticos ao JavaScript.'
          },
          rating: 'aprovado',
          notes: 'Resposta precisa e completa'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.evaluation_id).toBeDefined();
      expect(response.body.data.flag_created).toBe(false);

      createdEvaluationId = response.body.data.evaluation_id;
    });

    it('deve registrar avaliação incorreta baixa sem criar flag', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: 'Como funciona a busca semântica?',
          answer_text: 'A busca semântica usa palavras-chave para encontrar conteúdo.',
          used_sources: {
            document_id: 'doc-2',
            chunk_ids: ['chunk-2'],
            context: 'Busca semântica utiliza significado, não apenas palavras.'
          },
          rating: 'incorreto',
          severity: 'baixa',
          notes: 'Resposta simplista demais'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.flag_created).toBe(false);
    });

    it('deve criar flag imediatamente para avaliação muito crítica', async () => {
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: 'Qual é a diferença entre REST e GraphQL?',
          answer_text: 'REST é melhor que GraphQL em todos os aspectos.',
          used_sources: {
            document_id: 'doc-3',
            chunk_ids: ['chunk-3'],
            context: 'Ambas as tecnologias têm casos de uso específicos.'
          },
          rating: 'incorreto',
          severity: 'muito',
          notes: 'Resposta completamente errada e prejudicial'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.flag_created).toBe(true);
    });

    it('deve criar flag na terceira avaliação média', async () => {
      // Primeira avaliação média
      await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: 'O que é JWT?',
          answer_text: 'JWT é um tipo de cookie.',
          used_sources: { document_id: 'doc-4', chunk_ids: ['chunk-4'] },
          rating: 'incorreto',
          severity: 'media',
          notes: 'Definição incorreta'
        });

      // Segunda avaliação média
      await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: 'O que é JWT?',
          answer_text: 'JWT é um tipo de cookie.',
          used_sources: { document_id: 'doc-4', chunk_ids: ['chunk-4'] },
          rating: 'incorreto',
          severity: 'media',
          notes: 'Mesma resposta incorreta'
        });

      // Terceira avaliação média - deve criar flag
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: 'O que é JWT?',
          answer_text: 'JWT é um tipo de cookie.',
          used_sources: { document_id: 'doc-4', chunk_ids: ['chunk-4'] },
          rating: 'incorreto',
          severity: 'media',
          notes: 'Terceira avaliação incorreta'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.flag_created).toBe(true);
    });

    it('deve criar flag na quinta avaliação baixa', async () => {
      const questionText = 'Como otimizar queries SQL?';
      const answerText = 'Use SELECT * sempre.';

      // Criar 4 avaliações baixas primeiro
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/v1/evaluations')
          .send({
            interaction_id: createdInteractionId,
            question_text: questionText,
            answer_text: answerText,
            used_sources: { document_id: 'doc-5', chunk_ids: ['chunk-5'] },
            rating: 'incorreto',
            severity: 'baixa',
            notes: `Avaliação baixa ${i + 1}`
          });
      }

      // Quinta avaliação - deve criar flag
      const response = await request(app)
        .post('/api/v1/evaluations')
        .send({
          interaction_id: createdInteractionId,
          question_text: questionText,
          answer_text: answerText,
          used_sources: { document_id: 'doc-5', chunk_ids: ['chunk-5'] },
          rating: 'incorreto',
          severity: 'baixa',
          notes: 'Quinta avaliação baixa - deve criar flag'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.flag_created).toBe(true);
    });
  });

  describe('GET /api/v1/evaluations', () => {
    it('deve listar todas as avaliações', async () => {
      const response = await request(app)
        .get('/api/v1/evaluations');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.evaluations)).toBe(true);
      expect(response.body.data.evaluations.length).toBeGreaterThan(0);
    });

    it('deve filtrar avaliações por interaction_id', async () => {
      const response = await request(app)
        .get(`/api/v1/evaluations?interaction_id=${createdInteractionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.evaluations)).toBe(true);

      // Verificar se todas as avaliações retornadas têm o interaction_id correto
      response.body.data.evaluations.forEach((evaluation: any) => {
        expect(evaluation.interaction_id).toBe(createdInteractionId);
      });
    });

    it('deve filtrar avaliações por rating', async () => {
      const response = await request(app)
        .get('/api/v1/evaluations?rating=incorreto');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.evaluations)).toBe(true);

      response.body.data.evaluations.forEach((evaluation: any) => {
        expect(evaluation.rating).toBe('incorreto');
      });
    });
  });

  describe('GET /api/v1/evaluations/:id', () => {
    it('deve obter avaliação específica por ID', async () => {
      const response = await request(app)
        .get(`/api/v1/evaluations/${createdEvaluationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.evaluation.id).toBe(createdEvaluationId);
      expect(response.body.data.evaluation.interaction_id).toBe(createdInteractionId);
    });
  });

  describe('GET /api/v1/evaluations/stats/overview', () => {
    it('deve retornar estatísticas gerais das avaliações', async () => {
      const response = await request(app)
        .get('/api/v1/evaluations/stats/overview');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.severity_distribution).toBeDefined();
      expect(response.body.data.quality_counters).toBeDefined();

      // Verificar estrutura dos dados
      expect(typeof response.body.data.overview.total_evaluations).toBe('number');
      expect(typeof response.body.data.overview.approval_rate).toBe('number');
      expect(typeof response.body.data.severity_distribution.baixa).toBe('number');
      expect(typeof response.body.data.severity_distribution.media).toBe('number');
      expect(typeof response.body.data.severity_distribution.muito).toBe('number');
    });
  });

  describe('Semantic Flags API', () => {
    describe('GET /api/v1/semantic-flags', () => {
      it('deve listar flags semânticos pendentes', async () => {
        const response = await request(app)
          .get('/api/v1/semantic-flags?status=pendente');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.flags)).toBe(true);
        expect(response.body.data.flags.length).toBeGreaterThan(0);

        // Salvar ID do primeiro flag para testes posteriores
        if (response.body.data.flags.length > 0) {
          createdFlagId = response.body.data.flags[0].id;
        }
      });
    });

    describe('GET /api/v1/semantic-flags/:id', () => {
      it('deve obter flag específico por ID', async () => {
        const response = await request(app)
          .get(`/api/v1/semantic-flags/${createdFlagId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.flag.id).toBe(createdFlagId);
        expect(response.body.data.flag.status).toBe('pendente');
      });
    });

    describe('PATCH /api/v1/semantic-flags/:id/status', () => {
      it('deve aprovar um flag semântico', async () => {
        const response = await request(app)
          .patch(`/api/v1/semantic-flags/${createdFlagId}/status`)
          .send({ status: 'aprovado' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.flag.status).toBe('aprovado');
        expect(response.body.data.flag.resolved_at).toBeDefined();
      });

      it('deve rejeitar um flag semântico', async () => {
        // Criar outro flag primeiro
        const evalResponse = await request(app)
          .post('/api/v1/evaluations')
          .send({
            interaction_id: createdInteractionId,
            question_text: 'Teste para rejeição',
            answer_text: 'Resposta de teste',
            used_sources: { document_id: 'doc-test' },
            rating: 'incorreto',
            severity: 'muito',
            notes: 'Flag para teste de rejeição'
          });

        const newFlagId = evalResponse.body.data.evaluation_id;

        const response = await request(app)
          .patch(`/api/v1/semantic-flags/${newFlagId}/status`)
          .send({ status: 'eliminado' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.flag.status).toBe('eliminado');
        expect(response.body.data.flag.resolved_at).toBeDefined();
      });
    });

    describe('GET /api/v1/semantic-flags/stats/overview', () => {
      it('deve retornar estatísticas dos flags', async () => {
        const response = await request(app)
          .get('/api/v1/semantic-flags/stats/overview');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.overview).toBeDefined();
        expect(response.body.data.status_distribution).toBeDefined();
        expect(response.body.data.reason_distribution).toBeDefined();
      });
    });
  });
});
