import OpenAI from 'openai';
import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import { logLLMRequest, logLLMResponse, logError } from '../utils/logger.js';
import type {
  LLMRequest,
  LLMResponse,
  LLMError,
  GPTImageRequest,
  GPTImageResponse,
} from './types.js';

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
      return await this.retryWithBackoff(async () => {
        // GPT-5 uses the Responses API, not Chat Completions
        const response = (await this.client.responses.create({
          model,
          input: request.messages,
          max_output_tokens: maxTokens,
          reasoning: {
            effort: reasoningEffort,
          },
          text: {
            verbosity,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)) as any;

        const duration = Date.now() - startTime;
        const llmResponse = this.parseResponsesAPIResponse(response);

        logLLMResponse(this.logger, model, llmResponse.tokensUsed, duration);

        return llmResponse;
      });
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
      return await this.retryWithBackoff(async () => {
        // GPT-5 uses the Responses API with streaming
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      });
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

  /**
   * Retry a function with exponential backoff for network errors
   * @param fn - The function to retry
   * @param maxRetries - Maximum number of retries (from config)
   * @param baseDelay - Base delay in milliseconds (from config)
   * @returns The result of the function
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries?: number,
    baseDelay?: number
  ): Promise<T> {
    const retries = maxRetries ?? this.config.openai.maxRetries;
    const delay = baseDelay ?? this.config.openai.retryDelay;

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = (error as { code?: string }).code;

        // Only retry on network errors, not on validation or auth errors
        const isNetworkError =
          errorMessage.includes('Premature close') ||
          errorMessage.includes('ECONNRESET') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorCode === 'ECONNRESET' ||
          errorCode === 'ETIMEDOUT';

        if (isNetworkError && attempt < retries) {
          const retryDelay = delay * Math.pow(2, attempt);
          this.logger.warn(
            { attempt: attempt + 1, retryDelay, error: errorMessage },
            'Retrying request after network error'
          );
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // If not a network error or out of retries, throw immediately
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Maximum retries exceeded');
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...((usage as any)?.reasoning_tokens && {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reasoning: (usage as any).reasoning_tokens,
        }),
      },
      finishReason: completion.choices[0]?.finish_reason || 'stop',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseResponsesAPIResponse(response: any): LLMResponse {
    // Parse Responses API response format
    const outputText =
      response.output?.[0]?.type === 'message' &&
      response.output[0].content?.[0]?.type === 'output_text'
        ? response.output[0].content[0].text
        : '';
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

  private handleError(error: unknown): LLMError {
    const errorObj = error as { message?: string; status?: number; code?: string };
    let errorMessage = errorObj.message || 'OpenAI API error';

    // Handle premature close errors
    if (errorMessage.includes('Premature close')) {
      errorMessage = [
        'API connection closed prematurely. This usually indicates:',
        '1. Network instability - retry the request',
        '2. Request timeout - try reducing context size or output tokens',
        '3. API server load - wait a moment and retry',
        '',
        'Original error: ' + errorObj.message,
      ].join('\n');
    }
    // Enhance timeout error messages
    else if (errorObj.code === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
      errorMessage = `Request timed out after ${this.config.gptImage.timeout}ms. Image generation can take longer for high quality settings. Try increasing GPT_IMAGE_TIMEOUT or reducing image quality/size.`;
    }

    const llmError = new Error(errorMessage) as LLMError;
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
      errorMessage.includes('Premature close'); // Network errors

    return llmError;
  }

  /**
   * Generate images using GPT Image model via Responses API
   *
   * IMPORTANT: This uses the Responses API (responses.create) with image_generation tool,
   * NOT the direct Images API (images.generate).
   *
   * Model selection per OpenAI documentation:
   * - responses.create({ tools: [{ type: "image_generation" }] }) → model: "gpt-5"
   * - images.generate() → model: "gpt-image-1" (NOT USED in this implementation)
   *
   * @param request - GPT Image generation request
   * @returns GPT Image generation response with image data and token usage
   */
  async generateImage(request: GPTImageRequest): Promise<GPTImageResponse> {
    const model = 'gpt-5'; // GPT-5 for Responses API with image_generation tool
    const startTime = Date.now();
    const timeout = this.config.gptImage.timeout;

    this.logger.info(
      {
        model,
        promptLength: request.prompt.length,
        size: request.size,
        quality: request.quality,
        n: request.n || 1,
        timeout,
      },
      'Generating image via Responses API'
    );

    try {
      return await this.retryWithBackoff(async () => {
        // Build image_generation tool configuration
        const imageGenerationTool: Record<string, unknown> = {
          type: 'image_generation',
        };

        if (request.size) imageGenerationTool.size = request.size;
        if (request.quality) imageGenerationTool.quality = request.quality;
        if (request.background) imageGenerationTool.background = request.background;
        if (request.outputFormat) imageGenerationTool.output_format = request.outputFormat;
        if (request.outputCompression !== undefined) {
          imageGenerationTool.output_compression = request.outputCompression;
        }
        if (request.inputFidelity) imageGenerationTool.input_fidelity = request.inputFidelity;
        if (request.partialImages !== undefined)
          imageGenerationTool.partial_images = request.partialImages;

        // Use image-specific timeout for generation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = (await this.client.responses.create(
          {
            model,
            input: request.prompt,
            tools: [imageGenerationTool],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          { timeout }
        )) as any;

        const duration = Date.now() - startTime;

        // Extract image generation calls from response
        const imageGenerationCalls = (response.output || []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (output: any) => output.type === 'image_generation_call'
        );

        if (imageGenerationCalls.length === 0) {
          throw new Error('No images generated in response');
        }

        const images = imageGenerationCalls.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (call: any) => ({
            b64_json: call.result || '',
            revised_prompt: call.revised_prompt,
          })
        );

        // Track token usage including image tokens
        const usage = response.usage || {};
        const inputTokens = usage.input_tokens || 0;
        const outputTokens = usage.output_tokens || 0;

        // Log rate limiting headers if present
        this.logRateLimitInfo(response);

        this.logger.info(
          {
            model,
            imagesGenerated: images.length,
            duration,
            tokensUsed: {
              input: inputTokens,
              output: outputTokens,
              total: inputTokens + outputTokens,
            },
          },
          'Image generation complete via Responses API'
        );

        return {
          images,
          model: 'gpt-image-1',
          created: Date.now(),
        };
      });
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
  }

  /**
   * Edit an image with a prompt and optional mask using Responses API
   * @param request - Image editing request with image, prompt, and optional mask
   * @returns GPT Image response with edited image
   */
  async editImage(request: GPTImageRequest): Promise<GPTImageResponse> {
    const model = 'gpt-5'; // Use GPT-5 for Responses API with image_generation tool
    const startTime = Date.now();
    const timeout = this.config.gptImage.timeout;

    this.logger.info(
      {
        model,
        hasInputImages: !!request.inputImages,
        hasMask: !!request.inputImageMask,
        promptLength: request.prompt.length,
        inputFidelity: request.inputFidelity,
        timeout,
      },
      'Editing image via Responses API'
    );

    try {
      return await this.retryWithBackoff(async () => {
        if (!request.inputImages || request.inputImages.length === 0) {
          throw new Error('Input image is required for editing');
        }

        if (!request.prompt) {
          throw new Error('Prompt is required for editing');
        }

        // Build input with text and images
        const inputContent: unknown[] = [{ type: 'input_text', text: request.prompt }];

        // Add input images
        request.inputImages.forEach(imageData => {
          inputContent.push({
            type: 'input_image',
            image_url: imageData.startsWith('data:')
              ? imageData
              : `data:image/png;base64,${imageData}`,
          });
        });

        // Build image_generation tool configuration
        const imageGenerationTool: Record<string, unknown> = {
          type: 'image_generation',
        };

        if (request.size) imageGenerationTool.size = request.size;
        if (request.quality) imageGenerationTool.quality = request.quality;
        if (request.background) imageGenerationTool.background = request.background;
        if (request.outputFormat) imageGenerationTool.output_format = request.outputFormat;
        if (request.outputCompression !== undefined) {
          imageGenerationTool.output_compression = request.outputCompression;
        }
        if (request.inputFidelity) imageGenerationTool.input_fidelity = request.inputFidelity;
        if (request.partialImages !== undefined)
          imageGenerationTool.partial_images = request.partialImages;

        // Add mask if provided
        if (request.inputImageMask) {
          const maskData = request.inputImageMask.startsWith('data:')
            ? request.inputImageMask
            : `data:image/png;base64,${request.inputImageMask}`;
          imageGenerationTool.input_image_mask = { image_url: maskData };
        }

        // Use image-specific timeout for editing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = (await this.client.responses.create(
          {
            model,
            input: [
              {
                role: 'user',
                content: inputContent,
              },
            ],
            tools: [imageGenerationTool],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          { timeout }
        )) as any;

        const duration = Date.now() - startTime;

        // Extract image generation calls from response
        const imageGenerationCalls = (response.output || []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (output: any) => output.type === 'image_generation_call'
        );

        if (imageGenerationCalls.length === 0) {
          throw new Error('No images generated in response');
        }

        const images = imageGenerationCalls.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (call: any) => ({
            b64_json: call.result || '',
            revised_prompt: call.revised_prompt,
          })
        );

        // Track token usage including image tokens
        const usage = response.usage || {};
        const inputTokens = usage.input_tokens || 0;
        const outputTokens = usage.output_tokens || 0;

        // Log rate limiting headers if present
        this.logRateLimitInfo(response);

        this.logger.info(
          {
            model,
            imagesEdited: images.length,
            duration,
            tokensUsed: {
              input: inputTokens,
              output: outputTokens,
              total: inputTokens + outputTokens,
            },
          },
          'Image editing complete via Responses API'
        );

        return {
          images,
          model: 'gpt-image-1',
          created: Date.now(),
        };
      });
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
  }

  /**
   * Stream image generation with partial images via Responses API
   * @param request - GPT Image generation request
   * @param onPartialImage - Callback for partial image updates
   * @returns Final GPT Image response
   */
  async streamImage(
    request: GPTImageRequest,
    onPartialImage?: (imageData: string, index: number) => void
  ): Promise<GPTImageResponse> {
    const model = 'gpt-5'; // GPT-5 for Responses API with image_generation tool
    const timeout = this.config.gptImage.timeout;
    const startTime = Date.now();
    const partialImages = request.partialImages !== undefined ? request.partialImages : 0;

    this.logger.info(
      {
        model,
        promptLength: request.prompt.length,
        size: request.size,
        quality: request.quality,
        partialImages,
        timeout,
      },
      'Streaming image generation via Responses API'
    );

    try {
      return await this.retryWithBackoff(async () => {
        // Build image_generation tool configuration
        const imageGenerationTool: Record<string, unknown> = {
          type: 'image_generation',
          partial_images: partialImages,
        };

        if (request.size) imageGenerationTool.size = request.size;
        if (request.quality) imageGenerationTool.quality = request.quality;
        if (request.background) imageGenerationTool.background = request.background;
        if (request.outputFormat) imageGenerationTool.output_format = request.outputFormat;
        if (request.outputCompression !== undefined) {
          imageGenerationTool.output_compression = request.outputCompression;
        }
        if (request.inputFidelity) imageGenerationTool.input_fidelity = request.inputFidelity;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stream = (await this.client.responses.create(
          {
            model,
            input: request.prompt,
            stream: true,
            tools: [imageGenerationTool],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          { timeout }
        )) as unknown as AsyncIterable<any>;

        const finalImages: Array<{ b64_json: string; revised_prompt?: string }> = [];
        let inputTokens = 0;
        let outputTokens = 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for await (const event of stream) {
          // Handle partial image events
          if (event.type === 'response.image_generation_call.partial_image' && onPartialImage) {
            const partialImageData = event.partial_image_b64 || '';
            const partialIndex = event.partial_image_index || 0;
            onPartialImage(partialImageData, partialIndex);
          }

          // Handle final image generation call
          if (event.type === 'response.image_generation_call.done') {
            finalImages.push({
              b64_json: event.result || '',
              revised_prompt: event.revised_prompt,
            });
          }

          // Capture token usage
          if (event.type === 'response.done' && event.response?.usage) {
            inputTokens = event.response.usage.input_tokens || 0;
            outputTokens = event.response.usage.output_tokens || 0;
          }
        }

        const duration = Date.now() - startTime;

        this.logger.info(
          {
            model,
            imagesGenerated: finalImages.length,
            duration,
            tokensUsed: {
              input: inputTokens,
              output: outputTokens,
              total: inputTokens + outputTokens,
            },
          },
          'Image streaming complete via Responses API'
        );

        return {
          images: finalImages,
          model: 'gpt-image-1',
          created: Date.now(),
        };
      });
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
  }

  /**
   * Log rate limiting information from response headers
   * @param response - API response object
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logRateLimitInfo(response: any): void {
    // Check if response has rate limit headers (available in some API responses)
    const headers = response.headers || response._headers || {};

    if (headers['x-ratelimit-remaining-tokens']) {
      const remainingTokens = parseInt(headers['x-ratelimit-remaining-tokens'], 10);
      const limitTokens = parseInt(headers['x-ratelimit-limit-tokens'] || '0', 10);

      if (limitTokens > 0) {
        const usagePercent = ((limitTokens - remainingTokens) / limitTokens) * 100;

        if (usagePercent > 80) {
          this.logger.warn(
            {
              remainingTokens,
              limitTokens,
              usagePercent: usagePercent.toFixed(2),
            },
            'Approaching rate limit threshold'
          );
        }
      }
    }

    if (headers['x-ratelimit-remaining-requests']) {
      const remainingRequests = parseInt(headers['x-ratelimit-remaining-requests'], 10);
      const limitRequests = parseInt(headers['x-ratelimit-limit-requests'] || '0', 10);

      if (limitRequests > 0 && remainingRequests < limitRequests * 0.2) {
        this.logger.warn(
          {
            remainingRequests,
            limitRequests,
          },
          'Low remaining request quota'
        );
      }
    }
  }
}
