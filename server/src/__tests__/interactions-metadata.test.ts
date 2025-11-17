import request from 'supertest';
import app from '../index';

describe('POST /api/v1/interactions - Metadata Generation', () => {
  let createdInteractionId: string;

  it('should create interaction with automatic metadata', async () => {
    // Primeiro, criar um cliente de teste
    const customerResponse = await request(app)
      .post('/api/v1/customers')
      .send({
        name: 'Test Customer Metadata',
        email: `test-metadata-${Date.now()}@example.com`,
        phone: '5511999999999'
      });

    expect(customerResponse.status).toBe(201);
    const customerId = customerResponse.body.data.customer.id;

    // Criar interação com metadata automática
    const response = await request(app)
      .post('/api/v1/interactions')
      .set('User-Agent', 'Mozilla/5.0 (Test Agent)')
      .send({
        customer_id: customerId,
        channel: 'whatsapp',
        message: 'Teste de metadata automática',
        sentiment: 0.5
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.interaction).toBeDefined();
    expect(response.body.data.metadata).toBeDefined();
    expect(response.body.data.metadata.message).toContain('Metadata gerada automaticamente');

    const interaction = response.body.data.interaction;
    createdInteractionId = interaction.id;

    // Verificar que a interação foi criada
    expect(interaction.customer_id).toBe(customerId);
    expect(interaction.channel).toBe('whatsapp');
    expect(interaction.message).toBe('Teste de metadata automática');
    expect(interaction.sentiment).toBe(0.5);
    expect(interaction.metadata).toBeDefined();

    // Verificar campos da metadata
    const metadata = interaction.metadata;
    expect(metadata.source).toBe('api');
    expect(metadata.channel).toBe('whatsapp');
    expect(metadata.ip).toBeDefined();
    expect(metadata.userAgent).toBe('Mozilla/5.0 (Test Agent)');
    expect(metadata.timestamp).toBeDefined();
    expect(metadata.method).toBe('POST');
    expect(metadata.endpoint).toContain('/api/v1/interactions');

    console.log('✅ Interaction created with metadata:', {
      id: interaction.id,
      metadata: metadata
    });
  });

  it('should retrieve interaction with metadata', async () => {
    if (!createdInteractionId) {
      console.log('⚠️ Skipping test - no interaction created');
      return;
    }

    const response = await request(app)
      .get(`/api/v1/interactions/${createdInteractionId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.interaction).toBeDefined();

    const interaction = response.body.data.interaction;
    expect(interaction.metadata).toBeDefined();
    expect(interaction.metadata.source).toBe('api');
    expect(interaction.metadata.channel).toBe('whatsapp');

    console.log('✅ Retrieved interaction with metadata:', {
      id: interaction.id,
      metadata: interaction.metadata
    });
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/v1/interactions')
      .send({
        channel: 'whatsapp'
        // Missing customer_id and message
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('obrigatórios');
  });

  it('should use default channel if not provided', async () => {
    // Criar cliente de teste
    const customerResponse = await request(app)
      .post('/api/v1/customers')
      .send({
        name: 'Test Customer Default Channel',
        email: `test-default-${Date.now()}@example.com`,
        phone: '5511888888888'
      });

    const customerId = customerResponse.body.data.customer.id;

    // Criar interação sem especificar channel
    const response = await request(app)
      .post('/api/v1/interactions')
      .send({
        customer_id: customerId,
        message: 'Teste sem channel especificado'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.interaction.channel).toBe('whatsapp');
    expect(response.body.data.interaction.metadata.channel).toBe('whatsapp');

    console.log('✅ Default channel applied:', response.body.data.interaction.channel);
  });
});
