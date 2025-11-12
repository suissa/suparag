# Sistema de Logging e Monitoramento

## Visão Geral

O sistema de logging estruturado foi implementado para fornecer visibilidade completa de todas as operações críticas da integração WhatsApp-Evolution, facilitando debugging, monitoramento e auditoria.

## Características

### Níveis de Log

- **ERROR**: Erros críticos que requerem atenção imediata
- **WARN**: Situações anormais que não impedem operação
- **INFO**: Eventos importantes do sistema
- **DEBUG**: Informações detalhadas para debugging

### Informações Incluídas

Cada log contém:
- **Timestamp**: ISO 8601 format
- **Nível**: ERROR, WARN, INFO ou DEBUG
- **Serviço**: Nome do serviço que gerou o log
- **Operação**: Nome da operação sendo executada
- **Contexto**: Dados relevantes (sessionId, instanceName, etc)
- **Duração**: Tempo de execução de operações
- **Stack Trace**: Para erros, inclui stack trace completo

## Uso

### Criar Logger

```typescript
import { createLogger } from './services/logger';

const logger = createLogger('MeuServico');
```

### Registrar Logs

```typescript
// INFO
logger.info('Operação iniciada', {
  operation: 'minhaOperacao',
  userId: '123'
});

// ERROR com stack trace
logger.error('Falha na operação', {
  operation: 'minhaOperacao',
  userId: '123'
}, error);

// WARN
logger.warn('Situação anormal detectada', {
  operation: 'verificacao',
  tentativas: 3
});

// DEBUG
logger.debug('Detalhes da operação', {
  operation: 'processamento',
  dados: { ... }
});
```

## Operações Monitoradas

### EvolutionService
- Criação de instâncias
- Verificação de status
- Obtenção de QR codes
- Deleção de instâncias
- Mudanças de status

### SSEManager
- Estabelecimento de conexões SSE
- Envio de eventos
- Desconexão de clientes
- Broadcast de eventos

### StatusChecker
- Início de verificações periódicas
- Mudanças de status detectadas
- Timeouts
- Parada de verificações

### WhatsApp Router
- Requisições HTTP recebidas
- Criação de instâncias
- Streams SSE
- Verificações de status
- Desconexões

## Formato de Saída

```
ℹ️ [2025-01-15T10:30:45.123Z] [INFO] [EvolutionService] [createInstance] Instância criada com sucesso
   Context: sessionId=abc-123, instanceName=neuropgrag_1234567890_abc, duration=1234ms, totalInstances=5
```

## Próximos Passos

Para produção, considere:
- Integração com serviços externos (Sentry, CloudWatch, Datadog)
- Agregação de logs em sistema centralizado
- Alertas automáticos para erros críticos
- Métricas e dashboards de monitoramento
