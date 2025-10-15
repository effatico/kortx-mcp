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
      timeout: 60000, // 60 seconds
    });
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || this.config.openai.model;
    const reasoningEffort = request.reasoningEffort || this.config.openai.reasoningEffort;
    const maxTokens = request.maxTokens || this.config.openai.maxTokens;
    const temperature = request.temperature ?? this.config.openai.temperature;

    const startTime = Date.now();

    logLLMRequest(this.logger, model, JSON.stringify(request.messages).length);

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: request.messages,
        max_tokens: maxTokens,
        temperature,
        // GPT-5 specific parameters
        ...(model.startsWith('gpt-5') && {
          reasoning_effort: reasoningEffort,
        }),
      } as any); // Type assertion due to potential SDK version differences

      const duration = Date.now() - startTime;
      const response = this.parseResponse(completion);

      logLLMResponse(this.logger, model, response.tokensUsed, duration);

      return response;
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
  }

  async chatStream(request: LLMRequest, onChunk: (chunk: string) => void): Promise<LLMResponse> {
    const model = request.model || this.config.openai.model;
    const reasoningEffort = request.reasoningEffort || this.config.openai.reasoningEffort;
    const maxTokens = request.maxTokens || this.config.openai.maxTokens;
    const temperature = request.temperature ?? this.config.openai.temperature;

    const startTime = Date.now();

    logLLMRequest(this.logger, model, JSON.stringify(request.messages).length);

    try {
      const stream = (await this.client.chat.completions.create({
        model,
        messages: request.messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        ...(model.startsWith('gpt-5') && {
          reasoning_effort: reasoningEffort,
        }),
      } as any)) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

      let fullContent = '';
      let promptTokens = 0;
      let completionTokens = 0;
      let reasoningTokens = 0;
      let finishReason = 'stop';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          onChunk(delta);
        }

        // Track finish reason
        if (chunk.choices[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason;
        }

        // Note: Token counts typically only available at the end of stream
        if (chunk.usage) {
          promptTokens = chunk.usage.prompt_tokens || 0;
          completionTokens = chunk.usage.completion_tokens || 0;
          reasoningTokens = (chunk.usage as any).reasoning_tokens || 0;
        }
      }

      const duration = Date.now() - startTime;
      const totalTokens = promptTokens + completionTokens + reasoningTokens;

      const response: LLMResponse = {
        content: fullContent,
        model,
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: totalTokens,
          ...(reasoningTokens > 0 && { reasoning: reasoningTokens }),
        },
        finishReason,
      };

      logLLMResponse(this.logger, model, response.tokensUsed, duration);

      return response;
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
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
