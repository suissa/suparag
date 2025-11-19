Quero você utilize a instancia já conecta na EvolutionAPI, já temos essas rotas: server/src/routes/whatsapp.ts. Mas a lógica qie desejo é usar a mensagem que chegar em server/src/routes/whatsapp.ts, pesquisar hibrida e semanticamente no supabase, utilizando a função processConversation para executar essa busca e enviando sua resposta para evolutionService.sendTextMessage, essa função devrá criar utilizando a lib sdk-evolution-chatbot assim como o resto do código existente em evolutionService.ts com a função

```ts
await this.client.messages.sendText({
  number: phoneNumber,
  text: responseRAG,
});
```

Então, você irá desenvolver esse Chatbot de WhatsApp recebendo no webhook, processando a mensagem e enviando para o phineNumber que chega na função processConversation. crie uma função whatsappTextMesageFormater para retirar qualquer caracter não suportado e formate o texto corretamente com o formato aceito pelo aceito pelo WhatsApp.

Crie um script que envie um payload com a pergunta e com o phoneNumber=xxx
Eu confirmarei no chat se recebi ou não a resposta