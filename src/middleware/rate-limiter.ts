/**
 * Rate limiting middleware for MCP tools
 * Implements per-client rate limiting with token budget enforcement
 */

export interface RateLimitInfo {
  count: number;
  tokens: number;
  windowStart: number;
  lastRequest: number;
}

export interface RateLimiterConfig {
  maxRequestsPerHour: number;
  maxTokensPerRequest: number;
  maxTokensPerHour: number;
  windowSizeMs: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitInfo>;
  private config: RateLimiterConfig;

  constructor(config?: Partial<RateLimiterConfig>) {
    this.limits = new Map();
    this.config = {
      maxRequestsPerHour: config?.maxRequestsPerHour ?? 100,
      maxTokensPerRequest: config?.maxTokensPerRequest ?? 50000,
      maxTokensPerHour: config?.maxTokensPerHour ?? 500000,
      windowSizeMs: config?.windowSizeMs ?? 3600000, // 1 hour in ms
    };
  }

  /**
   * Check if a request is allowed for the given client
   * @param clientId Unique identifier for the client
   * @param estimatedTokens Estimated tokens for this request
   * @returns true if request is allowed, false otherwise
   */
  checkLimit(clientId: string, estimatedTokens: number = 0): boolean {
    const now = Date.now();
    const limit = this.limits.get(clientId);

    // Check token budget for single request
    if (estimatedTokens > this.config.maxTokensPerRequest) {
      return false;
    }

    if (!limit) {
      // First request for this client
      this.limits.set(clientId, {
        count: 1,
        tokens: estimatedTokens,
        windowStart: now,
        lastRequest: now,
      });
      return true;
    }

    // Check if window has expired
    const windowElapsed = now - limit.windowStart;
    if (windowElapsed >= this.config.windowSizeMs) {
      // Reset window
      this.limits.set(clientId, {
        count: 1,
        tokens: estimatedTokens,
        windowStart: now,
        lastRequest: now,
      });
      return true;
    }

    // Check request count limit
    if (limit.count >= this.config.maxRequestsPerHour) {
      return false;
    }

    // Check token budget limit
    if (limit.tokens + estimatedTokens > this.config.maxTokensPerHour) {
      return false;
    }

    // Update limits
    limit.count += 1;
    limit.tokens += estimatedTokens;
    limit.lastRequest = now;

    return true;
  }

  /**
   * Record actual tokens used after request completion
   * @param clientId Unique identifier for the client
   * @param actualTokens Actual tokens consumed by the request
   */
  recordTokens(clientId: string, actualTokens: number): void {
    const limit = this.limits.get(clientId);
    if (limit) {
      // Adjust token count with actual usage
      limit.tokens = Math.max(0, limit.tokens + actualTokens);
    }
  }

  /**
   * Get current rate limit info for a client
   * @param clientId Unique identifier for the client
   * @returns Current rate limit info or undefined
   */
  getClientInfo(clientId: string): RateLimitInfo | undefined {
    return this.limits.get(clientId);
  }

  /**
   * Reset rate limits for a client
   * @param clientId Unique identifier for the client
   */
  resetClient(clientId: string): void {
    this.limits.delete(clientId);
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [clientId, limit] of this.limits.entries()) {
      if (now - limit.windowStart >= this.config.windowSizeMs) {
        this.limits.delete(clientId);
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): RateLimiterConfig {
    return { ...this.config };
  }
}
