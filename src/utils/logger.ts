/**
import logger from 'bragi-browser'

if (process.env.NODE_ENV !== 'development') {
  logger.transports.empty()
}

logger.transports.get('console').property('showMeta', false)
logger.transports.get('console').property('showColors', false)
*/

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  namespace: string;
  enabled?: boolean;
  level?: LogLevel;
}

class Logger {
  private namespace: string;
  private enabled: boolean;
  private level: LogLevel;

  constructor({ namespace, enabled = true, level = "info" }: LoggerOptions) {
    this.namespace = namespace;
    this.enabled = enabled;
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;

    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(
    level: LogLevel,
    message: string,
  ): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${
      this.namespace
    }] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message), ...args);
    }
  }
}

export const createLogger = (options: LoggerOptions): Logger => {
  return new Logger(options);
};

// For testing environments
export const createTestLogger = (namespace: string): Logger => {
  return new Logger({
    namespace,
    enabled: process.env.NODE_ENV === "test",
    level: "debug",
  });
};

export default console;
