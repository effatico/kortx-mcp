import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';
import type { Logger } from './logger.js';

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Maximum cache size in MB */
  maxSizeMB: number;
  /** Default TTL for consultation responses in seconds */
  consultationTTL: number;
  /** Default TTL for search responses in seconds */
  searchTTL: number;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Cache key components for generating unique cache keys
 */
export interface CacheKeyComponents {
  tool: string;
  model: string;
  prompt: string;
  context?: string;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  itemCount: number;
  hitRate: number;
}

/**
 * Response cache using LRU eviction strategy
 * Caches LLM responses to reduce API calls and improve latency
 */
export class ResponseCache {
  private cache: LRUCache<string, string>;
  private logger: Logger;
  private config: CacheConfig;
  private hits: number = 0;
  private misses: number = 0;

  constructor(config: CacheConfig, logger: Logger) {
    this.config = config;
    this.logger = logger.child({ component: 'response-cache' });

    // Convert MB to bytes for max size (ensure integer)
    const maxSizeBytes = Math.floor(config.maxSizeMB * 1024 * 1024);

    // Create LRU cache with size-based eviction
    this.cache = new LRUCache<string, string>({
      max: 1000, // Max number of items
      maxSize: maxSizeBytes,
      sizeCalculation: value => {
        // Estimate size in bytes (UTF-16 uses 2 bytes per character)
        return value.length * 2;
      },
      ttl: config.consultationTTL * 1000, // Default TTL in milliseconds
      updateAgeOnGet: true, // Reset TTL on cache hit
      updateAgeOnHas: false, // Don't reset TTL on has() check
    });

    this.logger.info(
      {
        maxSizeMB: config.maxSizeMB,
        consultationTTL: config.consultationTTL,
        searchTTL: config.searchTTL,
      },
      'Response cache initialized'
    );
  }

  /**
   * Generate a cache key from components
   * Uses SHA-256 hash for consistent key length
   */
  generateKey(components: CacheKeyComponents): string {
    const data = JSON.stringify({
      tool: components.tool,
      model: components.model,
      prompt: components.prompt,
      context: components.context || '',
    });

    const hash = createHash('sha256').update(data).digest('hex');

    if (this.config.debug) {
      this.logger.debug({ components, hash }, 'Generated cache key');
    }

    return hash;
  }

  /**
   * Get a cached response
   * @param key - Cache key
   * @returns Cached response or undefined if not found
   */
  get(key: string): string | undefined {
    const value = this.cache.get(key);

    if (value !== undefined) {
      this.hits++;
      if (this.config.debug) {
        this.logger.debug({ key, hitRate: this.getHitRate() }, 'Cache hit');
      }
    } else {
      this.misses++;
      if (this.config.debug) {
        this.logger.debug({ key, hitRate: this.getHitRate() }, 'Cache miss');
      }
    }

    return value;
  }

  /**
   * Store a response in the cache
   * @param key - Cache key
   * @param value - Response to cache
   * @param ttlSeconds - Optional TTL override in seconds
   */
  set(key: string, value: string, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : undefined;

    this.cache.set(key, value, { ttl });

    if (this.config.debug) {
      this.logger.debug(
        {
          key,
          valueSize: value.length,
          ttlSeconds: ttlSeconds || this.config.consultationTTL,
          cacheSize: this.cache.size,
        },
        'Cached response'
      );
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key - Cache key
   * @returns True if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear all cached responses
   */
  clear(): void {
    const itemCount = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;

    this.logger.info({ itemCount }, 'Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.calculatedSize || 0,
      itemCount: this.cache.size,
      hitRate: this.getHitRate(),
    };
  }

  /**
   * Calculate cache hit rate
   */
  private getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  /**
   * Log cache statistics
   */
  logStats(): void {
    const stats = this.getStats();
    this.logger.info(
      {
        hits: stats.hits,
        misses: stats.misses,
        hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
        itemCount: stats.itemCount,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      },
      'Cache statistics'
    );
  }
}
