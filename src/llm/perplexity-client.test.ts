import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PerplexityClient } from './perplexity-client.js';
import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import type { PerplexityRequest } from './types.js';

// Mock the Perplexity SDK
vi.mock('@perplexity-ai/perplexity_ai', () => {
  const mockCreate = vi.fn();
  return {
    Perplexity: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe('PerplexityClient', () => {
  let client: PerplexityClient;
  let mockConfig: Config;
  let mockLogger: Logger;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
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

    client = new PerplexityClient(mockConfig, mockLogger);

    // Get the mocked create function
    const { Perplexity } = await import('@perplexity-ai/perplexity_ai');
    const mockPerplexity = new Perplexity({ apiKey: 'test' });
    mockCreate = mockPerplexity.chat.completions.create as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('chat', () => {
    it('should call Perplexity API with correct parameters', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'sonar',
        created: Date.now(),
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Test response',
            },
            finish_reason: 'stop',
          },
        ],
        citations: ['https://example.com'],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: PerplexityRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      const response = await client.chat(request);

      expect(mockCreate).toHaveBeenCalled();
      expect(response.content).toBe('Test response');
      expect(response.model).toBe('sonar');
      expect(response.tokensUsed.prompt).toBe(100);
      expect(response.tokensUsed.completion).toBe(50);
      expect(response.tokensUsed.total).toBe(150);
      expect(response.citations).toEqual(['https://example.com']);
    });

    it('should use custom model from request', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'sonar-pro',
        created: Date.now(),
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Test response',
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: PerplexityRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
        model: 'sonar-pro',
      };

      await client.chat(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'sonar-pro',
        })
      );
    });

    it('should pass Perplexity-specific parameters', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'sonar',
        created: Date.now(),
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Test response',
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: PerplexityRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
        searchMode: 'academic',
        returnImages: true,
        returnRelatedQuestions: true,
        searchDomainFilter: ['scholar.google.com'],
        searchRecencyFilter: 'week',
      };

      await client.chat(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          search_mode: 'academic',
          return_images: true,
          return_related_questions: true,
          search_domain_filter: ['scholar.google.com'],
          search_recency_filter: 'week',
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('Internal Server Error'));

      const request: PerplexityRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      await expect(client.chat(request)).rejects.toThrow('Internal Server Error');
    });

    it('should mark rate limit errors as retryable', async () => {
      const error = new Error('Rate limit exceeded') as Error & { status: number };
      error.status = 429;

      mockCreate.mockRejectedValue(error);

      const request: PerplexityRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      try {
        await client.chat(request);
      } catch (error: unknown) {
        const llmError = error as { retryable?: boolean; status?: number };
        expect(llmError.retryable).toBe(true);
        expect(llmError.status).toBe(429);
      }
    });

    it('should handle responses without optional fields', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'sonar',
        created: Date.now(),
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Test response',
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const request: PerplexityRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      const response = await client.chat(request);

      expect(response.citations).toEqual([]);
    });
  });

  describe('chatStream', () => {
    it('should stream responses correctly', async () => {
      const mockEvents = [
        {
          choices: [{ index: 0, delta: { content: 'Hello ' } }],
        },
        {
          choices: [{ index: 0, delta: { content: 'world' } }],
        },
        {
          choices: [{ index: 0, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          model: 'sonar',
        },
      ];

      const asyncIterator = (async function* () {
        for (const event of mockEvents) {
          yield event;
        }
      })();

      mockCreate.mockResolvedValue(asyncIterator);

      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const request: PerplexityRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      const response = await client.chatStream(request, onChunk);

      expect(chunks).toEqual(['Hello ', 'world']);
      expect(response.content).toBe('Hello world');
      expect(response.tokensUsed.prompt).toBe(10);
      expect(response.tokensUsed.completion).toBe(20);
    });

    it('should handle citations in streaming', async () => {
      const mockEvents = [
        {
          choices: [{ index: 0, delta: { content: 'Test' } }],
          id: 'test-id',
          created: Date.now(),
          model: 'sonar',
        },
        {
          citations: ['https://example.com'],
          choices: [],
          id: 'test-id',
          created: Date.now(),
          model: 'sonar',
        },
        {
          choices: [{ index: 0, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
          model: 'sonar',
          id: 'test-id',
          created: Date.now(),
        },
      ];

      const asyncIterator = (async function* () {
        for (const event of mockEvents) {
          yield event;
        }
      })();

      mockCreate.mockResolvedValue(asyncIterator);

      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const request: PerplexityRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      const response = await client.chatStream(request, onChunk);

      expect(response.citations).toEqual(['https://example.com']);
    });

    it('should handle empty deltas', async () => {
      const mockEvents = [
        {
          choices: [{ index: 0, delta: { content: '' } }],
        },
        {
          choices: [{ index: 0, delta: { content: 'test' } }],
        },
        {
          choices: [{ index: 0, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
          model: 'sonar',
        },
      ];

      const asyncIterator = (async function* () {
        for (const event of mockEvents) {
          yield event;
        }
      })();

      mockCreate.mockResolvedValue(asyncIterator);

      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const request: PerplexityRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      const response = await client.chatStream(request, onChunk);

      expect(chunks).toEqual(['test']);
      expect(response.content).toBe('test');
    });

    it('should handle streaming errors', async () => {
      mockCreate.mockRejectedValue(new Error('Internal Server Error'));

      const request: PerplexityRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      await expect(client.chatStream(request, () => {})).rejects.toThrow('Internal Server Error');
    });
  });
});
