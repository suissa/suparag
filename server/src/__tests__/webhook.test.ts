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
    it('should process conversation message', async () => {
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
      expect(response.body.data).toHaveProperty('messageType', 'conversation');
      expect(response.body.data).toHaveProperty('processResult');
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
      expect(response.body.data).toHaveProperty('messageType', 'extendedTextMessage');
      expect(response.body.data).toHaveProperty('processResult');
    });

    it('should process image message', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511777777777@s.whatsapp.net',
            fromMe: false,
            id: 'msg-img'
          },
          pushName: 'Pedro Costa',
          message: {
            imageMessage: {
              url: 'https://example.com/image.jpg',
              caption: 'Veja esta imagem'
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
      expect(response.body.data).toHaveProperty('messageType', 'imageMessage');
      expect(response.body.data).toHaveProperty('processResult');
      expect(response.body.data.processResult).toContain('Imagem recebida');
    });

    it('should process audio message', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511666666666@s.whatsapp.net',
            fromMe: false,
            id: 'msg-audio'
          },
          pushName: 'Ana Lima',
          message: {
            audioMessage: {
              url: 'https://example.com/audio.ogg',
              seconds: 15
            }
          },
          messageType: 'audioMessage',
          messageTimestamp: Date.now()
        }
      };

      const response = await request(app)
        .post('/api/v1/webhook')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('messageType', 'audioMessage');
      expect(response.body.data).toHaveProperty('processResult');
      expect(response.body.data.processResult).toContain('Áudio recebido');
    });

    it('should reject unsupported message types', async () => {
      const payload = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511555555555@s.whatsapp.net',
            fromMe: false,
            id: 'msg-video'
          },
          pushName: 'Carlos Silva',
          message: {
            videoMessage: {
              url: 'https://example.com/video.mp4'
            }
          },
          messageType: 'videoMessage',
          messageTimestamp: Date.now()
        }
      };

      const response = await request(app)
        .post('/api/v1/webhook')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('não suportado');
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
