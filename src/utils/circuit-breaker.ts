import CircuitBreaker from 'opossum';
import type { Logger } from './logger.js';

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerConfig {
  /** Timeout in milliseconds before considering request failed */
  timeout: number;
  /** Error threshold percentage (0-1) */
  errorThresholdPercentage: number;
  /** Reset timeout in milliseconds */
  resetTimeout: number;
  /** Minimum number of requests before circuit can trip */
  volumeThreshold: number;
  /** Rolling window duration in milliseconds */
  rollingCountTimeout: number;
  /** Name of the circuit breaker for logging */
  name: string;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: Omit<CircuitBreakerConfig, 'name'> = {
  timeout: 60000, // 60 seconds
  errorThresholdPercentage: 0.5, // 50% error rate
  resetTimeout: 30000, // 30 seconds
  volumeThreshold: 10, // 10 failures
  rollingCountTimeout: 60000, // 60 second rolling window
};

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'halfOpen',
}

/**
 * Creates a circuit breaker for an async function
 */
export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: CircuitBreakerConfig,
  logger: Logger
): CircuitBreaker<Parameters<T>, Awaited<ReturnType<T>>> {
  const breaker = new CircuitBreaker<Parameters<T>, Awaited<ReturnType<T>>>(fn, {
    timeout: config.timeout,
    errorThresholdPercentage: config.errorThresholdPercentage,
    resetTimeout: config.resetTimeout,
    volumeThreshold: config.volumeThreshold,
    rollingCountTimeout: config.rollingCountTimeout,
  });

  // Log circuit breaker events
  breaker.on('open', () => {
    logger.warn(
      {
        name: config.name,
        state: CircuitBreakerState.OPEN,
        stats: breaker.stats,
      },
      'Circuit breaker opened'
    );
  });

  breaker.on('halfOpen', () => {
    logger.info(
      {
        name: config.name,
        state: CircuitBreakerState.HALF_OPEN,
      },
      'Circuit breaker half-open, testing recovery'
    );
  });

  breaker.on('close', () => {
    logger.info(
      {
        name: config.name,
        state: CircuitBreakerState.CLOSED,
      },
      'Circuit breaker closed'
    );
  });

  breaker.on('success', () => {
    logger.debug(
      {
        name: config.name,
        state: breaker.opened ? CircuitBreakerState.OPEN : CircuitBreakerState.CLOSED,
      },
      'Circuit breaker request succeeded'
    );
  });

  breaker.on('failure', error => {
    logger.warn(
      {
        name: config.name,
        error: error instanceof Error ? error.message : String(error),
        stats: breaker.stats,
      },
      'Circuit breaker request failed'
    );
  });

  breaker.on('timeout', () => {
    logger.warn(
      {
        name: config.name,
        timeout: config.timeout,
        stats: breaker.stats,
      },
      'Circuit breaker request timeout'
    );
  });

  breaker.on('reject', () => {
    logger.warn(
      {
        name: config.name,
        state: CircuitBreakerState.OPEN,
      },
      'Circuit breaker rejected request (circuit open)'
    );
  });

  return breaker;
}

/**
 * Get circuit breaker statistics
 */
export function getCircuitBreakerStats(breaker: CircuitBreaker<any, any>) {
  const stats = breaker.stats;
  return {
    failures: stats.failures,
    successes: stats.successes,
    rejects: stats.rejects,
    timeouts: stats.timeouts,
    fires: stats.fires,
    latencyMean: stats.latencyMean,
    isOpen: breaker.opened,
    isHalfOpen: breaker.halfOpen,
    isClosed: breaker.closed,
  };
}
