import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResponseCache, type CacheConfig, type CacheKeyComponents } from './cache.js';
import pino from 'pino';

describe('ResponseCache', () => {
  let cache: ResponseCache;
  let logger: pino.Logger;
  let config: CacheConfig;

  beforeEach(() => {
    logger = pino({ level: 'silent' });
    config = {
      maxSizeMB: 1,
      consultationTTL: 3600,
      searchTTL: 86400,
      debug: false,
    };
    cache = new ResponseCache(config, logger);
  });

  describe('generateKey', () => {
    it('should generate consistent keys for same inputs', () => {
      const components: CacheKeyComponents = {
        tool: 'think-about-plan',
        model: 'gpt-5-mini',
        prompt: 'test prompt',
        context: 'test context',
      };

      const key1 = cache.generateKey(components);
      const key2 = cache.generateKey(components);

      expect(key1).toBe(key2);
      expect(key1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should generate different keys for different inputs', () => {
      const components1: CacheKeyComponents = {
        tool: 'think-about-plan',
        model: 'gpt-5-mini',
        prompt: 'test prompt 1',
        context: 'test context',
      };

      const components2: CacheKeyComponents = {
        tool: 'think-about-plan',
        model: 'gpt-5-mini',
        prompt: 'test prompt 2',
        context: 'test context',
      };

      const key1 = cache.generateKey(components1);
      const key2 = cache.generateKey(components2);

      expect(key1).not.toBe(key2);
    });

    it('should handle missing context', () => {
      const components: CacheKeyComponents = {
        tool: 'think-about-plan',
        model: 'gpt-5-mini',
        prompt: 'test prompt',
      };

      const key = cache.generateKey(components);
      expect(key).toHaveLength(64);
    });

    it('should generate different keys when tool changes', () => {
      const base = {
        model: 'gpt-5-mini',
        prompt: 'test',
        context: 'context',
      };

      const key1 = cache.generateKey({ tool: 'think-about-plan', ...base });
      const key2 = cache.generateKey({ tool: 'solve-problem', ...base });

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys when model changes', () => {
      const base = {
        tool: 'think-about-plan',
        prompt: 'test',
        context: 'context',
      };

      const key1 = cache.generateKey({ model: 'gpt-5-mini', ...base });
      const key2 = cache.generateKey({ model: 'gpt-5', ...base });

      expect(key1).not.toBe(key2);
    });
  });

  describe('get and set', () => {
    it('should store and retrieve values', () => {
      const key = 'test-key';
      const value = 'test-value';

      cache.set(key, value);
      const retrieved = cache.get(key);

      expect(retrieved).toBe(value);
    });

    it('should return undefined for non-existent keys', () => {
      const retrieved = cache.get('non-existent-key');
      expect(retrieved).toBeUndefined();
    });

    it('should update stats on cache hit', () => {
      const key = 'test-key';
      cache.set(key, 'value');

      const statsBefore = cache.getStats();
      cache.get(key);
      const statsAfter = cache.getStats();

      expect(statsAfter.hits).toBe(statsBefore.hits + 1);
    });

    it('should update stats on cache miss', () => {
      const statsBefore = cache.getStats();
      cache.get('non-existent-key');
      const statsAfter = cache.getStats();

      expect(statsAfter.misses).toBe(statsBefore.misses + 1);
    });

    it('should respect custom TTL', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const shortTTL = 1; // 1 second

      cache.set(key, value, shortTTL);
      expect(cache.get(key)).toBe(value);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(cache.get(key)).toBeUndefined();
    });

    it('should use default TTL when not specified', () => {
      const key = 'test-key';
      const value = 'test-value';

      cache.set(key, value);
      expect(cache.get(key)).toBe(value);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      const key = 'test-key';
      cache.set(key, 'value');

      expect(cache.has(key)).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('non-existent-key')).toBe(false);
    });

    it('should not count as hit or miss', () => {
      const key = 'test-key';
      cache.set(key, 'value');

      const statsBefore = cache.getStats();
      cache.has(key);
      const statsAfter = cache.getStats();

      expect(statsAfter.hits).toBe(statsBefore.hits);
      expect(statsAfter.misses).toBe(statsBefore.misses);
    });
  });

  describe('clear', () => {
    it('should remove all cached entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });

    it('should reset stats', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key2'); // miss

      cache.clear();
      const stats = cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.itemCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('key3'); // miss

      const stats = cache.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.itemCount).toBe(2);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });

    it('should handle zero total requests', () => {
      const stats = cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key', 'value');

      cache.get('key'); // hit
      cache.get('key'); // hit
      cache.get('key'); // hit
      cache.get('other'); // miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0.75); // 3 hits / 4 total
    });
  });

  describe('logStats', () => {
    it('should log statistics', () => {
      const logSpy = vi.spyOn(logger, 'info');

      cache.set('key', 'value');
      cache.get('key'); // hit
      cache.get('other'); // miss

      cache.logStats();

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          hits: 1,
          misses: 1,
          itemCount: 1,
          hitRate: expect.any(String),
          sizeMB: expect.any(String),
        }),
        'Cache statistics'
      );
    });

    it('should log when cache is empty', () => {
      const logSpy = vi.spyOn(logger, 'info');

      cache.logStats();

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          hits: 0,
          misses: 0,
          itemCount: 0,
          hitRate: '0.00%',
          sizeMB: '0.00',
        }),
        'Cache statistics'
      );
    });
  });

  describe('LRU eviction', () => {
    it('should evict entries when size limit is reached', () => {
      // Create a small cache with max 2 items
      const smallConfig: CacheConfig = {
        maxSizeMB: 0.001, // Small size to force eviction
        consultationTTL: 3600,
        searchTTL: 86400,
        debug: false,
      };
      const smallCache = new ResponseCache(smallConfig, logger);

      // Add multiple entries that exceed the size limit
      const longValue = 'x'.repeat(500);
      smallCache.set('key1', longValue);
      smallCache.set('key2', longValue);
      smallCache.set('key3', longValue);

      // Check that some entries were evicted
      const stats = smallCache.getStats();
      expect(stats.itemCount).toBeLessThanOrEqual(2);
    });

    it('should keep most recently used entries', () => {
      const smallConfig: CacheConfig = {
        maxSizeMB: 0.001,
        consultationTTL: 3600,
        searchTTL: 86400,
        debug: false,
      };
      const smallCache = new ResponseCache(smallConfig, logger);

      const longValue = 'x'.repeat(400);
      smallCache.set('key1', longValue);
      smallCache.set('key2', longValue);

      // Access key1 to make it more recent
      smallCache.get('key1');

      // Add key3, which should evict key2 (least recently used)
      smallCache.set('key3', longValue);

      // key3 should exist (most recently added)
      expect(smallCache.get('key3')).not.toBeUndefined();
    });
  });

  describe('size calculation', () => {
    it('should calculate size based on string length', () => {
      const key = 'test-key';
      const shortValue = 'short';
      const longValue = 'x'.repeat(10000);

      cache.set(key, shortValue);
      const statsShort = cache.getStats();

      cache.clear();

      cache.set(key, longValue);
      const statsLong = cache.getStats();

      expect(statsLong.itemCount).toBe(statsShort.itemCount);
      expect(statsLong.size).toBeGreaterThan(statsShort.size);
    });
  });

  describe('debug mode', () => {
    it('should log detailed information when debug is enabled', () => {
      const debugConfig: CacheConfig = {
        ...config,
        debug: true,
      };
      const debugCache = new ResponseCache(debugConfig, pino({ level: 'debug' }));
      const logSpy = vi.spyOn(debugCache['logger'], 'debug');

      const key = 'test-key';
      debugCache.set(key, 'value');
      debugCache.get(key);

      expect(logSpy).toHaveBeenCalled();
    });
  });
});
