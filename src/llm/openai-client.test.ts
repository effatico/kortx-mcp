import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIClient } from '../../src/llm/openai-client.js';
import type { Config } from '../../src/config/index.js';
import type { Logger } from '../../src/utils/logger.js';
import type { LLMRequest } from '../../src/llm/types.js';

// Mock OpenAI SDK
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      responses: {
        create: vi.fn(),
      },
    })),
  };
});

describe('OpenAIClient', () => {
  let client: OpenAIClient;
  let mockConfig: Config;
  let mockLogger: Logger;

  beforeEach(() => {
    // Create mock config
    mockConfig = {
      openai: {
        apiKey: 'test-api-key',
        model: 'gpt-5-mini',
        reasoningEffort: 'minimal',
        verbosity: 'low',
        maxTokens: 1024,
      },
      server: {
        name: 'llm-consultants',
        version: '1.0.0',
        logLevel: 'info',
        transport: 'stdio',
      },
      context: {
        maxTokens: 4096,
        sources: {
          file: { enabled: true },
          serena: { enabled: true },
          memory: { enabled: true },
          cclsp: { enabled: true },
        },
      },
    } as Config;

    // Create mock logger
    mockLogger = {
      child: vi.fn().mockReturnThis(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;

    client = new OpenAIClient(mockConfig, mockLogger);
  });

  describe('chat', () => {
    it('should call OpenAI Responses API with correct parameters', async () => {
      const mockResponse = {
        output_text: 'Test response',
        model: 'gpt-5-mini',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          reasoning_tokens: 0,
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.responses.create = mockCreate;

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      const response = await client.chat(request);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-5-mini',
        input: request.messages,
        max_output_tokens: 1024,
        reasoning: {
          effort: 'minimal',
        },
        text: {
          verbosity: 'low',
        },
      });

      expect(response.content).toBe('Test response');
      expect(response.model).toBe('gpt-5-mini');
      expect(response.tokensUsed.prompt).toBe(100);
      expect(response.tokensUsed.completion).toBe(50);
      expect(response.tokensUsed.total).toBe(150);
    });

    it('should use custom model from request', async () => {
      const mockResponse = {
        output_text: 'Test response',
        model: 'gpt-5',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.responses.create = mockCreate;

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
        model: 'gpt-5',
      };

      await client.chat(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-5',
        })
      );
    });

    it('should use custom reasoning effort from request', async () => {
      const mockResponse = {
        output_text: 'Test response',
        model: 'gpt-5-mini',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.responses.create = mockCreate;

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
        reasoningEffort: 'high',
      };

      await client.chat(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reasoning: {
            effort: 'high',
          },
        })
      );
    });

    it('should use custom max tokens from request', async () => {
      const mockResponse = {
        output_text: 'Test response',
        model: 'gpt-5-mini',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.responses.create = mockCreate;

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
        maxTokens: 2048,
      };

      await client.chat(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_output_tokens: 2048,
        })
      );
    });

    it('should handle reasoning tokens in response', async () => {
      const mockResponse = {
        output_text: 'Test response',
        model: 'gpt-5',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          reasoning_tokens: 200,
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.responses.create = mockCreate;

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      const response = await client.chat(request);

      expect(response.tokensUsed.reasoning).toBe(200);
      expect(response.tokensUsed.total).toBe(150); // input + output only
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');
      (mockError as any).status = 500;

      const mockCreate = vi.fn().mockRejectedValue(mockError);
      (client as any).client.responses.create = mockCreate;

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      await expect(client.chat(request)).rejects.toThrow('API Error');
    });

    it('should mark rate limit errors as retryable', async () => {
      const mockError = new Error('Rate limit exceeded');
      (mockError as any).status = 429;

      const mockCreate = vi.fn().mockRejectedValue(mockError);
      (client as any).client.responses.create = mockCreate;

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      try {
        await client.chat(request);
      } catch (error: any) {
        expect(error.retryable).toBe(true);
        expect(error.status).toBe(429);
      }
    });
  });

  describe('chatStream', () => {
    it('should stream responses correctly', async () => {
      const mockEvents = [
        { type: 'response.output_text.delta', delta: 'Hello ' },
        { type: 'response.output_text.delta', delta: 'world' },
        {
          type: 'response.done',
          response: {
            usage: {
              input_tokens: 10,
              output_tokens: 20,
              reasoning_tokens: 5,
            },
          },
        },
      ];

      const mockStream = (async function* () {
        for (const event of mockEvents) {
          yield event;
        }
      })();

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      (client as any).client.responses.create = mockCreate;

      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      const response = await client.chatStream(request, onChunk);

      expect(chunks).toEqual(['Hello ', 'world']);
      expect(response.content).toBe('Hello world');
      expect(response.tokensUsed.prompt).toBe(10);
      expect(response.tokensUsed.completion).toBe(20);
      expect(response.tokensUsed.reasoning).toBe(5);
    });

    it('should handle empty deltas', async () => {
      const mockEvents = [
        { type: 'response.output_text.delta', delta: '' },
        { type: 'response.output_text.delta', delta: 'test' },
        {
          type: 'response.done',
          response: {
            usage: {
              input_tokens: 10,
              output_tokens: 10,
            },
          },
        },
      ];

      const mockStream = (async function* () {
        for (const event of mockEvents) {
          yield event;
        }
      })();

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      (client as any).client.responses.create = mockCreate;

      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test message' }],
      };

      const response = await client.chatStream(request, onChunk);

      expect(chunks).toEqual(['test']);
      expect(response.content).toBe('test');
    });
  });
});
