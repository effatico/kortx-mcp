import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from './rate-limiter.js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequestsPerHour: 10,
      maxTokensPerRequest: 1000,
      maxTokensPerHour: 5000,
      windowSizeMs: 3600000,
    });
  });

  describe('checkLimit', () => {
    it('should allow first request', () => {
      expect(rateLimiter.checkLimit('client1', 100)).toBe(true);
    });

    it('should reject request exceeding maxTokensPerRequest', () => {
      expect(rateLimiter.checkLimit('client1', 2000)).toBe(false);
    });

    it('should reject request exceeding maxRequestsPerHour', () => {
      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.checkLimit('client1', 100)).toBe(true);
      }
      expect(rateLimiter.checkLimit('client1', 100)).toBe(false);
    });

    it('should reject request exceeding maxTokensPerHour', () => {
      // First request: 800 tokens (allowed, within both per-request and hourly limits)
      expect(rateLimiter.checkLimit('client1', 800)).toBe(true);
      // Make multiple requests to approach the limit
      expect(rateLimiter.checkLimit('client1', 800)).toBe(true);
      expect(rateLimiter.checkLimit('client1', 800)).toBe(true);
      expect(rateLimiter.checkLimit('client1', 800)).toBe(true);
      expect(rateLimiter.checkLimit('client1', 800)).toBe(true);
      expect(rateLimiter.checkLimit('client1', 800)).toBe(true);
      // Total so far: 4800 tokens
      // Next request would exceed 5000 limit (4800 + 300 > 5000)
      expect(rateLimiter.checkLimit('client1', 300)).toBe(false);
    });

    it('should track different clients separately', () => {
      expect(rateLimiter.checkLimit('client1', 100)).toBe(true);
      expect(rateLimiter.checkLimit('client2', 100)).toBe(true);

      const client1Info = rateLimiter.getClientInfo('client1');
      const client2Info = rateLimiter.getClientInfo('client2');

      expect(client1Info?.count).toBe(1);
      expect(client2Info?.count).toBe(1);
    });

    it('should reset window after expiration', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      rateLimiter.checkLimit('client1', 100);

      // Advance time past window
      vi.setSystemTime(now + 3600001);

      expect(rateLimiter.checkLimit('client1', 100)).toBe(true);
      const info = rateLimiter.getClientInfo('client1');
      expect(info?.count).toBe(1);

      vi.useRealTimers();
    });
  });

  describe('recordTokens', () => {
    it('should adjust token count with actual usage', () => {
      rateLimiter.checkLimit('client1', 100);
      rateLimiter.recordTokens('client1', 50);

      const info = rateLimiter.getClientInfo('client1');
      expect(info?.tokens).toBe(150);
    });

    it('should not go below zero tokens', () => {
      rateLimiter.checkLimit('client1', 100);
      rateLimiter.recordTokens('client1', -200);

      const info = rateLimiter.getClientInfo('client1');
      expect(info?.tokens).toBe(0);
    });
  });

  describe('resetClient', () => {
    it('should clear client limits', () => {
      rateLimiter.checkLimit('client1', 100);
      rateLimiter.resetClient('client1');

      expect(rateLimiter.getClientInfo('client1')).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      rateLimiter.checkLimit('client1', 100);
      rateLimiter.checkLimit('client2', 100);

      // Advance time past window
      vi.setSystemTime(now + 3600001);

      rateLimiter.cleanup();

      expect(rateLimiter.getClientInfo('client1')).toBeUndefined();
      expect(rateLimiter.getClientInfo('client2')).toBeUndefined();

      vi.useRealTimers();
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = rateLimiter.getConfig();
      expect(config.maxRequestsPerHour).toBe(10);
      expect(config.maxTokensPerRequest).toBe(1000);
      expect(config.maxTokensPerHour).toBe(5000);
      expect(config.windowSizeMs).toBe(3600000);
    });
  });
});
