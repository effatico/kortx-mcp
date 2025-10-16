import OpenAI from 'openai';
import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import { logLLMRequest, logLLMResponse, logError } from '../utils/logger.js';
import type { LLMRequest, LLMResponse, LLMError } from './types.js';

export class OpenAIClient {
  private client: OpenAI;
  private config: Config;
  private logger: Logger;

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger.child({ component: 'openai-client' });

    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      maxRetries: 3,
      timeout: config.security.requestTimeoutMs,
    });
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || this.config.openai.model;
    const reasoningEffort = this.adjustReasoningEffort(
      model,
      request.reasoningEffort || this.config.openai.reasoningEffort
    );
    const maxTokens = request.maxTokens || this.config.openai.maxTokens;
    const verbosity = this.config.openai.verbosity;

    const startTime = Date.now();

    logLLMRequest(this.logger, model, JSON.stringify(request.messages).length);

    try {
      // GPT-5 uses the Responses API, not Chat Completions
      const response = await this.client.responses.create({
        model,
        input: request.messages,
        max_output_tokens: maxTokens,
        reasoning: {
          effort: reasoningEffort,
        },
        text: {
          verbosity,
        },
      } as any); // Type assertion due to potential SDK version differences

      const duration = Date.now() - startTime;
      const llmResponse = this.parseResponsesAPIResponse(response);

      logLLMResponse(this.logger, model, llmResponse.tokensUsed, duration);

      return llmResponse;
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
  }

  async chatStream(request: LLMRequest, onChunk: (chunk: string) => void): Promise<LLMResponse> {
    const model = request.model || this.config.openai.model;
    const reasoningEffort = this.adjustReasoningEffort(
      model,
      request.reasoningEffort || this.config.openai.reasoningEffort
    );
    const maxTokens = request.maxTokens || this.config.openai.maxTokens;
    const verbosity = this.config.openai.verbosity;

    const startTime = Date.now();

    logLLMRequest(this.logger, model, JSON.stringify(request.messages).length);

    try {
      // GPT-5 uses the Responses API with streaming
      const stream = (await this.client.responses.create({
        model,
        input: request.messages,
        max_output_tokens: maxTokens,
        stream: true,
        reasoning: {
          effort: reasoningEffort,
        },
        text: {
          verbosity,
        },
      } as any)) as unknown as AsyncIterable<any>;

      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let reasoningTokens = 0;

      for await (const event of stream) {
        // Handle Responses API streaming events
        if (event.type === 'response.output_text.delta') {
          const delta = event.delta || '';
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
        }

        // Token counts typically available at the end
        if (event.type === 'response.done' && event.response?.usage) {
          inputTokens = event.response.usage.input_tokens || 0;
          outputTokens = event.response.usage.output_tokens || 0;
          reasoningTokens = event.response.usage.reasoning_tokens || 0;
        }
      }

      const duration = Date.now() - startTime;
      const totalTokens = inputTokens + outputTokens + reasoningTokens;

      const response: LLMResponse = {
        content: fullContent,
        model,
        tokensUsed: {
          prompt: inputTokens,
          completion: outputTokens,
          total: totalTokens,
          ...(reasoningTokens > 0 && { reasoning: reasoningTokens }),
        },
        finishReason: 'stop',
      };

      logLLMResponse(this.logger, model, response.tokensUsed, duration);

      return response;
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
  }

  private adjustReasoningEffort(model: string, reasoningEffort: string): string {
    if (model === 'gpt-5-codex' && reasoningEffort === 'minimal') {
      this.logger.debug(
        { model, originalEffort: 'minimal', adjustedEffort: 'low' },
        'Adjusted reasoning effort for gpt-5-codex'
      );
      return 'low';
    }
    return reasoningEffort;
  }

  private parseResponse(completion: OpenAI.Chat.Completions.ChatCompletion): LLMResponse {
    const message = completion.choices[0]?.message;
    const usage = completion.usage;

    return {
      content: message?.content || '',
      model: completion.model,
      tokensUsed: {
        prompt: usage?.prompt_tokens || 0,
        completion: usage?.completion_tokens || 0,
        total: usage?.total_tokens || 0,
        ...((usage as any)?.reasoning_tokens && {
          reasoning: (usage as any).reasoning_tokens,
        }),
      },
      finishReason: completion.choices[0]?.finish_reason || 'stop',
      ...((message as any)?.reasoning_content && {
        reasoningContent: (message as any).reasoning_content,
      }),
    };
  }

  private parseResponsesAPIResponse(response: any): LLMResponse {
    // Parse Responses API response format
    const outputText = response.output_text || '';
    const usage = response.usage;

    return {
      content: outputText,
      model: response.model || 'gpt-5',
      tokensUsed: {
        prompt: usage?.input_tokens || 0,
        completion: usage?.output_tokens || 0,
        total: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
        ...(usage?.reasoning_tokens && {
          reasoning: usage.reasoning_tokens,
        }),
      },
      finishReason: 'stop',
    };
  }

  private handleError(error: any): LLMError {
    const llmError = new Error(error.message || 'OpenAI API error') as LLMError;
    llmError.name = 'LLMError';

    if (error.status) {
      llmError.status = error.status;
    }

    if (error.code) {
      llmError.code = error.code;
    }

    // Determine if error is retryable
    llmError.retryable =
      error.status === 429 || // Rate limit
      error.status === 503 || // Service unavailable
      error.status === 500 || // Internal server error
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT';

    return llmError;
  }
}
