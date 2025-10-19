import OpenAI from 'openai';
import type { Uploadable } from 'openai/uploads';
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
    const llmError = new Error(errorObj.message || 'OpenAI API error') as LLMError;
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
      errorObj.code === 'ETIMEDOUT';

    return llmError;
  }

  /**
   * Generate images using GPT Image model via OpenAI SDK
   * @param request - GPT Image generation request
   * @returns GPT Image generation response with image data and token usage
   */
  async generateImage(request: GPTImageRequest): Promise<GPTImageResponse> {
    const model = request.model || 'gpt-image-1';
    const startTime = Date.now();

    this.logger.info(
      {
        model,
        promptLength: request.prompt.length,
        size: request.size,
        quality: request.quality,
        n: request.n || 1,
      },
      'Generating image'
    );

    try {
      const response = await this.client.images.generate({
        model,
        prompt: request.prompt,
        n: request.n,
        size: request.size,
        quality: request.quality,
        background: request.background,
        output_format: request.outputFormat,
        output_compression: request.outputCompression,
        moderation: 'auto', // Always use auto moderation
      });

      const duration = Date.now() - startTime;
      const data = response.data || [];

      this.logger.info(
        {
          model,
          imagesGenerated: data.length,
          duration,
          tokensUsed: response.usage,
        },
        'Image generation complete'
      );

      return {
        images: data.map(item => ({
          b64_json: item.b64_json || '',
          revised_prompt: item.revised_prompt,
        })),
        model: model,
        created: response.created,
      };
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
  }

  /**
   * Create variations of an existing image using OpenAI SDK
   * @param request - Image variation request with input image
   * @returns GPT Image response with variations
   */
  async createVariation(request: GPTImageRequest): Promise<GPTImageResponse> {
    const model = request.model || 'dall-e-2'; // Variations only support dall-e-2
    const startTime = Date.now();

    this.logger.info(
      {
        model,
        hasInputImages: !!request.inputImages,
        n: request.n || 1,
      },
      'Creating image variations'
    );

    try {
      if (!request.inputImages || request.inputImages.length === 0) {
        throw new Error('Input images are required for creating variations');
      }

      const response = await this.client.images.createVariation({
        image: this.base64ToUploadable(request.inputImages[0]),
        n: request.n,
        size: request.size as '256x256' | '512x512' | '1024x1024' | null,
        response_format: 'b64_json',
      });

      const duration = Date.now() - startTime;
      const data = response.data || [];

      this.logger.info(
        {
          model,
          variationsCreated: data.length,
          duration,
        },
        'Image variations created'
      );

      return {
        images: data.map(item => ({
          b64_json: item.b64_json || '',
          revised_prompt: item.revised_prompt,
        })),
        model: 'dall-e-2',
        created: response.created,
      };
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
  }

  /**
   * Edit an image with a prompt and optional mask using OpenAI SDK
   * @param request - Image editing request with image, prompt, and optional mask
   * @returns GPT Image response with edited image
   */
  async editImage(request: GPTImageRequest): Promise<GPTImageResponse> {
    const model = request.model || 'gpt-image-1';
    const startTime = Date.now();

    this.logger.info(
      {
        model,
        hasInputImages: !!request.inputImages,
        hasMask: !!request.inputImageMask,
        promptLength: request.prompt.length,
      },
      'Editing image'
    );

    try {
      if (!request.inputImages || request.inputImages.length === 0) {
        throw new Error('Input image is required for editing');
      }

      if (!request.prompt) {
        throw new Error('Prompt is required for editing');
      }

      // Convert input images to uploadable format
      const imageUploads = request.inputImages.map(img => this.base64ToUploadable(img));

      const response = await this.client.images.edit({
        image: imageUploads.length === 1 ? imageUploads[0] : imageUploads,
        prompt: request.prompt,
        mask: request.inputImageMask ? this.base64ToUploadable(request.inputImageMask) : undefined,
        model,
        n: request.n,
        size: request.size,
        quality: request.quality,
        background: request.background,
      });

      const duration = Date.now() - startTime;
      const data = response.data || [];

      this.logger.info(
        {
          model,
          imagesEdited: data.length,
          duration,
          tokensUsed: response.usage,
        },
        'Image editing complete'
      );

      return {
        images: data.map(item => ({
          b64_json: item.b64_json || '',
          revised_prompt: item.revised_prompt,
        })),
        model: model,
        created: response.created,
      };
    } catch (error) {
      logError(this.logger, error as Error, { model, request });
      throw this.handleError(error);
    }
  }

  /**
   * Convert base64 string to OpenAI SDK Uploadable type
   * @param base64 - Base64 encoded image string (with or without data URI prefix)
   * @returns Uploadable (File or Buffer)
   */
  private base64ToUploadable(base64: string): Uploadable {
    // Remove data URI prefix if present (e.g., "data:image/png;base64,")
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Create a File object from the buffer for OpenAI SDK
    const blob = new Blob([buffer], { type: 'image/png' });
    return new File([blob], 'image.png', { type: 'image/png' });
  }
}
