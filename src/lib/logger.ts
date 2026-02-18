export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: {
    userId?: string;
    schemaId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    ip?: string;
    userAgent?: string;
    duration?: number;
    [key: string]: any;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatTime(): string {
    return new Date().toISOString();
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      // In production, only log WARN and ERROR to reduce noise
      return level === LogLevel.WARN || level === LogLevel.ERROR;
    }
    return true;
  }

  private log(level: LogLevel, message: string, context?: any, error?: Error) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.formatTime(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        ...(this.isProduction ? {} : { stack: error.stack }),
      };
    }

    // Structure logs for better parsing in production
    const logMessage = JSON.stringify(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  debug(message: string, context?: any) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: any) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: any) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: any) {
    this.log(LogLevel.ERROR, message, context, error);
  }
}

export const logger = new Logger();

export function logRequest(
  method: string,
  endpoint: string,
  userId?: string,
  statusCode?: number,
  duration?: number,
  extra?: any
) {
  logger.info('API Request', {
    method,
    endpoint,
    userId,
    statusCode,
    duration,
    ...extra,
  });
}

export function logError(
  error: Error,
  method: string,
  endpoint: string,
  userId?: string,
  statusCode?: number,
  extra?: any
) {
  logger.error(`API Error: ${method} ${endpoint}`, error, {
    method,
    endpoint,
    userId,
    statusCode,
    ...extra,
  });
}
