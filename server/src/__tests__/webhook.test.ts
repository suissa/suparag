import request from 'supertest';
import app from '../index';

describe('Webhook API', () => {
  describe('GET /api/v1/webhook', () => {
    it('should return webhook status', async () => {
      const response = await request(app).get('/api/v1/webhook');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('info');
    });
  });

  describe('POST /api/v1/webhook', () => {
    it('should process messages.upsert event', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'msg-123'
          },
          pushName: 'João Silva',
          message: {
            conversation: 'Olá, preciso de ajuda'
          },
          messageType: 'conversation',
          messageTimestamp: Date.now()
        }
      };

      const response = await request(app)
        .post('/api/v1/webhook')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('phoneNumber', '5511999999999');
      expect(response.body.data).toHaveProperty('pushName', 'João Silva');
      expect(response.body.data).toHaveProperty('messageText', 'Olá, preciso de ajuda');
    });

    it('should process extendedTextMessage', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511888888888@s.whatsapp.net',
            fromMe: false,
            id: 'msg-456'
          },
          pushName: 'Maria Santos',
          message: {
            extendedTextMessage: {
              text: 'Mensagem com texto estendido'
            }
          },
          messageType: 'extendedTextMessage',
          messageTimestamp: Date.now()
        }
      };

      const response = await request(app)
        .post('/api/v1/webhook')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('messageText', 'Mensagem com texto estendido');
    });

    it('should ignore non-messages.upsert events', async () => {
      const payload = {
        event: 'connection.update',
        instance: 'test-instance',
        data: {}
      };

      const response = await request(app)
        .post('/api/v1/webhook')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Evento ignorado');
    });

    it('should ignore group messages', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999999999-1234567890@g.us',
            fromMe: false,
            id: 'msg-789'
          },
          pushName: 'Grupo Teste',
          message: {
            conversation: 'Mensagem de grupo'
          },
          messageType: 'conversation',
          messageTimestamp: Date.now()
        }
      };

      const response = await request(app)
        .post('/api/v1/webhook')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Mensagens de grupo não são processadas');
    });

    it('should ignore own messages', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: true,
            id: 'msg-own'
          },
          pushName: 'Eu',
          message: {
            conversation: 'Minha mensagem'
          },
          messageType: 'conversation',
          messageTimestamp: Date.now()
        }
      };

      const response = await request(app)
        .post('/api/v1/webhook')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Mensagens próprias não são processadas');
    });

    it('should ignore messages without text', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'msg-no-text'
          },
          pushName: 'João Silva',
          message: {
            imageMessage: {
              url: 'https://example.com/image.jpg'
            }
          },
          messageType: 'imageMessage',
          messageTimestamp: Date.now()
        }
      };

      const response = await request(app)
        .post('/api/v1/webhook')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Mensagem sem texto');
    });

    it('should extract phone number correctly', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5521987654321@s.whatsapp.net',
            fromMe: false,
            id: 'msg-phone'
          },
          pushName: 'Teste',
          message: {
            conversation: 'Teste'
          },
          messageType: 'conversation',
          messageTimestamp: Date.now()
        }
      };

      const response = await request(app)
        .post('/api/v1/webhook')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.data.phoneNumber).toBe('5521987654321');
    });

    it('should handle errors gracefully', async () => {
      const payload = {
        event: 'messages.upsert',
        // Payload inválido/incompleto
        data: null
      };

      const response = await request(app)
        .post('/api/v1/webhook')
        .send(payload);

      // Deve retornar 200 mesmo com erro para não reenviar webhook
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});
