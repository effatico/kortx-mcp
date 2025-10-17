import { Perplexity } from '@perplexity-ai/perplexity_ai';
import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import { logLLMRequest, logLLMResponse, logError } from '../utils/logger.js';
import type { PerplexityRequest, PerplexityResponse, LLMError } from './types.js';

export class PerplexityClient {
  private client: Perplexity;
  private config: Config;
  private logger: Logger;

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger.child({ component: 'perplexity-client' });

    this.client = new Perplexity({
      apiKey: config.perplexity.apiKey,
      timeout: config.security.requestTimeoutMs,
    });
  }

  private buildRequestParams(request: PerplexityRequest, stream: boolean) {
    const model = request.model || this.config.perplexity.model;
    const temperature = request.temperature ?? this.config.perplexity.temperature;
    const maxTokens = request.maxTokens || this.config.perplexity.maxTokens;
    const searchMode = request.searchMode || this.config.perplexity.searchMode;

    return {
      model,
      messages: request.messages,
      temperature,
      max_tokens: maxTokens,
      search_mode: searchMode,
      top_p: request.topP,
      stream,
      disable_search: request.disableSearch,
      enable_search_classifier: request.enableSearchClassifier,
      search_domain_filter: request.searchDomainFilter,
      search_recency_filter: request.searchRecencyFilter,
      search_after_date_filter: request.searchAfterDateFilter,
      search_before_date_filter: request.searchBeforeDateFilter,
      last_updated_after_filter: request.lastUpdatedAfterFilter,
      last_updated_before_filter: request.lastUpdatedBeforeFilter,
      return_images: request.returnImages ?? this.config.perplexity.returnImages,
      return_related_questions:
        request.returnRelatedQuestions ?? this.config.perplexity.returnRelatedQuestions,
      language_preference: request.languagePreference,
      web_search_options: request.webSearchOptions
        ? {
            search_context_size: request.webSearchOptions.context_size,
            user_location: request.webSearchOptions.user_location
              ? { country: request.webSearchOptions.user_location }
              : undefined,
          }
        : undefined,
      reasoning_effort: request.reasoningEffort,
    };
  }

  async chat(request: PerplexityRequest): Promise<PerplexityResponse> {
    const model = request.model || this.config.perplexity.model;
    const startTime = Date.now();

    logLLMRequest(this.logger, model, JSON.stringify(request.messages).length);

    try {
      const response = (await this.client.chat.completions.create({
        ...this.buildRequestParams(request, false),
        stream: false,
      })) as any;

      const duration = Date.now() - startTime;

      const choice = response.choices?.[0];
      const content =
        typeof choice?.message.content === 'string'
          ? choice.message.content
          : Array.isArray(choice?.message.content)
            ? choice.message.content
                .map((chunk: any) => ('text' in chunk ? chunk.text : ''))
                .join('')
            : '';

      const perplexityResponse: PerplexityResponse = {
        content,
        model: response.model || model,
        tokensUsed: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
        finishReason: choice?.finish_reason || 'stop',
        citations: response.citations || [],
      };

      logLLMResponse(this.logger, model, perplexityResponse.tokensUsed, duration);

      return perplexityResponse;
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
  }

  async chatStream(
    request: PerplexityRequest,
    onChunk: (chunk: string) => void
  ): Promise<PerplexityResponse> {
    const model = request.model || this.config.perplexity.model;
    const startTime = Date.now();

    logLLMRequest(this.logger, model, JSON.stringify(request.messages).length);

    try {
      const stream = (await this.client.chat.completions.create({
        ...this.buildRequestParams(request, true),
        stream: true,
      })) as any;

      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let citations: string[] = [];
      let finishReason = 'stop';
      let responseModel = model;

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta;
        if (delta?.content) {
          const content =
            typeof delta.content === 'string'
              ? delta.content
              : Array.isArray(delta.content)
                ? delta.content.map((c: any) => ('text' in c ? c.text : '')).join('')
                : '';
          if (content) {
            fullContent += content;
            onChunk(content);
          }
        }

        if (chunk.choices?.[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason;
        }

        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens || 0;
          outputTokens = chunk.usage.completion_tokens || 0;
        }

        if (chunk.citations) {
          citations = chunk.citations.filter((c: any) => c !== null);
        }

        if (chunk.model) {
          responseModel = chunk.model;
        }
      }

      const duration = Date.now() - startTime;
      const totalTokens = inputTokens + outputTokens;

      const perplexityResponse: PerplexityResponse = {
        content: fullContent,
        model: responseModel,
        tokensUsed: {
          prompt: inputTokens,
          completion: outputTokens,
          total: totalTokens,
        },
        finishReason,
        citations,
      };

      logLLMResponse(this.logger, responseModel, perplexityResponse.tokensUsed, duration);

      return perplexityResponse;
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): LLMError {
    const errorObj = error as {
      message?: string;
      status?: number;
      code?: string;
      name?: string;
    };

    const llmError = new Error(errorObj.message || 'Perplexity API error') as LLMError;
    llmError.name = 'LLMError';

    if (errorObj.status) {
      llmError.status = errorObj.status;
    }

    if (errorObj.code) {
      llmError.code = errorObj.code;
    }

    // Determine if error is retryable
    llmError.retryable =
      errorObj.status === 429 || // Rate limit
      errorObj.status === 503 || // Service unavailable
      errorObj.status === 500 || // Internal server error
      errorObj.code === 'ECONNRESET' ||
      errorObj.code === 'ETIMEDOUT' ||
      errorObj.name === 'AbortError' ||
      errorObj.name === 'TimeoutError';

    return llmError;
  }
}
