import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchConsultTool, BatchConsultInputSchema } from './batch-consult.js';
import type { Logger } from '../utils/logger.js';

describe('BatchConsultTool', () => {
  let mockLogger: Logger;
  let mockTools: any;
  let batchTool: BatchConsultTool;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    } as any;

    mockTools = {
      thinkAboutPlan: {
        execute: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Plan analysis result' }],
        }),
      },
      suggestAlternative: {
        execute: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Alternative suggestions' }],
        }),
      },
      improveCopy: {
        execute: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Improved copy' }],
        }),
      },
      solveProblem: {
        execute: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Problem solution' }],
        }),
      },
      searchContent: {
        execute: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Search results' }],
        }),
      },
      createVisual: {
        execute: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Visual created' }],
        }),
      },
    };

    batchTool = new BatchConsultTool(mockLogger, mockTools);
  });

  describe('Input validation', () => {
    it('should accept valid batch request with single item', () => {
      const input = {
        requests: [
          {
            toolName: 'think-about-plan',
            input: { plan: 'Test plan' },
          },
        ],
      };

      expect(() => BatchConsultInputSchema.parse(input)).not.toThrow();
    });

    it('should accept valid batch request with multiple items', () => {
      const input = {
        requests: [
          {
            toolName: 'think-about-plan',
            input: { plan: 'Test plan' },
            requestId: 'req-1',
          },
          {
            toolName: 'search-content',
            input: { query: 'Test query' },
            requestId: 'req-2',
          },
        ],
      };

      expect(() => BatchConsultInputSchema.parse(input)).not.toThrow();
    });

    it('should reject batch with no requests', () => {
      const input = { requests: [] };

      expect(() => BatchConsultInputSchema.parse(input)).toThrow();
    });

    it('should reject batch with more than 10 requests', () => {
      const input = {
        requests: Array.from({ length: 11 }, (_, i) => ({
          toolName: 'think-about-plan',
          input: { plan: `Plan ${i}` },
        })),
      };

      expect(() => BatchConsultInputSchema.parse(input)).toThrow();
    });

    it('should reject invalid tool name', () => {
      const input = {
        requests: [
          {
            toolName: 'invalid-tool',
            input: {},
          },
        ],
      };

      expect(() => BatchConsultInputSchema.parse(input)).toThrow();
    });
  });

  describe('Parallel execution', () => {
    it('should execute multiple requests in parallel', async () => {
      const input = {
        requests: [
          {
            toolName: 'think-about-plan' as const,
            input: { plan: 'Test plan 1' },
            requestId: 'req-1',
          },
          {
            toolName: 'search-content' as const,
            input: { query: 'Test query' },
            requestId: 'req-2',
          },
        ],
      };

      const result = await batchTool.execute(input);

      expect(mockTools.thinkAboutPlan.execute).toHaveBeenCalledWith({ plan: 'Test plan 1' });
      expect(mockTools.searchContent.execute).toHaveBeenCalledWith({ query: 'Test query' });
      expect(result.content[0].type).toBe('text');

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.batchResults).toHaveLength(2);
      expect(parsedResult.summary.total).toBe(2);
      expect(parsedResult.summary.success).toBe(2);
      expect(parsedResult.summary.failure).toBe(0);
    });

    it('should preserve request IDs in results', async () => {
      const input = {
        requests: [
          {
            toolName: 'think-about-plan' as const,
            input: { plan: 'Test plan' },
            requestId: 'custom-id-1',
          },
        ],
      };

      const result = await batchTool.execute(input);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.batchResults[0].requestId).toBe('custom-id-1');
    });

    it('should execute all 6 tool types', async () => {
      const input = {
        requests: [
          { toolName: 'think-about-plan' as const, input: { plan: 'Plan' } },
          { toolName: 'suggest-alternative' as const, input: { currentApproach: 'Approach' } },
          { toolName: 'improve-copy' as const, input: { originalText: 'Text', purpose: 'Doc' } },
          { toolName: 'solve-problem' as const, input: { problem: 'Problem' } },
          { toolName: 'search-content' as const, input: { query: 'Query' } },
          { toolName: 'create-visual' as const, input: { mode: 'generate', prompt: 'Prompt' } },
        ],
      };

      const result = await batchTool.execute(input);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.batchResults).toHaveLength(6);
      expect(parsedResult.summary.success).toBe(6);
      expect(mockTools.thinkAboutPlan.execute).toHaveBeenCalled();
      expect(mockTools.suggestAlternative.execute).toHaveBeenCalled();
      expect(mockTools.improveCopy.execute).toHaveBeenCalled();
      expect(mockTools.solveProblem.execute).toHaveBeenCalled();
      expect(mockTools.searchContent.execute).toHaveBeenCalled();
      expect(mockTools.createVisual.execute).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle individual tool failures gracefully', async () => {
      mockTools.thinkAboutPlan.execute.mockRejectedValue(new Error('Tool error'));

      const input = {
        requests: [
          {
            toolName: 'think-about-plan' as const,
            input: { plan: 'Test plan' },
            requestId: 'req-1',
          },
          {
            toolName: 'search-content' as const,
            input: { query: 'Test query' },
            requestId: 'req-2',
          },
        ],
      };

      const result = await batchTool.execute(input);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.batchResults).toHaveLength(2);
      expect(parsedResult.batchResults[0].status).toBe('rejected');
      expect(parsedResult.batchResults[0].error).toBe('Tool error');
      expect(parsedResult.batchResults[1].status).toBe('fulfilled');
      expect(parsedResult.summary.success).toBe(1);
      expect(parsedResult.summary.failure).toBe(1);
    });

    it('should continue execution when some tools fail', async () => {
      mockTools.thinkAboutPlan.execute.mockRejectedValue(new Error('Error 1'));
      mockTools.solveProblem.execute.mockRejectedValue(new Error('Error 2'));

      const input = {
        requests: [
          { toolName: 'think-about-plan' as const, input: { plan: 'Plan' } },
          { toolName: 'search-content' as const, input: { query: 'Query' } },
          { toolName: 'solve-problem' as const, input: { problem: 'Problem' } },
        ],
      };

      const result = await batchTool.execute(input);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.summary.total).toBe(3);
      expect(parsedResult.summary.success).toBe(1);
      expect(parsedResult.summary.failure).toBe(2);
    });

    it('should log failures but not throw', async () => {
      mockTools.thinkAboutPlan.execute.mockRejectedValue(new Error('Tool failed'));

      const input = {
        requests: [
          {
            toolName: 'think-about-plan' as const,
            input: { plan: 'Test' },
          },
        ],
      };

      await expect(batchTool.execute(input)).resolves.toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('Result format', () => {
    it('should return properly formatted batch results', async () => {
      const input = {
        requests: [
          {
            toolName: 'think-about-plan' as const,
            input: { plan: 'Test plan' },
            requestId: 'req-1',
          },
        ],
      };

      const result = await batchTool.execute(input);

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult).toHaveProperty('batchResults');
      expect(parsedResult).toHaveProperty('summary');
      expect(parsedResult.summary).toHaveProperty('total');
      expect(parsedResult.summary).toHaveProperty('success');
      expect(parsedResult.summary).toHaveProperty('failure');
    });

    it('should include tool name in each result', async () => {
      const input = {
        requests: [
          { toolName: 'think-about-plan' as const, input: { plan: 'Plan' } },
          { toolName: 'search-content' as const, input: { query: 'Query' } },
        ],
      };

      const result = await batchTool.execute(input);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.batchResults[0].toolName).toBe('think-about-plan');
      expect(parsedResult.batchResults[1].toolName).toBe('search-content');
    });
  });

  describe('Logging', () => {
    it('should log batch execution start', async () => {
      const input = {
        requests: [
          { toolName: 'think-about-plan' as const, input: { plan: 'Plan' } },
          { toolName: 'search-content' as const, input: { query: 'Query' } },
        ],
      };

      await batchTool.execute(input);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          batchSize: 2,
          tools: ['think-about-plan', 'search-content'],
        }),
        'Executing batch consultation'
      );
    });

    it('should log batch completion with statistics', async () => {
      const input = {
        requests: [{ toolName: 'think-about-plan' as const, input: { plan: 'Plan' } }],
      };

      await batchTool.execute(input);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 1,
          success: 1,
          failure: 0,
        }),
        'Batch consultation completed'
      );
    });

    it('should log individual request execution', async () => {
      const input = {
        requests: [
          {
            toolName: 'think-about-plan' as const,
            input: { plan: 'Plan' },
            requestId: 'test-id',
          },
        ],
      };

      await batchTool.execute(input);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          toolName: 'think-about-plan',
          requestId: 'test-id',
        }),
        'Executing batch request item'
      );
    });
  });
});
