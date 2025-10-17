import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchContentTool, SearchContentInputSchema } from './search-content.js';
import { PerplexityClient } from '../llm/perplexity-client.js';
import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import type { PerplexityResponse } from '../llm/types.js';

describe('SearchContentTool', () => {
  let tool: SearchContentTool;
  let mockConfig: Config;
  let mockLogger: Logger;
  let mockPerplexityClient: PerplexityClient;

  beforeEach(() => {
    // Create mock config
    mockConfig = {
      openai: {
        apiKey: 'test-openai-key',
        model: 'gpt-5-mini',
        reasoningEffort: 'minimal',
        verbosity: 'low',
        maxTokens: 1024,
      },
      perplexity: {
        apiKey: 'test-perplexity-key',
        model: 'sonar',
        temperature: 0.2,
        maxTokens: 4096,
        searchMode: 'web',
        returnImages: false,
        returnRelatedQuestions: false,
      },
      server: {
        name: 'kortx-mcp',
        version: '1.0.0',
        logLevel: 'info',
        transport: 'stdio',
        port: 3000,
      },
      context: {
        enableSerena: true,
        enableMemory: true,
        enableCclsp: true,
        maxContextTokens: 32000,
        includeFileContent: true,
        includeGitHistory: false,
      },
      security: {
        enableRateLimiting: true,
        maxRequestsPerHour: 100,
        maxTokensPerRequest: 50000,
        maxTokensPerHour: 500000,
        requestTimeoutMs: 60000,
        maxInputSize: 100000,
      },
    } as Config;

    // Create mock logger
    mockLogger = {
      child: vi.fn().mockReturnThis(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    // Create mock PerplexityClient
    mockPerplexityClient = {
      chat: vi.fn(),
      chatStream: vi.fn(),
    } as unknown as PerplexityClient;

    tool = new SearchContentTool(mockConfig, mockLogger, mockPerplexityClient);
  });

  describe('Input Schema Validation', () => {
    it('should validate required query field', () => {
      const result = SearchContentInputSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('query');
      }
    });

    it('should reject empty query string', () => {
      const result = SearchContentInputSchema.safeParse({ query: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should accept valid query with all optional fields', () => {
      const input = {
        query: 'What is Perplexity AI?',
        model: 'sonar-pro',
        searchMode: 'web',
        searchRecencyFilter: 'week',
        searchDomainFilter: ['perplexity.ai'],
        returnImages: true,
        returnRelatedQuestions: true,
        reasoningEffort: 'medium',
      };
      const result = SearchContentInputSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('should accept query-only input', () => {
      const input = { query: 'test query' };
      const result = SearchContentInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate model enum values', () => {
      const result = SearchContentInputSchema.safeParse({
        query: 'test',
        model: 'invalid-model',
      });
      expect(result.success).toBe(false);
    });

    it('should validate searchMode enum values', () => {
      const result = SearchContentInputSchema.safeParse({
        query: 'test',
        searchMode: 'invalid-mode',
      });
      expect(result.success).toBe(false);
    });

    it('should validate searchRecencyFilter enum values', () => {
      const result = SearchContentInputSchema.safeParse({
        query: 'test',
        searchRecencyFilter: 'invalid-filter',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('execute', () => {
    it('should execute search with minimal input', async () => {
      const mockResponse: PerplexityResponse = {
        content: 'Test search result',
        model: 'sonar',
        tokensUsed: {
          prompt: 50,
          completion: 100,
          total: 150,
        },
        finishReason: 'stop',
        citations: ['https://example.com'],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({ query: 'test query' });

      expect(mockPerplexityClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'test query' }),
          ]),
          model: 'sonar',
          searchMode: 'web',
        })
      );

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Test search result');
      expect(result.content[0].text).toContain('Citations:');
      expect(result.content[0].text).toContain('https://example.com');
    });

    it('should use custom model when provided', async () => {
      const mockResponse: PerplexityResponse = {
        content: 'Test search result',
        model: 'sonar-pro',
        tokensUsed: { prompt: 50, completion: 100, total: 150 },
        finishReason: 'stop',
        citations: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);

      await tool.execute({
        query: 'test query',
        model: 'sonar-pro',
      });

      expect(mockPerplexityClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'sonar-pro',
        })
      );
    });

    it('should pass search parameters correctly', async () => {
      const mockResponse: PerplexityResponse = {
        content: 'Test search result',
        model: 'sonar',
        tokensUsed: { prompt: 50, completion: 100, total: 150 },
        finishReason: 'stop',
        citations: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);

      await tool.execute({
        query: 'test query',
        searchMode: 'academic',
        searchRecencyFilter: 'month',
        searchDomainFilter: ['scholar.google.com'],
        returnImages: true,
        returnRelatedQuestions: true,
      });

      expect(mockPerplexityClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          searchMode: 'academic',
          searchRecencyFilter: 'month',
          searchDomainFilter: ['scholar.google.com'],
          returnImages: true,
          returnRelatedQuestions: true,
        })
      );
    });

    it('should pass reasoning effort for deep-research model', async () => {
      const mockResponse: PerplexityResponse = {
        content: 'Deep research result',
        model: 'sonar-deep-research',
        tokensUsed: { prompt: 100, completion: 500, total: 600 },
        finishReason: 'stop',
        citations: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);

      await tool.execute({
        query: 'complex research question',
        model: 'sonar-deep-research',
        reasoningEffort: 'high',
      });

      expect(mockPerplexityClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'sonar-deep-research',
          reasoningEffort: 'high',
        })
      );
    });

    it('should format response with citations', async () => {
      const mockResponse: PerplexityResponse = {
        content: 'Search result with sources',
        model: 'sonar',
        tokensUsed: { prompt: 50, completion: 100, total: 150 },
        finishReason: 'stop',
        citations: ['https://example1.com', 'https://example2.com', 'https://example3.com'],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({ query: 'test query' });

      expect(result.content[0].text).toContain('Citations:');
      expect(result.content[0].text).toContain('1. https://example1.com');
      expect(result.content[0].text).toContain('2. https://example2.com');
      expect(result.content[0].text).toContain('3. https://example3.com');
      expect(result.content[0].text).toContain('Sources: 3 citations');
    });

    it('should format response without citations when not available', async () => {
      const mockResponse: PerplexityResponse = {
        content: 'Search result',
        model: 'sonar',
        tokensUsed: { prompt: 50, completion: 100, total: 150 },
        finishReason: 'stop',
        citations: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({ query: 'test query' });

      expect(result.content[0].text).not.toContain('Citations:');
      expect(result.content[0].text).not.toContain('Sources:');
    });

    it('should include metadata in response', async () => {
      const mockResponse: PerplexityResponse = {
        content: 'Search result',
        model: 'sonar-pro',
        tokensUsed: { prompt: 50, completion: 100, total: 150 },
        finishReason: 'stop',
        citations: ['https://example.com'],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({
        query: 'test query',
        model: 'sonar-pro',
        searchMode: 'academic',
      });

      expect(result.content[0].text).toContain('Search Metadata:');
      expect(result.content[0].text).toContain('Model: sonar-pro');
      expect(result.content[0].text).toContain('Search Mode: academic');
      expect(result.content[0].text).toContain('Duration:');
      expect(result.content[0].text).toContain('Tokens Used: 150');
      expect(result.content[0].text).toContain('Estimated Cost:');
    });

    it('should calculate cost correctly for different models', async () => {
      const mockResponse: PerplexityResponse = {
        content: 'Search result',
        model: 'sonar-pro',
        tokensUsed: { prompt: 1000000, completion: 1000000, total: 2000000 },
        finishReason: 'stop',
        citations: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({
        query: 'test query',
        model: 'sonar-pro',
      });

      // sonar-pro: $3 input + $15 output per 1M tokens
      // 1M input + 1M output = $3 + $15 = $18
      expect(result.content[0].text).toContain('$18.000000');
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      vi.mocked(mockPerplexityClient.chat).mockRejectedValue(error);

      await expect(tool.execute({ query: 'test query' })).rejects.toThrow('API Error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error,
          query: 'test query',
        }),
        'Search failed'
      );
    });

    it('should log search execution', async () => {
      const mockResponse: PerplexityResponse = {
        content: 'Search result',
        model: 'sonar',
        tokensUsed: { prompt: 50, completion: 100, total: 150 },
        finishReason: 'stop',
        citations: ['https://example.com'],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);

      await tool.execute({ query: 'test query' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          tool: 'search-content',
          query: 'test query',
        }),
        'Executing search'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'sonar',
          tokensUsed: 150,
          citations: 1,
        }),
        'Search complete'
      );
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate cost for sonar model', async () => {
      const mockResponse: PerplexityResponse = {
        content: 'Result',
        model: 'sonar',
        tokensUsed: { prompt: 1000000, completion: 1000000, total: 2000000 },
        finishReason: 'stop',
        citations: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({ query: 'test' });

      // sonar: $1 input + $1 output per 1M tokens = $2
      expect(result.content[0].text).toContain('$2.000000');
    });

    it('should calculate cost for sonar-deep-research model', async () => {
      const mockResponse: PerplexityResponse = {
        content: 'Result',
        model: 'sonar-deep-research',
        tokensUsed: { prompt: 1000000, completion: 1000000, total: 2000000 },
        finishReason: 'stop',
        citations: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({
        query: 'test',
        model: 'sonar-deep-research',
      });

      // sonar-deep-research: $5 input + $30 output per 1M tokens = $35
      expect(result.content[0].text).toContain('$35.000000');
    });
  });
});
