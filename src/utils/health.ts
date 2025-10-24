import type { Logger } from './logger.js';

/**
 * Health check status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
}

/**
 * Health check result for a service
 */
export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: Date;
  responseTime?: number;
  error?: string;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  /** Interval in milliseconds between health checks */
  interval: number;
  /** Timeout in milliseconds for health check requests */
  timeout: number;
  /** Number of consecutive failures before marking as unhealthy */
  unhealthyThreshold: number;
  /** Number of consecutive successes before marking as healthy */
  healthyThreshold: number;
}

/**
 * Default health check configuration
 */
export const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  interval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  unhealthyThreshold: 3,
  healthyThreshold: 2,
};

/**
 * Health monitor for external services
 */
export class HealthMonitor {
  private checks: Map<string, HealthCheckResult> = new Map();
  private consecutiveFailures: Map<string, number> = new Map();
  private consecutiveSuccesses: Map<string, number> = new Map();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private logger: Logger;
  private config: HealthCheckConfig;

  constructor(config: HealthCheckConfig, logger: Logger) {
    this.config = config;
    this.logger = logger.child({ component: 'health-monitor' });
  }

  /**
   * Register a health check for a service
   */
  registerCheck(serviceName: string, checkFn: () => Promise<void>): void {
    this.logger.info({ service: serviceName }, 'Registering health check');

    // Initialize counters
    this.consecutiveFailures.set(serviceName, 0);
    this.consecutiveSuccesses.set(serviceName, 0);

    // Run initial check
    this.runCheck(serviceName, checkFn);

    // Schedule periodic checks
    const interval = setInterval(() => {
      this.runCheck(serviceName, checkFn);
    }, this.config.interval);

    this.intervals.set(serviceName, interval);
  }

  /**
   * Run a health check for a service
   */
  private async runCheck(serviceName: string, checkFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();

    try {
      // Run check with timeout
      await Promise.race([
        checkFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
        ),
      ]);

      const responseTime = Date.now() - startTime;
      this.handleSuccess(serviceName, responseTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.handleFailure(serviceName, errorMessage);
    }
  }

  /**
   * Handle successful health check
   */
  private handleSuccess(serviceName: string, responseTime: number): void {
    const successes = (this.consecutiveSuccesses.get(serviceName) || 0) + 1;

    this.consecutiveSuccesses.set(serviceName, successes);
    this.consecutiveFailures.set(serviceName, 0);

    const currentStatus = this.checks.get(serviceName)?.status;
    let newStatus: HealthStatus;

    if (currentStatus === HealthStatus.UNHEALTHY || currentStatus === HealthStatus.DEGRADED) {
      // Need consecutive successes to recover
      if (successes >= this.config.healthyThreshold) {
        newStatus = HealthStatus.HEALTHY;
        this.logger.info(
          { service: serviceName, responseTime },
          'Service recovered to healthy state'
        );
      } else {
        newStatus = HealthStatus.DEGRADED;
      }
    } else {
      newStatus = HealthStatus.HEALTHY;
    }

    this.checks.set(serviceName, {
      status: newStatus,
      timestamp: new Date(),
      responseTime,
    });

    this.logger.debug(
      {
        service: serviceName,
        status: newStatus,
        responseTime,
        consecutiveSuccesses: successes,
      },
      'Health check succeeded'
    );
  }

  /**
   * Handle failed health check
   */
  private handleFailure(serviceName: string, error: string): void {
    const failures = (this.consecutiveFailures.get(serviceName) || 0) + 1;

    this.consecutiveFailures.set(serviceName, failures);
    this.consecutiveSuccesses.set(serviceName, 0);

    const currentStatus = this.checks.get(serviceName)?.status;
    let newStatus: HealthStatus;

    if (failures >= this.config.unhealthyThreshold) {
      newStatus = HealthStatus.UNHEALTHY;
      if (currentStatus !== HealthStatus.UNHEALTHY) {
        this.logger.warn({ service: serviceName, error, failures }, 'Service marked as unhealthy');
      }
    } else {
      newStatus =
        currentStatus === HealthStatus.HEALTHY
          ? HealthStatus.DEGRADED
          : currentStatus || HealthStatus.DEGRADED;
    }

    this.checks.set(serviceName, {
      status: newStatus,
      timestamp: new Date(),
      error,
    });

    this.logger.warn(
      {
        service: serviceName,
        status: newStatus,
        error,
        consecutiveFailures: failures,
      },
      'Health check failed'
    );
  }

  /**
   * Get health status for a service
   */
  getStatus(serviceName: string): HealthCheckResult | undefined {
    return this.checks.get(serviceName);
  }

  /**
   * Check if a service is healthy
   */
  isHealthy(serviceName: string): boolean {
    const result = this.checks.get(serviceName);
    return result?.status === HealthStatus.HEALTHY;
  }

  /**
   * Get all health check results
   */
  getAllStatuses(): Map<string, HealthCheckResult> {
    return new Map(this.checks);
  }

  /**
   * Stop all health checks
   */
  stop(): void {
    for (const [serviceName, interval] of this.intervals.entries()) {
      clearInterval(interval);
      this.logger.info({ service: serviceName }, 'Stopped health check');
    }
    this.intervals.clear();
  }

  /**
   * Stop health check for a specific service
   */
  stopCheck(serviceName: string): void {
    const interval = this.intervals.get(serviceName);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(serviceName);
      this.logger.info({ service: serviceName }, 'Stopped health check');
    }
  }
}
