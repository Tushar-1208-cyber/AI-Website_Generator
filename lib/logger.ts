/**
 * DevOps Observability & Structured Logger Utility
 * Standardized logging format for serverless functions, container logs, and monitoring telemetry.
 */

export type LogLevel = "INFO" | "WARN" | "ERROR" | "METRIC";

export interface LogPayload {
  level: LogLevel;
  message: string;
  context?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export function logEvent(level: LogLevel, message: string, context?: string, details?: Record<string, unknown>) {
  const logData: LogPayload = {
    timestamp: new Date().toISOString(),
    level,
    context: context || "application",
    message,
    ...(details && { details }),
  };

  const formattedLog = JSON.stringify(logData);

  switch (level) {
    case "ERROR":
      console.error(`[DEVOPS ERROR] ${formattedLog}`);
      break;
    case "WARN":
      console.warn(`[DEVOPS WARN] ${formattedLog}`);
      break;
    case "METRIC":
      console.info(`[DEVOPS METRIC] ${formattedLog}`);
      break;
    case "INFO":
    default:
      console.log(`[DEVOPS INFO] ${formattedLog}`);
      break;
  }
}

export const logger = {
  info: (msg: string, ctx?: string, meta?: Record<string, unknown>) => logEvent("INFO", msg, ctx, meta),
  warn: (msg: string, ctx?: string, meta?: Record<string, unknown>) => logEvent("WARN", msg, ctx, meta),
  error: (msg: string, ctx?: string, meta?: Record<string, unknown>) => logEvent("ERROR", msg, ctx, meta),
  metric: (msg: string, ctx?: string, meta?: Record<string, unknown>) => logEvent("METRIC", msg, ctx, meta),
};
