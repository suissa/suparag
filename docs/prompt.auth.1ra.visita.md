# O prompt abaixo deve ser feito na pasta apps/web que é onde mora nosso frontend que é um sistema em Vite com Tailwind

crie uma landingpage sobre o meu serviço chamado GraphRAG Solutions, precisa conter uma seção: Hero, Problems, Concepts,
Solutions, Tecnologies, Plans (muito imporante tere quando clicado levar a uma pagina de escolha de pagamento 
Pix ou Cartao de crédito, sendo um checkout transparent, logo os dados do plano escolhido deve vir corretamente nessa página)

Em qualquer escolha simularemos que foi pago aí deve pedir o WhatsApp da pessoa pois ela irá receber o link de autenticação
nele, e indique que ela abra o link pelo celular para que use sua digital como senha.

# O backend na pasta apps/server que é uma API em Fastify com simplewebauthn, oauth e Mongoose para armazenar os dados do cliente

- rotas para usar o magiclink: apps\server\src\routes\magiclink.ts
- rotas para usar o oauth: apps\server\src\routes\oauth.ts
- rotas para usar o webauthn: apps\server\src\routes\webauthn.ts

o Oauth irá se basear no padrão OAuth 2.1, usando o fluxo de autorização implícita.
Para que nosso usuário possa utilizar todo nosso ecossistema de serviços modulares e servidores MCP.

Após ela entrar no link unico, essa página deverá pedir para que ela cadastre sua passkey.
Com o backend confirmando seu cadastro já leve o usuário para nosso dashboard, nessa primeira tela na primeira visita deverá mostrar
um balão de mensagem com o efeito de aparecer 1 letra após a outra simulando
estra escrendo naquele momento, coloque um ícone de microfone em tamanho médio e 
sendp colorido por um gradiente animado.

Nosso sistema de CRM com seu dashboard, qué é onde o usuário irá entrar está em apps/cogcrm
que é uma API Express de um Temporal Graph RAG conectado ao WhatsApp via nosso Chatbot.

essa mensagem irá sugerir que o usuário conect seu whatsapp naquele momento para que o sistema demonstre algumas métricas que o sistema entrega,
explicando que irá analisar o que conseguir, mas no período de teste o limite são 100 clientes em 1 mês. assinando um plano no mesmo momento terá 
acesso a todas as funcionalidades do sistema. Ou seja, quando ela assinar seus dados não começarão do 0. E como um brinde de boas vindas o sistema vai entregar
1 insigth valioso para ela poider acompanha factualidade do mesmo.

O arquivo para executar a importação está em apps/cogcrm/server/src/scripts/importWhatsAppHistory.ts

contacts é um array assim:


  {
    "id": "cmhx2pn79000avelwocn4w41i",
    "remoteJid": "5511997170900@s.whatsapp.net",
    "pushName": "Lucas Aluno Mk Sampa",
    "profilePicUrl": null,
    "createdAt": "2025-11-13T06:54:09.333Z",
    "updatedAt": "2025-11-13T06:54:09.641Z",
    "instanceId": "0873b4fa-f625-4989-ba65-be7b02574f2c",
    "isGroup": false,
    "isSaved": true,
    "type": "contact"
  },
  {
    "id": "cmhx2pn79000bvelwntvfbgkx",
    "remoteJid": "5515997346838@s.whatsapp.net",
    "pushName": "Lucy Mara Mãe",
    "profilePicUrl": "https://pps.whatsapp.net/v/t61.24694-24/534420503_1156133343065389_891243711934605045_n.jpg?ccb=11-4&oh=01_Q5Aa3AHKTrMyabnoCtKutIXwX-Sgpv0TFGnW-Wwkr0QocS8CDQ&oe=6922873D&_nc_sid=5e03e0&_nc_cat=100",
    "createdAt": "2025-11-13T06:54:09.333Z",
    "updatedAt": "2025-11-13T06:54:09.641Z",
    "instanceId": "0873b4fa-f625-4989-ba65-be7b02574f2c",
    "isGroup": false,
    "isSaved": true,
    "type": "contact"
  },

  então você deverá:

  1. pegar todos que conseguir usando `getContatsFromWhatsApp`
  2. essa função já ira chamar `getMessagesFromContact`
  3. que ao final do seu loop irá chamar `importWhatsAppHistory('./', mappingFn);`
  4. crie a função mappingFn de mapeamento do JSON para o supabase
  5. verifique no supabase se os dados foram importados corretamente
  6. depois execute a analise do Lead



  
