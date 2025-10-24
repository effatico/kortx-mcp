import type { Logger } from './logger.js';

/**
 * Latency metrics for a specific operation
 */
export interface LatencyMetrics {
  /** Average latency in milliseconds */
  mean: number;
  /** Median latency (P50) */
  p50: number;
  /** 95th percentile latency */
  p95: number;
  /** 99th percentile latency */
  p99: number;
  /** Maximum latency */
  max: number;
  /** Minimum latency */
  min: number;
  /** Total number of samples */
  count: number;
}

/**
 * Metrics tracker configuration
 */
export interface MetricsConfig {
  /** Rolling window size (number of samples to keep) */
  windowSize: number;
  /** Whether to enable detailed logging */
  enableLogging: boolean;
}

/**
 * Default metrics configuration
 */
export const DEFAULT_METRICS_CONFIG: MetricsConfig = {
  windowSize: 100,
  enableLogging: false,
};

/**
 * Metrics tracker for latency and performance monitoring
 * Uses rolling window for adaptive calculations
 */
export class MetricsTracker {
  private logger: Logger;
  private config: MetricsConfig;
  private latencies: Map<string, number[]>;

  constructor(logger: Logger, config: MetricsConfig = DEFAULT_METRICS_CONFIG) {
    this.logger = logger.child({ component: 'metrics-tracker' });
    this.config = config;
    this.latencies = new Map();
  }

  /**
   * Record a latency sample for an operation
   */
  recordLatency(operation: string, latencyMs: number): void {
    if (!this.latencies.has(operation)) {
      this.latencies.set(operation, []);
    }

    const samples = this.latencies.get(operation)!;
    samples.push(latencyMs);

    // Maintain rolling window
    if (samples.length > this.config.windowSize) {
      samples.shift();
    }

    if (this.config.enableLogging) {
      this.logger.debug(
        {
          operation,
          latencyMs,
          sampleCount: samples.length,
        },
        'Latency recorded'
      );
    }
  }

  /**
   * Get latency metrics for an operation
   */
  getMetrics(operation: string): LatencyMetrics | null {
    const samples = this.latencies.get(operation);

    if (!samples || samples.length === 0) {
      return null;
    }

    // Sort samples for percentile calculations
    const sorted = [...samples].sort((a, b) => a - b);

    const count = sorted.length;
    const mean = sorted.reduce((sum, val) => sum + val, 0) / count;
    const min = sorted[0];
    const max = sorted[count - 1];

    // Calculate percentiles
    const p50 = this.calculatePercentile(sorted, 0.5);
    const p95 = this.calculatePercentile(sorted, 0.95);
    const p99 = this.calculatePercentile(sorted, 0.99);

    return {
      mean,
      p50,
      p95,
      p99,
      max,
      min,
      count,
    };
  }

  /**
   * Get adaptive timeout based on P95 latency
   * Returns P95 × multiplier (default 1.5)
   */
  getAdaptiveTimeout(operation: string, multiplier: number = 1.5): number | null {
    const metrics = this.getMetrics(operation);

    if (!metrics) {
      return null;
    }

    const adaptiveTimeout = Math.ceil(metrics.p95 * multiplier);

    this.logger.debug(
      {
        operation,
        p95: metrics.p95,
        multiplier,
        adaptiveTimeout,
      },
      'Calculated adaptive timeout'
    );

    return adaptiveTimeout;
  }

  /**
   * Calculate percentile from sorted array using linear interpolation
   */
  private calculatePercentile(sorted: number[], percentile: number): number {
    if (sorted.length === 0) return NaN;

    const pos = percentile * (sorted.length - 1);
    const lower = Math.floor(pos);
    const upper = Math.ceil(pos);

    if (lower === upper) {
      return sorted[lower];
    }

    const weight = pos - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Get all operations being tracked
   */
  getOperations(): string[] {
    return Array.from(this.latencies.keys());
  }

  /**
   * Get metrics for all operations
   */
  getAllMetrics(): Map<string, LatencyMetrics> {
    const result = new Map<string, LatencyMetrics>();

    for (const operation of this.latencies.keys()) {
      const metrics = this.getMetrics(operation);
      if (metrics) {
        result.set(operation, metrics);
      }
    }

    return result;
  }

  /**
   * Clear metrics for a specific operation
   */
  clearOperation(operation: string): void {
    this.latencies.delete(operation);
    this.logger.debug({ operation }, 'Metrics cleared for operation');
  }

  /**
   * Clear all metrics
   */
  clearAll(): void {
    this.latencies.clear();
    this.logger.info('All metrics cleared');
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<MetricsConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...config };

    // Trim existing samples if window size decreased
    if (config.windowSize !== undefined) {
      for (const [operation, samples] of this.latencies.entries()) {
        if (samples.length > this.config.windowSize) {
          this.latencies.set(operation, samples.slice(-this.config.windowSize));
        }
      }
    }

    this.logger.info({ config: this.config }, 'Metrics configuration updated');
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): Record<string, LatencyMetrics> {
    const metrics: Record<string, LatencyMetrics> = {};

    for (const operation of this.latencies.keys()) {
      const operationMetrics = this.getMetrics(operation);
      if (operationMetrics) {
        metrics[operation] = operationMetrics;
      }
    }

    return metrics;
  }
}
