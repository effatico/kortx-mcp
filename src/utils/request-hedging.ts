import type { Logger } from './logger.js';

/**
 * Request hedging configuration
 */
export interface HedgingConfig {
  /** Whether hedging is enabled */
  enabled: boolean;
  /** Delay before sending hedged request (milliseconds) */
  delayMs: number;
  /** Maximum number of concurrent hedged requests */
  maxConcurrent: number;
}

/**
 * Default hedging configuration
 */
export const DEFAULT_HEDGING_CONFIG: HedgingConfig = {
  enabled: false, // Opt-in feature
  delayMs: 3000, // 3 second delay
  maxConcurrent: 2, // Primary + 1 hedge
};

/**
 * Request hedging result
 */
export interface HedgingResult<T> {
  /** The result from the fastest request */
  result: T;
  /** Which request won (0 = primary, 1+ = hedged) */
  winnerIndex: number;
  /** Time taken by the winning request */
  duration: number;
  /** Whether hedging was triggered */
  hedgingTriggered: boolean;
}

/**
 * Request hedging utility
 * Implements tail-latency reduction via duplicate requests with delay
 */
export class RequestHedging {
  private logger: Logger;
  private config: HedgingConfig;

  constructor(logger: Logger, config: HedgingConfig = DEFAULT_HEDGING_CONFIG) {
    this.logger = logger.child({ component: 'request-hedging' });
    this.config = config;
  }

  /**
   * Execute request with optional hedging
   * First-response-wins pattern with delayed duplicate requests
   */
  async executeWithHedging<T>(
    requestFn: () => Promise<T>,
    options: {
      /** Request identifier for logging */
      requestId?: string;
      /** Override hedging config for this request */
      hedgingOverride?: Partial<HedgingConfig>;
    } = {}
  ): Promise<HedgingResult<T>> {
    const config = { ...this.config, ...options.hedgingOverride };
    const requestId = options.requestId || 'unknown';

    // If hedging is disabled, just execute the primary request
    if (!config.enabled) {
      this.logger.debug({ requestId }, 'Hedging disabled, executing primary request only');

      const startTime = Date.now();
      const result = await requestFn();
      const duration = Date.now() - startTime;

      return {
        result,
        winnerIndex: 0,
        duration,
        hedgingTriggered: false,
      };
    }

    this.logger.debug(
      {
        requestId,
        delayMs: config.delayMs,
        maxConcurrent: config.maxConcurrent,
      },
      'Executing request with hedging enabled'
    );

    const startTime = Date.now();
    const abortControllers: AbortController[] = [];

    try {
      // Create promises for primary and hedged requests
      const promises: Array<Promise<{ result: T; index: number }>> = [];

      // Primary request (index 0)
      const primaryAbortController = new AbortController();
      abortControllers.push(primaryAbortController);

      promises.push(
        this.executeWithAbort(requestFn, primaryAbortController, 0, requestId, 'primary')
      );

      // Schedule hedged requests with delays
      for (let i = 1; i < config.maxConcurrent; i++) {
        const delay = config.delayMs * i;
        const hedgeAbortController = new AbortController();
        abortControllers.push(hedgeAbortController);

        promises.push(
          this.delayedExecution(requestFn, delay, hedgeAbortController, i, requestId, `hedge-${i}`)
        );
      }

      // Race all requests, first one wins
      const winner = await Promise.race(promises);
      const duration = Date.now() - startTime;

      // Cancel all other in-flight requests
      for (let i = 0; i < abortControllers.length; i++) {
        if (i !== winner.index) {
          abortControllers[i].abort();
        }
      }

      this.logger.info(
        {
          requestId,
          winnerIndex: winner.index,
          duration,
          hedgingTriggered: winner.index > 0,
        },
        `Request completed, ${winner.index === 0 ? 'primary' : `hedge-${winner.index}`} won`
      );

      return {
        result: winner.result,
        winnerIndex: winner.index,
        duration,
        hedgingTriggered: winner.index > 0,
      };
    } catch (error) {
      // Cancel all in-flight requests on error
      for (const controller of abortControllers) {
        controller.abort();
      }

      this.logger.error({ requestId, error }, 'Hedged request failed');
      throw error;
    }
  }

  /**
   * Execute request with abort support
   */
  private async executeWithAbort<T>(
    requestFn: () => Promise<T>,
    abortController: AbortController,
    index: number,
    requestId: string,
    label: string
  ): Promise<{ result: T; index: number }> {
    this.logger.debug({ requestId, index, label }, 'Starting request');

    try {
      // Execute the request
      const result = await requestFn();

      // Check if we were aborted while waiting
      if (abortController.signal.aborted) {
        throw new Error(`Request ${label} cancelled by hedging (another request won)`);
      }

      return { result, index };
    } catch (error) {
      if (abortController.signal.aborted) {
        this.logger.debug({ requestId, index, label }, 'Request was cancelled by hedging');
        throw new Error(`Request ${label} cancelled by hedging (another request won)`);
      }

      this.logger.warn({ requestId, index, label, error }, 'Request failed');
      throw error;
    }
  }

  /**
   * Execute request after a delay
   */
  private async delayedExecution<T>(
    requestFn: () => Promise<T>,
    delayMs: number,
    abortController: AbortController,
    index: number,
    requestId: string,
    label: string
  ): Promise<{ result: T; index: number }> {
    // Wait for delay or abort
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(resolve, delayMs);

      if (abortController.signal.aborted) {
        clearTimeout(timeout);
        reject(new Error(`Hedged request ${label} cancelled before delay (another request won)`));
        return;
      }

      abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error(`Hedged request ${label} cancelled during delay (another request won)`));
      });
    });

    // Execute the hedged request
    return this.executeWithAbort(requestFn, abortController, index, requestId, label);
  }

  /**
   * Get hedging statistics
   */
  getConfig(): Readonly<HedgingConfig> {
    return { ...this.config };
  }

  /**
   * Update hedging configuration
   */
  updateConfig(config: Partial<HedgingConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info({ config: this.config }, 'Hedging configuration updated');
  }
}