```sql
-- Tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de interações
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  channel TEXT NOT NULL,
  content TEXT NOT NULL,
  sentiment NUMERIC,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

```

Os arquivos devem seguir o formato `{phone}.json`:

```json
{
  "phone": "5511999999999",
  "messages": [
    {
      "from": "cliente",
      "text": "Olá, quero saber mais sobre o produto",
      "timestamp": "2025-11-12T12:03:22Z"
    },
    {
      "from": "atendente",
      "text": "Olá! Como posso ajudar?",
      "timestamp": "2025-11-12T12:05:00Z"
    }
  ]
}
```


#### 2. Gerar Análises

```bash
# Gerar relatórios
npm run import -- analyze

# Especificar diretório de saída
npm run import -- analyze --output ./my-reports
```

#### 3. Pipeline Completo

```bash
# Importação + Análises
npm run import -- full --path ./data/whatsapp_histories

# Com todas as opções
npm run import -- full \
  --path ./data/whatsapp_histories \
  --mapping ./scripts/mapFields.js \
  --output ./reports
```

### Função de Mapeamento Customizada

Crie um arquivo JS com a função de mapeamento:

```javascript
// mapFields.js
module.exports = function mapFields(fields) {
  return {
    phone: fields.phone || fields.phoneNumber,
    message: fields.text || fields.message,
    timestamp: fields.timestamp || fields.date,
    from: fields.from || fields.sender
  };
};
```

## 📊 Análises Disponíveis

### Status do Lead

- **novo**: Menos de 3 mensagens
- **ativo**: Mensagens regulares, última interação < 7 dias
- **quente**: Alto engajamento, sentimento positivo, última interação < 3 dias
- **em_negociacao**: Palavras-chave de conversão, sentimento positivo
- **convertido**: Lead fechado
- **frio**: Sem interação há mais de 30 dias

### Probabilidade de Conversão

Calculada com base em:
- Palavras-chave de conversão (30 pontos)
- Sentimento positivo (25 pontos)
- Frequência de interações (20 pontos)
- Recência (15 pontos)
- Perguntas sobre funcionalidades (10 pontos)

### Pontos de Abandono

Detecta gaps de tempo > 7 dias entre mensagens e analisa:
- Sentimento antes do abandono
- Última mensagem enviada
- Motivo provável do abandono

## 🔍 Consultas SQL

### Métricas de um Lead

```sql
SELECT * FROM get_lead_metrics('uuid-do-cliente');
```

### Leads Quentes (>70% conversão)

```sql
SELECT * FROM get_hot_leads(70);
```

### Leads Frios (>30 dias inativos)

```sql
SELECT * FROM get_cold_leads(30);
```

### Ranking de Conversão

```sql
SELECT * FROM get_conversion_probabilities()
ORDER BY conversion_probability DESC
LIMIT 10;
```

### Gaps de Conversação

```sql
SELECT * FROM get_conversation_gaps('uuid-do-cliente');
```

### Tendência de Sentimento

```sql
SELECT * FROM get_sentiment_trend('uuid-do-cliente');
```

### Palavras-chave de Conversão

```sql
SELECT * FROM detect_conversion_keywords('uuid-do-cliente');
```

Se tiver alguma dúvida pode mandar!