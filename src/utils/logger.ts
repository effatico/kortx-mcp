import { pino, type Logger as PinoLogger } from 'pino';
import type { Config } from '../config/index.js';

export type Logger = PinoLogger;

export function createLogger(config: Config): Logger {
  return pino({
    level: config.server.logLevel,
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    formatters: {
      level: (label: string) => {
        return { level: label };
      },
    },
    base: {
      service: config.server.name,
      version: config.server.version,
    },
    redact: {
      paths: ['*.apiKey', '*.token', '*.password', '*.secret', '*.authorization', 'openai.apiKey'],
      censor: '[REDACTED]',
    },
  });
}

// Logging utility functions
export function logToolCall(logger: Logger, toolName: string, params: unknown): void {
  logger.info(
    {
      event: 'tool_call',
      tool: toolName,
      params: sanitizeParams(params),
    },
    `Tool called: ${toolName}`
  );
}

export function logLLMRequest(logger: Logger, model: string, promptLength: number): void {
  logger.debug(
    {
      event: 'llm_request',
      model,
      promptLength,
    },
    `LLM request to ${model}`
  );
}

export function logLLMResponse(
  logger: Logger,
  model: string,
  tokens: { prompt: number; completion: number; reasoning?: number; total: number },
  durationMs: number
): void {
  logger.info(
    {
      event: 'llm_response',
      model,
      tokens,
      durationMs,
    },
    `LLM response from ${model} (${tokens.total} tokens, ${durationMs}ms)`
  );
}

export function logContextGathering(
  logger: Logger,
  sources: string[],
  tokensUsed: number,
  durationMs: number
): void {
  logger.debug(
    {
      event: 'context_gathered',
      sources,
      tokensUsed,
      durationMs,
    },
    `Context gathered from ${sources.length} sources (${tokensUsed} tokens)`
  );
}

export function logError(logger: Logger, error: Error, context?: unknown): void {
  logger.error(
    {
      event: 'error',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context: context ? sanitizeParams(context) : undefined,
    },
    `Error: ${error.message}`
  );
}

// Application lifecycle logging
export function logApplicationStart(logger: Logger, config: unknown): void {
  logger.info(
    {
      event: 'application_start',
      config: sanitizeParams(config),
    },
    'Application starting'
  );
}

export function logApplicationShutdown(logger: Logger, signal?: string): void {
  logger.info(
    {
      event: 'application_shutdown',
      signal,
    },
    `Application shutting down${signal ? ` (${signal})` : ''}`
  );
}

export function logMCPServerStarted(logger: Logger, transport: string): void {
  logger.info(
    {
      event: 'mcp_server_started',
      transport,
    },
    `MCP server started with ${transport} transport`
  );
}

export function logConfigurationLoaded(logger: Logger): void {
  logger.info(
    {
      event: 'configuration_loaded',
    },
    'Configuration loaded successfully'
  );
}

// Tool execution logging
export function logToolExecutionStart(logger: Logger, toolName: string, params: unknown): void {
  logger.debug(
    {
      event: 'tool_execution_start',
      tool: toolName,
      params: sanitizeParams(params),
    },
    `Tool execution started: ${toolName}`
  );
}

export function logToolExecutionComplete(
  logger: Logger,
  toolName: string,
  durationMs: number,
  success: boolean
): void {
  logger.info(
    {
      event: 'tool_execution_complete',
      tool: toolName,
      durationMs,
      success,
    },
    `Tool execution ${success ? 'completed' : 'failed'}: ${toolName} (${durationMs}ms)`
  );
}

// Sanitize sensitive data from logs
function sanitizeParams(params: unknown): unknown {
  if (typeof params !== 'object' || params === null) {
    return params;
  }

  const sensitiveKeys = ['apikey', 'token', 'password', 'secret', 'authorization', 'api_key'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sanitized: any = Array.isArray(params) ? [...params] : { ...params };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeParams(sanitized[key]);
    }
  }

  return sanitized;
}
