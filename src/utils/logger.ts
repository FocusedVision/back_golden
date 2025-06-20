type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env["NODE_ENV"] === "development";
    this.logLevel = this.isDevelopment ? "debug" : "info";
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private getLogLevelNumber(level: LogLevel): number {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level];
  }

  private shouldLog(level: LogLevel): boolean {
    return (
      this.getLogLevelNumber(level) >= this.getLogLevelNumber(this.logLevel)
    );
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const levelStr = level.toUpperCase().padEnd(5);

    let formattedMessage = `${levelStr} ${message}`;

    if (data !== undefined) {
      if (typeof data === "object") {
        formattedMessage += "\n" + JSON.stringify(data, null, 2);
      } else {
        formattedMessage += ` ${data}`;
      }
    }

    return formattedMessage;
  }

  private log(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) return;

    const timestamp = this.formatTimestamp();
    const formattedMessage = this.formatMessage(level, message, data);

    // Enhanced color codes
    const colors = {
      debug: "\x1b[36m", // Cyan
      info: "\x1b[32m", // Green
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
    };

    const styles = {
      reset: "\x1b[0m",
      bright: "\x1b[1m",
      dim: "\x1b[2m",
      underscore: "\x1b[4m",
    };

    // Add timestamp and color to message
    const coloredMessage = `${styles.dim}${styles.reset} ${colors[level]}${styles.bright}${formattedMessage}${styles.reset}`;

    // Use appropriate console method based on level
    switch (level) {
      case "error":
        console.error(coloredMessage);
        break;
      case "warn":
        console.warn(coloredMessage);
        break;
      case "debug":
        console.debug(coloredMessage);
        break;
      default:
        console.log(coloredMessage);
    }

    // Print error stack with color if available
    if (error?.stack) {
      const coloredStack = `${colors.error}${styles.dim}${error.stack}${styles.reset}`;
      console.error(coloredStack);
    }
  }

  debug(message: string, data?: any): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  error(message: string, error?: Error | any, data?: any): void {
    if (error instanceof Error) {
      this.log("error", message, data, error);
    } else {
      this.log("error", message, error);
    }
  }

  server(message: string, data?: any): void {
    this.info(`SERVER: ${message}`, data);
  }

  database(message: string, data?: any): void {
    this.info(`DATABASE: ${message}`, data);
  }

  auth(message: string, data?: any): void {
    this.info(`AUTH: ${message}`, data);
  }

  validation(message: string, data?: any): void {
    this.warn(`VALIDATION: ${message}`, data);
  }

  security(message: string, data?: any): void {
    this.warn(`SECURITY: ${message}`, data);
  }

  request(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
  ): void {
    const status = statusCode ? ` ${statusCode}` : "";
    const time = duration ? ` (${duration}ms)` : "";
    this.info(`📡 ${method} ${url}${status}${time}`);
  }

  performance(operation: string, duration: number, data?: any): void {
    this.debug(`⚡ PERFORMANCE: ${operation} took ${duration}ms`, data);
  }

  errorWithContext(message: string, error: Error, context?: any): void {
    this.error(message, error, context);
  }

  success(message: string, data?: any): void {
    this.info(`${message}`, data);
  }

  startup(message: string, data?: any): void {
    this.info(`STARTUP: ${message}`, data);
  }

  shutdown(message: string, data?: any): void {
    this.info(`SHUTDOWN: ${message}`, data);
  }
}

const logger = new Logger();

export default logger;
