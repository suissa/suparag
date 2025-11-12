/**
 * Serviço de Logging Estruturado
 * 
 * Fornece logging com níveis, timestamps, contexto e formatação consistente
 * para todas as operações críticas do sistema WhatsApp-Evolution.
 * 
 * Níveis de log:
 * - ERROR: Erros críticos que requerem atenção imediata
 * - WARN: Situações anormais que não impedem operação
 * - INFO: Eventos importantes do sistema
 * - DEBUG: Informações detalhadas para debugging
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface LogContext {
  service?: string;
  operation?: string;
  sessionId?: string;
  instanceName?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Classe Logger para logging estruturado e consistente
 */
export class Logger {
  private serviceName: string;
  private minLevel: LogLevel;

  constructor(serviceName: string, minLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName;
    this.minLevel = minLevel;
  }

  /**
   * Formata uma entrada de log em JSON estruturado
   */
  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        service: this.serviceName,
        ...context
      }
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      };
    }

    return entry;
  }

  /**
   * Verifica se o nível de log deve ser registrado
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.minLevel);
    return currentIndex <= minIndex;
  }

  /**
   * Formata a saída do log para console com cores e emojis
   */
  private formatConsoleOutput(entry: LogEntry): string {
    const emoji = {
      [LogLevel.ERROR]: '❌',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.DEBUG]: '🔍'
    }[entry.level];

    let output = `${emoji} [${entry.timestamp}] [${entry.level}] [${entry.context?.service}]`;
    
    if (entry.context?.operation) {
      output += ` [${entry.context.operation}]`;
    }
    
    output += ` ${entry.message}`;

    // Adicionar contexto adicional
    const contextKeys = Object.keys(entry.context || {}).filter(
      k => !['service', 'operation'].includes(k)
    );
    
    if (contextKeys.length > 0) {
      const contextStr = contextKeys
        .map(k => `${k}=${entry.context![k]}`)
        .join(', ');
      output += `\n   Context: ${contextStr}`;
    }

    // Adicionar erro se existir
    if (entry.error) {
      output += `\n   Error: ${entry.error.message}`;
      if (entry.error.code) {
        output += ` (code: ${entry.error.code})`;
      }
      if (entry.error.stack) {
        output += `\n   Stack: ${entry.error.stack}`;
      }
    }

    return output;
  }

  /**
   * Registra log de nível ERROR
   */
  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry = this.formatLogEntry(LogLevel.ERROR, message, context, error);
    console.error(this.formatConsoleOutput(entry));
    
    // Aqui poderia enviar para serviço externo (Sentry, CloudWatch, etc)
  }

  /**
   * Registra log de nível WARN
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.formatLogEntry(LogLevel.WARN, message, context);
    console.warn(this.formatConsoleOutput(entry));
  }

  /**
   * Registra log de nível INFO
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.formatLogEntry(LogLevel.INFO, message, context);
    console.log(this.formatConsoleOutput(entry));
  }

  /**
   * Registra log de nível DEBUG
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
    console.log(this.formatConsoleOutput(entry));
  }

  /**
   * Cria um logger filho com contexto adicional
   */
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger(this.serviceName, this.minLevel);
    
    // Sobrescrever métodos para incluir contexto adicional
    const originalError = childLogger.error.bind(childLogger);
    const originalWarn = childLogger.warn.bind(childLogger);
    const originalInfo = childLogger.info.bind(childLogger);
    const originalDebug = childLogger.debug.bind(childLogger);

    childLogger.error = (msg, ctx?, err?) => originalError(msg, { ...additionalContext, ...ctx }, err);
    childLogger.warn = (msg, ctx?) => originalWarn(msg, { ...additionalContext, ...ctx });
    childLogger.info = (msg, ctx?) => originalInfo(msg, { ...additionalContext, ...ctx });
    childLogger.debug = (msg, ctx?) => originalDebug(msg, { ...additionalContext, ...ctx });

    return childLogger;
  }
}

/**
 * Factory para criar loggers com nome de serviço
 */
export function createLogger(serviceName: string, minLevel?: LogLevel): Logger {
  return new Logger(serviceName, minLevel);
}

/**
 * Logger global padrão
 */
export const logger = createLogger('WhatsAppIntegration');
