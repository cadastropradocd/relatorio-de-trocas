type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isProd = import.meta.env.PROD;

const COLORS: Record<LogLevel, string> = {
  info: '#3b82f6',
  warn: '#fbbf24',
  error: '#ef4444',
  debug: '#94a3b8',
};

const log = (level: LogLevel, context: string, message: string, data?: unknown): void => {
  if (isProd && level === 'debug') return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;

  switch (level) {
    case 'error':
      console.error(`%c${prefix} ${message}`, `color: ${COLORS.error}; font-weight: bold`, data ?? '');
      break;
    case 'warn':
      console.warn(`%c${prefix} ${message}`, `color: ${COLORS.warn}; font-weight: bold`, data ?? '');
      break;
    case 'debug':
      console.debug(`%c${prefix} ${message}`, `color: ${COLORS.debug}`, data ?? '');
      break;
    default:
      console.log(`%c${prefix} ${message}`, `color: ${COLORS.info}; font-weight: bold`, data ?? '');
  }
};

export const logger = {
  info: (context: string, message: string, data?: unknown) => log('info', context, message, data),
  warn: (context: string, message: string, data?: unknown) => log('warn', context, message, data),
  error: (context: string, message: string, data?: unknown) => log('error', context, message, data),
  debug: (context: string, message: string, data?: unknown) => log('debug', context, message, data),
};
