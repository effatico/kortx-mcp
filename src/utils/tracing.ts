import { trace, Span, SpanStatusCode, Tracer, context, propagation } from '@opentelemetry/api';
import type { Logger } from './logger.js';

/**
 * Supported trace exporters
 */
export type TraceExporter = 'jaeger' | 'zipkin' | 'otlp' | 'console' | 'none';

/**
 * Distributed tracing configuration
 */
export interface TracingConfig {
  /** Whether tracing is enabled */
  enabled: boolean;
  /** Service name for traces */
  serviceName: string;
  /** Exporter type */
  exporter: TraceExporter;
  /** Exporter endpoint (for Jaeger, Zipkin, OTLP) */
  endpoint?: string;
  /** Sample rate (0-1), 1 = trace all requests */
  sampleRate: number;
}

/**
 * Default tracing configuration
 */
export const DEFAULT_TRACING_CONFIG: TracingConfig = {
  enabled: false, // Opt-in feature
  serviceName: 'kortx-mcp',
  exporter: 'console',
  sampleRate: 1.0,
};

/**
 * Span attributes for consultation operations
 */
export interface ConsultationSpanAttributes {
  'consultation.tool': string;
  'consultation.model': string;
  'consultation.query_length': number;
  'consultation.has_context': boolean;
  'consultation.cache_hit'?: boolean;
}

/**
 * Span attributes for LLM operations
 */
export interface LLMSpanAttributes {
  'llm.model': string;
  'llm.request_tokens': number;
  'llm.response_tokens': number;
  'llm.total_tokens': number;
  'llm.reasoning_tokens'?: number;
  'llm.streaming'?: boolean;
}

/**
 * Distributed tracing utility using OpenTelemetry
 */
export class DistributedTracing {
  private logger: Logger;
  private config: TracingConfig;
  private tracer: Tracer | null = null;

  constructor(logger: Logger, config: TracingConfig = DEFAULT_TRACING_CONFIG) {
    this.logger = logger.child({ component: 'tracing' });
    this.config = config;

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize OpenTelemetry SDK
   * Note: Full SDK initialization with exporters requires additional setup
   * This is a simplified version that uses the OpenTelemetry API
   */
  private initialize(): void {
    try {
      // Get tracer instance
      this.tracer = trace.getTracer(this.config.serviceName, '1.0.0');

      this.logger.info(
        {
          serviceName: this.config.serviceName,
          exporter: this.config.exporter,
          sampleRate: this.config.sampleRate,
        },
        'Distributed tracing initialized (API mode)'
      );

      this.logger.warn(
        'Full OpenTelemetry SDK initialization requires additional setup. ' +
          'See https://opentelemetry.io/docs/js/ for details.'
      );
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize tracing');
      this.config.enabled = false;
    }
  }

  /**
   * Start a new span for an operation
   */
  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span | null {
    if (!this.config.enabled || !this.tracer) {
      return null;
    }

    // Apply sampling
    if (Math.random() > this.config.sampleRate) {
      return null;
    }

    const span = this.tracer.startSpan(name, {
      attributes: attributes || {},
    });

    return span;
  }

  /**
   * Start a span for a consultation operation
   */
  startConsultationSpan(
    toolName: string,
    attributes: Partial<ConsultationSpanAttributes>
  ): Span | null {
    return this.startSpan(`consultation.${toolName}`, {
      'consultation.tool': toolName,
      ...attributes,
    } as Record<string, string | number | boolean>);
  }

  /**
   * Start a span for an LLM operation
   */
  startLLMSpan(model: string, attributes: Partial<LLMSpanAttributes> = {}): Span | null {
    return this.startSpan('llm.request', {
      'llm.model': model,
      ...attributes,
    } as Record<string, string | number | boolean>);
  }

  /**
   * End a span with success status
   */
  endSpan(span: Span | null, attributes?: Record<string, string | number | boolean>): void {
    if (!span) return;

    if (attributes) {
      span.setAttributes(attributes);
    }

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  }

  /**
   * End a span with error status
   */
  endSpanWithError(span: Span | null, error: Error): void {
    if (!span) return;

    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });

    span.recordException(error);
    span.end();
  }

  /**
   * Execute an operation within a traced span
   */
  async traceOperation<T>(
    name: string,
    operation: (span: Span | null) => Promise<T>,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    const span = this.startSpan(name, attributes);

    try {
      const result = await operation(span);
      this.endSpan(span);
      return result;
    } catch (error) {
      this.endSpanWithError(span, error as Error);
      throw error;
    }
  }

  /**
   * Execute a consultation operation within a traced span
   */
  async traceConsultation<T>(
    toolName: string,
    operation: (span: Span | null) => Promise<T>,
    attributes: Partial<ConsultationSpanAttributes>
  ): Promise<T> {
    const span = this.startConsultationSpan(toolName, attributes);

    try {
      const result = await operation(span);
      this.endSpan(span);
      return result;
    } catch (error) {
      this.endSpanWithError(span, error as Error);
      throw error;
    }
  }

  /**
   * Execute an LLM operation within a traced span
   */
  async traceLLM<T>(
    model: string,
    operation: (span: Span | null) => Promise<T>,
    attributes: Partial<LLMSpanAttributes> = {}
  ): Promise<T> {
    const span = this.startLLMSpan(model, attributes);

    try {
      const result = await operation(span);
      this.endSpan(span);
      return result;
    } catch (error) {
      this.endSpanWithError(span, error as Error);
      throw error;
    }
  }

  /**
   * Get current trace context for propagation
   */
  getCurrentContext(): unknown {
    return context.active();
  }

  /**
   * Inject trace context into carrier (for HTTP headers, etc.)
   */
  injectContext(carrier: Record<string, string>): void {
    propagation.inject(context.active(), carrier);
  }

  /**
   * Extract trace context from carrier
   */
  extractContext(carrier: Record<string, string>): unknown {
    return propagation.extract(context.active(), carrier);
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<TracingConfig> {
    return { ...this.config };
  }

  /**
   * Shutdown tracing (call on process exit)
   */
  async shutdown(): Promise<void> {
    this.logger.info('Distributed tracing shut down');
  }
}
