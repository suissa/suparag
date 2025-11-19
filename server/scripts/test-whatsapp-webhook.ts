/**
 * Script para testar o webhook do WhatsApp
 * 
 * Uso:
 *   npm --prefix server run test:webhook -- "Sua pergunta aqui" "5511999999999"
 *   
 * Ou edite as variáveis abaixo e execute:
 *   npx ts-node server/scripts/test-whatsapp-webhook.ts
 */

// Configuração
const WEBHOOK_URL = 'http://localhost:4000/api/v1/webhook';
const DEFAULT_PHONE = '5515997676610'; // Substitua pelo seu número
const DEFAULT_MESSAGE = 'Olá! Como você pode me ajudar?';

// Pegar argumentos da linha de comando
const message = process.argv[2] || DEFAULT_MESSAGE;
const phoneNumber = process.argv[3] || DEFAULT_PHONE;

// Payload simulando webhook da Evolution API
const webhookPayload = {
  event: 'messages.upsert',
  instance: 'test_instance',
  data: {
    key: {
      remoteJid: `${phoneNumber}@s.whatsapp.net`,
      fromMe: false,
      id: `TEST_${Date.now()}`
    },
    pushName: 'Teste Usuario',
    message: {
      conversation: message
    },
    messageType: 'conversation',
    messageTimestamp: Math.floor(Date.now() / 1000)
  }
};

async function testWebhook() {
  console.log('🚀 Testando webhook do WhatsApp\n');
  console.log('📱 Telefone:', phoneNumber);
  console.log('💬 Mensagem:', message);
  console.log('🌐 URL:', WEBHOOK_URL);
  console.log('\n📤 Enviando payload...\n');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    const data = await response.json();

    console.log('📥 Resposta recebida:\n');
    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Webhook processado com sucesso!');
      console.log('\n📝 Resultado do processamento:');
      console.log(data.data?.processResult || 'N/A');
      console.log('\n⏳ Aguarde alguns segundos para receber a resposta no WhatsApp...');
    } else {
      console.log('\n❌ Erro ao processar webhook');
      console.log('Erro:', data.error);
      console.log('Mensagem:', data.message);
    }
  } catch (error: any) {
    console.error('\n❌ Erro ao enviar requisição:', error.message);
    console.error('\nVerifique se o servidor está rodando em', WEBHOOK_URL);
  }
}

// Executar teste
testWebhook();
