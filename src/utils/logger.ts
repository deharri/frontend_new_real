const LOG_ENABLED = __DEV__;

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'API';

const COLORS: Record<LogLevel, string> = {
  INFO: '\x1b[36m',   // cyan
  WARN: '\x1b[33m',   // yellow
  ERROR: '\x1b[31m',  // red
  DEBUG: '\x1b[90m',  // gray
  API: '\x1b[35m',    // magenta
};
const RESET = '\x1b[0m';

function formatLog(level: LogLevel, tag: string, message: string, data?: any) {
  if (!LOG_ENABLED) return;

  const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
  const color = COLORS[level];
  const prefix = `${color}[${timestamp}] [${level}] [${tag}]${RESET}`;

  if (data !== undefined) {
    console.log(`${prefix} ${message}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export const logger = {
  info: (tag: string, message: string, data?: any) => formatLog('INFO', tag, message, data),
  warn: (tag: string, message: string, data?: any) => formatLog('WARN', tag, message, data),
  error: (tag: string, message: string, data?: any) => formatLog('ERROR', tag, message, data),
  debug: (tag: string, message: string, data?: any) => formatLog('DEBUG', tag, message, data),
  api: (tag: string, message: string, data?: any) => formatLog('API', tag, message, data),
};
