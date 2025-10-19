import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  SIZE_OPTIONS,
  QUALITY_OPTIONS,
  BACKGROUND_OPTIONS,
  OUTPUT_FORMAT_OPTIONS,
  INPUT_FIDELITY_OPTIONS,
  COMPRESSION_MIN,
  COMPRESSION_MAX,
  IMAGE_COUNT_MIN,
  IMAGE_COUNT_MAX,
  VISUAL_SEARCH_MODES,
  SEARCH_RECENCY_OPTIONS,
  type ImageFormat,
} from './gpt-image-constants.js';

/**
 * Visual generation modes
 */
export const VisualMode = z.enum(['generate', 'edit', 'search']);
export type VisualModeType = z.infer<typeof VisualMode>;

/**
 * Base schema with common fields
 */
const BaseVisualSchema = z.object({
  mode: VisualMode.describe(
    'Operation mode: generate new images, edit existing images, or search for visual inspiration'
  ),
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .describe('Text description of the desired visual'),

  // GPT Image generation parameters (optional, defaults from config)
  model: z.literal('gpt-image-1').optional().describe('Image model to use'),
  size: z
    .enum(SIZE_OPTIONS)
    .optional()
    .describe(
      'Image dimensions. Supported sizes: 1024x1024 (square), 1536x1024 (landscape), 1024x1536 (portrait), auto. Note: Custom sizes like 512x512 are not supported by the API.'
    ),
  quality: z.enum(QUALITY_OPTIONS).optional().describe('Rendering quality'),
  background: z.enum(BACKGROUND_OPTIONS).optional().describe('Background transparency'),
  outputFormat: z.enum(OUTPUT_FORMAT_OPTIONS).optional().describe('Output image format'),
  outputCompression: z.coerce
    .number()
    .int()
    .min(COMPRESSION_MIN)
    .max(COMPRESSION_MAX)
    .optional()
    .describe('Compression level for JPEG/WebP (0-100)'),
  partialImages: z
    .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
    .optional()
    .describe('Number of partial images for streaming (0-3)'),
  n: z.coerce
    .number()
    .int()
    .min(IMAGE_COUNT_MIN)
    .max(IMAGE_COUNT_MAX)
    .optional()
    .describe('Number of images to generate'),
});

/**
 * Generate mode schema
 */
const GenerateVisualSchema = BaseVisualSchema.extend({
  mode: z.literal('generate'),
}).strict();

/**
 * Edit mode schema
 */
const EditVisualSchema = BaseVisualSchema.extend({
  mode: z.literal('edit'),
  inputImages: z
    .array(z.string())
    .min(1, 'At least one input image is required for edit mode')
    .describe('Input images as base64 strings or file IDs'),
  inputImageMask: z
    .string()
    .optional()
    .describe('Optional mask image for inpainting (base64 or file ID)'),
  inputFidelity: z
    .enum(INPUT_FIDELITY_OPTIONS)
    .optional()
    .describe('Input image detail preservation level'),
}).strict();

/**
 * Search mode schema
 *
 * Note: 'sec' mode from Perplexity config is intentionally excluded as
 * SEC filings are not relevant for visual search/inspiration
 */
const SearchVisualSchema = z
  .object({
    mode: z.literal('search'),
    prompt: z.string().min(1, 'Prompt is required').describe('Search query for visual inspiration'),
    searchMode: z
      .enum(VISUAL_SEARCH_MODES)
      .optional()
      .describe('Search domain: web or academic papers'),
    searchRecencyFilter: z
      .enum(SEARCH_RECENCY_OPTIONS)
      .optional()
      .describe('Filter results by recency'),
  })
  .strict();

/**
 * Complete input schema with discriminated union
 */
export const CreateVisualInputSchema = z.discriminatedUnion('mode', [
  GenerateVisualSchema,
  EditVisualSchema,
  SearchVisualSchema,
]);

export type CreateVisualInput = z.infer<typeof CreateVisualInputSchema>;

/**
 * Input sanitization helper
 */
export function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 4000); // Limit length to prevent abuse
}

/**
 * Validate that n does not exceed maxImages from config
 */
export function validateImageCount(n: number | undefined, maxImages: number): number {
  const count = n ?? 1;
  if (count > maxImages) {
    throw new Error(`Requested ${count} images, but maximum allowed is ${maxImages}`);
  }
  return count;
}

import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import { OpenAIClient } from '../llm/openai-client.js';
import { PerplexityClient } from '../llm/perplexity-client.js';
import { ContextGatherer } from '../context/gatherer.js';
import { BaseTool } from './base-tool.js';
import type {
  GPTImageRequest,
  GPTImageResponse,
  PerplexityRequest,
  PerplexityImageResult,
  PerplexitySearchResult,
} from '../llm/types.js';

/**
 * Result from visual generation
 */
interface VisualResult {
  mode: VisualModeType;
  images?: GPTImageResponse['images'];
  searchResults?: {
    content: string;
    citations: string[];
    imageUrls?: Array<PerplexityImageResult>;
    searchResults?: Array<PerplexitySearchResult>;
  };
  model: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
    reasoning?: number;
  };
  cost: number;
}

/**
 * Create Visual Tool
 * Generates, edits, and searches for images using GPT Image and Perplexity
 */
export class CreateVisualTool extends BaseTool {
  private perplexityClient: PerplexityClient;

  constructor(
    config: Config,
    logger: Logger,
    openaiClient: OpenAIClient,
    contextGatherer: ContextGatherer,
    perplexityClient: PerplexityClient
  ) {
    super(config, logger, openaiClient, contextGatherer);
    this.perplexityClient = perplexityClient;
  }

  /**
   * System prompt for generate mode
   */
  private readonly GENERATE_PROMPT = `You are an expert image generation consultant helping users create effective prompts for GPT Image (gpt-image-1).

Your role is to guide users in crafting detailed, effective prompts that produce high-quality images. Consider:

1. **Clarity & Specificity**: Help users be specific about subject, style, composition, lighting, colors, mood
2. **Technical Parameters**: Recommend appropriate size, quality, format, background based on use case
3. **Best Practices**: 
   - Be descriptive but concise (avoid overly long prompts)
   - Specify art style if needed (photorealistic, illustration, 3D render, etc.)
   - Include lighting and atmosphere details
   - Mention color palette preferences
   - Describe composition and perspective
4. **Quality Settings**:
   - low: Fast, simple images (~340 tokens average, range 272-408)
   - medium: Balanced quality (~1320 tokens average, range 1056-1584)
   - high: Maximum detail (~5200 tokens average, range 4160-6240)
5. **Format Selection**:
   - PNG: Best for images needing transparency
   - JPEG: Smaller files, faster generation
   - WebP: Modern format with good compression

Provide guidance on prompt improvements and parameter selection.`;

  /**
   * System prompt for edit mode
   */
  private readonly EDIT_PROMPT = `You are an expert image editing consultant helping users refine and modify existing images using GPT Image.

Your role is to guide users in making precise edits to their images through effective prompts. Consider:

1. **Edit Precision**: Help users describe exactly what changes they want
2. **Multi-Turn Refinement**: Support iterative edits - each edit builds on previous results
3. **Input Fidelity**:
   - low: Standard preservation of input image details
   - high: Better preserve faces, logos, textures, fine details
4. **Inpainting**: When mask is provided, focus changes on masked region only
5. **Consistency**: Maintain style and quality of original image unless change requested
6. **Technical Guidance**:
   - Recommend input fidelity based on content (faces → high, simple objects → low)
   - Suggest masking for precise regional edits
   - Guide on color matching and style consistency

Help users achieve their editing goals through clear, detailed edit prompts.`;

  /**
   * System prompt for search mode
   */
  private readonly SEARCH_PROMPT = `You are a visual research consultant helping users find inspiring images and references using Perplexity search.

Your role is to help users discover relevant visual content for inspiration. Consider:

1. **Search Strategy**: Craft effective search queries for visual content
2. **Domain Selection**:
   - web: General images, design inspiration, photography
   - academic: Research papers, scientific visualizations, scholarly imagery
3. **Recency**: Recommend filtering by time period when relevant (week/month/year)
4. **Use Cases**:
   - Design inspiration and mood boards
   - Reference images for generation
   - Style and composition research
   - Color palette discovery
   - Technical visualization examples

Provide search guidance and help interpret results for visual projects.`;

  /**
   * Execute the create-visual tool
   */
  async execute(input: CreateVisualInput) {
    this.logger.info({ mode: input.mode }, 'Executing create-visual tool');

    if (this.config.gptImage.debugImageGeneration) {
      this.logger.debug({ input }, '[DEBUG] create-visual input parameters');
    }

    try {
      // Route to appropriate handler based on mode
      let result: VisualResult;

      switch (input.mode) {
        case 'generate':
          result = await this.executeGenerate(input);
          break;
        case 'edit':
          result = await this.executeEdit(input);
          break;
        case 'search':
          result = await this.executeSearch(input);
          break;
      }

      if (this.config.gptImage.debugImageGeneration) {
        this.logger.debug(
          {
            mode: result.mode,
            imageCount: result.images?.length || 0,
            hasSearchResults: !!result.searchResults,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
          },
          '[DEBUG] Execution result before formatting'
        );
      }

      return await this.formatVisualResponse(result);
    } catch (error) {
      this.logger.error({ error, mode: input.mode }, 'Error executing create-visual tool');
      throw error;
    }
  }

  /**
   * Execute generate mode
   */
  /**
   * Get output compression value, handling PNG format constraints
   * PNG only supports lossless compression (100), so we omit the parameter
   * for PNG when compression is not 100 to use default behavior
   */
  private getOutputCompression(
    outputFormat: ImageFormat,
    compressionValue: number
  ): number | undefined {
    return outputFormat === 'png' && compressionValue !== 100 ? undefined : compressionValue;
  }

  private async executeGenerate(
    input: Extract<CreateVisualInput, { mode: 'generate' }>
  ): Promise<VisualResult> {
    this.logger.info({ promptLength: input.prompt.length }, 'Generating image');

    // Sanitize prompt
    const sanitizedPrompt = sanitizePrompt(input.prompt);

    // Validate image count
    const imageCount = validateImageCount(input.n, this.config.gptImage.maxImages);

    // Determine output format and compression
    const outputFormat = input.outputFormat || this.config.gptImage.outputFormat;
    const compressionValue = input.outputCompression ?? this.config.gptImage.outputCompression;
    const outputCompression = this.getOutputCompression(outputFormat, compressionValue);

    // Build request
    const request: GPTImageRequest = {
      prompt: sanitizedPrompt,
      model: input.model || ('gpt-image-1' as const),
      n: imageCount,
      size: input.size || this.config.gptImage.size,
      quality: input.quality || this.config.gptImage.quality,
      background: input.background || this.config.gptImage.background,
      outputFormat,
      outputCompression,
      partialImages: input.partialImages,
    };

    // Generate image
    const response = await this.openaiClient.generateImage(request);

    // Calculate cost
    const cost = this.calculateImageCost(
      0, // No input image tokens
      response.images.length,
      request.quality || 'auto',
      request.size || 'auto'
    );

    return {
      mode: 'generate',
      images: response.images,
      model: response.model,
      tokensUsed: {
        input: 0,
        output: this.estimateOutputTokens(response.images.length, request.quality || 'auto'),
        total: this.estimateOutputTokens(response.images.length, request.quality || 'auto'),
      },
      cost,
    };
  }

  /**
   * Execute edit mode
   */
  private async executeEdit(
    input: Extract<CreateVisualInput, { mode: 'edit' }>
  ): Promise<VisualResult> {
    this.logger.info(
      {
        promptLength: input.prompt.length,
        inputImageCount: input.inputImages.length,
        hasMask: !!input.inputImageMask,
      },
      'Editing image'
    );

    // Sanitize prompt
    const sanitizedPrompt = sanitizePrompt(input.prompt);

    // Validate image count
    const imageCount = validateImageCount(input.n, this.config.gptImage.maxImages);

    // Determine output format and compression
    const outputFormat = input.outputFormat || this.config.gptImage.outputFormat;
    const compressionValue = input.outputCompression ?? this.config.gptImage.outputCompression;
    const outputCompression = this.getOutputCompression(outputFormat, compressionValue);

    // Build request
    const request: GPTImageRequest = {
      prompt: sanitizedPrompt,
      model: input.model || ('gpt-image-1' as const),
      n: imageCount,
      size: input.size || this.config.gptImage.size,
      quality: input.quality || this.config.gptImage.quality,
      background: input.background || this.config.gptImage.background,
      outputFormat,
      outputCompression,
      inputFidelity: input.inputFidelity || this.config.gptImage.inputFidelity,
      inputImages: input.inputImages,
      inputImageMask: input.inputImageMask,
      partialImages: input.partialImages,
    };

    // Edit image
    const response = await this.openaiClient.editImage(request);

    // Calculate cost (including input image tokens)
    const inputImageTokens = this.estimateInputImageTokens(
      input.inputImages.length,
      input.inputFidelity || 'low'
    );
    const outputImageTokens = this.estimateOutputTokens(
      response.images.length,
      request.quality || 'auto'
    );

    const cost = this.calculateImageCost(
      input.inputImages.length,
      response.images.length,
      request.quality || 'auto',
      request.size || 'auto',
      input.inputFidelity || 'low'
    );

    return {
      mode: 'edit',
      images: response.images,
      model: response.model,
      tokensUsed: {
        input: inputImageTokens,
        output: outputImageTokens,
        total: inputImageTokens + outputImageTokens,
      },
      cost,
    };
  }

  /**
   * Execute search mode
   */
  private async executeSearch(
    input: Extract<CreateVisualInput, { mode: 'search' }>
  ): Promise<VisualResult> {
    this.logger.info(
      {
        query: input.prompt,
        searchMode: input.searchMode,
        recency: input.searchRecencyFilter,
      },
      'Searching for visual inspiration'
    );

    // Build Perplexity request
    const request: PerplexityRequest = {
      messages: [
        {
          role: 'system',
          content: this.SEARCH_PROMPT,
        },
        {
          role: 'user',
          content: `Find visual inspiration for: ${input.prompt}`,
        },
      ],
      model: this.config.perplexity.model,
      searchMode: input.searchMode || 'web',
      searchRecencyFilter: input.searchRecencyFilter,
      returnImages: true,
      returnRelatedQuestions: true,
    };

    // Execute search
    const response = await this.perplexityClient.chat(request);

    // Calculate cost (approximate for Perplexity)
    const cost = this.calculatePerplexityCost(response.tokensUsed, response.model);

    return {
      mode: 'search',
      searchResults: {
        content: response.content,
        citations: response.citations || [],
        imageUrls: response.images,
        searchResults: response.searchResults,
      },
      model: response.model,
      tokensUsed: {
        input: response.tokensUsed.prompt,
        output: response.tokensUsed.completion,
        total: response.tokensUsed.total,
      },
      cost,
    };
  }

  /**
   * Estimate input image tokens based on fidelity
   */
  private estimateInputImageTokens(imageCount: number, fidelity: 'low' | 'high'): number {
    // Rough estimates based on GPT Image documentation
    const tokensPerImage = fidelity === 'high' ? 1000 : 500;
    return imageCount * tokensPerImage;
  }

  /**
   * Estimate output image tokens based on quality
   */
  private estimateOutputTokens(imageCount: number, quality: string): number {
    // Based on GPT Image quality token costs
    const tokensPerImage =
      {
        low: 340, // Average of 272-408
        medium: 1320, // Average of 1056-1584
        high: 5200, // Average of 4160-6240
        auto: 1320, // Assume medium as default
      }[quality] || 1320;

    return imageCount * tokensPerImage;
  }

  /**
   * Calculate image generation cost
   */
  private calculateImageCost(
    inputImageCount: number,
    outputImageCount: number,
    quality: string,
    size: string,
    inputFidelity: 'low' | 'high' = 'low'
  ): number {
    // Placeholder pricing (update with actual GPT Image rates)
    // Prices per image based on quality
    const outputPricing = {
      low: 0.02,
      medium: 0.04,
      high: 0.08,
      auto: 0.04,
    };

    const inputPricing = {
      low: 0.01,
      high: 0.02,
    };

    const inputCost = inputImageCount * inputPricing[inputFidelity];
    const outputCost =
      outputImageCount *
      (outputPricing[quality as keyof typeof outputPricing] || outputPricing.auto);

    return inputCost + outputCost;
  }

  /**
   * Calculate Perplexity cost
   */
  private calculatePerplexityCost(
    tokensUsed: { prompt: number; completion: number; total: number },
    model: string
  ): number {
    // Perplexity pricing (per 1M tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      sonar: { input: 1.0, output: 1.0 },
      'sonar-pro': { input: 3.0, output: 15.0 },
      'sonar-deep-research': { input: 5.0, output: 15.0 },
      'sonar-reasoning': { input: 1.0, output: 5.0 },
      'sonar-reasoning-pro': { input: 5.0, output: 15.0 },
    };

    const rates = pricing[model] || pricing['sonar'];

    const inputCost = (tokensUsed.prompt / 1_000_000) * rates.input;
    const outputCost = (tokensUsed.completion / 1_000_000) * rates.output;

    return inputCost + outputCost;
  }

  /**
   * Format visual result as MCP tool response
   */
  private async formatVisualResponse(result: VisualResult) {
    if (this.config.gptImage.debugImageGeneration) {
      this.logger.debug({ resultMode: result.mode }, '[DEBUG] Entering formatVisualResponse');
    }

    const parts: string[] = [];

    // Mode-specific content
    if (result.mode === 'generate' || result.mode === 'edit') {
      if (result.images && result.images.length > 0) {
        parts.push(`# ${result.mode === 'generate' ? 'Generated' : 'Edited'} Images\n`);
        parts.push(`Generated ${result.images.length} image(s)\n`);

        // Include revised prompts if available
        result.images.forEach((img, idx) => {
          if (img.revised_prompt) {
            parts.push(`\n**Image ${idx + 1} - Revised Prompt:**`);
            parts.push(img.revised_prompt);
          }
        });

        parts.push('\n---\n');
      }
    } else if (result.mode === 'search' && result.searchResults) {
      parts.push('# Visual Search Results\n');
      parts.push(result.searchResults.content);

      // Add image results if available
      if (result.searchResults.imageUrls && result.searchResults.imageUrls.length > 0) {
        parts.push('\n\n**Images Found:**');
        result.searchResults.imageUrls.forEach((img, idx) => {
          parts.push(`\n${idx + 1}. ${img.imageUrl}`);
          if (img.originUrl) {
            parts.push(`   Source: ${img.originUrl}`);
          }
          if (img.width && img.height) {
            parts.push(`   Dimensions: ${img.width}x${img.height}`);
          }
        });
      }

      // Add search results if available
      if (result.searchResults.searchResults && result.searchResults.searchResults.length > 0) {
        parts.push('\n\n**Search Results:**');
        result.searchResults.searchResults.forEach((searchResult, idx) => {
          parts.push(`\n${idx + 1}. ${searchResult.title}`);
          parts.push(`   URL: ${searchResult.url}`);
          if (searchResult.snippet) {
            parts.push(`   ${searchResult.snippet}`);
          }
        });
      }

      // Add citations if available
      if (result.searchResults.citations.length > 0) {
        parts.push('\n\n**Citations:**');
        result.searchResults.citations.forEach((citation, idx) => {
          parts.push(`${idx + 1}. ${citation}`);
        });
      }

      parts.push('\n---\n');
    }

    // Metadata
    parts.push(`**Model:** ${result.model}`);
    parts.push(`**Mode:** ${result.mode}`);
    parts.push(
      `**Tokens Used:** ${result.tokensUsed.total} (input: ${result.tokensUsed.input}, output: ${result.tokensUsed.output}${result.tokensUsed.reasoning ? `, reasoning: ${result.tokensUsed.reasoning}` : ''})`
    );
    parts.push(`**Estimated Cost:** $${result.cost.toFixed(6)}`);

    let responseText = parts.join('\n');

    // Build response with images if present
    const content: Array<{ type: string; text?: string; data?: string; mimeType?: string }> = [
      {
        type: 'text',
        text: responseText,
      },
    ];

    // Add images to response (for generate/edit modes)
    if (result.images && result.images.length > 0) {
      if (this.config.gptImage.debugImageGeneration) {
        this.logger.debug(
          { imageCount: result.images.length },
          '[DEBUG] Processing images for response'
        );
      }

      // Save images to filesystem and collect paths
      const savedPaths: string[] = [];

      for (let index = 0; index < result.images.length; index++) {
        const img = result.images[index];

        // Detect MIME type from base64 data signature
        const mimeType = this.detectImageMimeType(img.b64_json);

        if (this.config.gptImage.debugImageGeneration) {
          this.logger.debug(
            {
              index,
              mimeType,
              dataLength: img.b64_json.length,
              hasRevisedPrompt: !!img.revised_prompt,
            },
            '[DEBUG] Processing image'
          );
        }

        // Save to filesystem
        try {
          const filepath = await this.saveImageToFilesystem(img.b64_json, mimeType, index);
          savedPaths.push(filepath);

          if (this.config.gptImage.debugImageGeneration) {
            this.logger.debug({ index, filepath }, '[DEBUG] Image saved successfully');
          }
        } catch (error) {
          this.logger.error({ error, index }, 'Failed to save image to filesystem');
          // Continue with other images even if one fails
        }

        content.push({
          type: 'image',
          data: img.b64_json,
          mimeType,
        });
      }

      // Add saved paths information to response text
      if (savedPaths.length > 0) {
        responseText += '\n\n**Saved images:**\n' + savedPaths.map(p => `- ${p}`).join('\n');
        // Update the text content with saved paths
        content[0] = {
          type: 'text',
          text: responseText,
        };
      }
    }

    if (this.config.gptImage.debugImageGeneration) {
      this.logger.debug(
        {
          contentItemsCount: content.length,
          textLength: content[0]?.text?.length || 0,
          imageCount: content.filter(c => c.type === 'image').length,
        },
        '[DEBUG] Returning formatted response'
      );
    }

    return { content };
  }

  /**
   * Detect the MIME type of an image from its base64 data or format parameter
   * @param base64Data - Base64 encoded image data
   * @param format - Optional format from request (png, jpeg, webp)
   * @returns The MIME type string
   */
  private detectImageMimeType(base64Data: string, format?: string): string {
    // If format is explicitly specified, use it
    if (format) {
      const mimeTypes: Record<string, string> = {
        png: 'image/png',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        webp: 'image/webp',
      };
      return mimeTypes[format.toLowerCase()] || 'image/png';
    }

    // Detect from base64 data signature
    // PNG: starts with iVBORw0KGgo (base64 of 89504E47...)
    // JPEG: starts with /9j/ (base64 of FFD8)
    // WebP: starts with UklGR (base64 of 52494646)
    if (base64Data.startsWith('iVBORw0KGgo')) {
      return 'image/png';
    } else if (base64Data.startsWith('/9j/')) {
      return 'image/jpeg';
    } else if (base64Data.startsWith('UklGR')) {
      return 'image/webp';
    }

    // Default to PNG if unable to detect
    return 'image/png';
  }

  /**
   * Save generated image to filesystem
   * Saves to project ./generated-images directory or fallback to temp directory
   * @param base64Data - Base64 encoded image data
   * @param mimeType - MIME type of the image
   * @param index - Image index for multiple images
   * @returns The full path to the saved image file
   */
  private async saveImageToFilesystem(
    base64Data: string,
    mimeType: string,
    index: number
  ): Promise<string> {
    if (this.config.gptImage.debugImageGeneration) {
      this.logger.debug(
        { mimeType, index, dataLength: base64Data.length },
        '[DEBUG] saveImageToFilesystem called'
      );
    }

    // Determine file extension from MIME type
    const extensionMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    };
    const extension = extensionMap[mimeType] || 'png';

    // Try project directory first, fallback to temp
    let imagesDir: string;
    try {
      // Use project directory: ./generated-images
      const projectDir = process.cwd();
      imagesDir = path.join(projectDir, 'generated-images');

      if (this.config.gptImage.debugImageGeneration) {
        this.logger.debug(
          { imagesDir, projectDir },
          '[DEBUG] Attempting to create project images directory'
        );
      }

      await fs.mkdir(imagesDir, { recursive: true });

      if (this.config.gptImage.debugImageGeneration) {
        this.logger.debug('[DEBUG] Project images directory created successfully');
      }
    } catch (error) {
      // Fallback to temp directory
      const tmpDir = os.tmpdir();
      imagesDir = path.join(tmpDir, 'kortx-mcp-images');

      if (this.config.gptImage.debugImageGeneration) {
        this.logger.debug(
          { imagesDir, tmpDir, error: String(error) },
          '[DEBUG] Falling back to temp directory'
        );
      }

      await fs.mkdir(imagesDir, { recursive: true });
    }

    // Generate filename with timestamp and index
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `image-${timestamp}-${index}.${extension}`;
    const filepath = path.join(imagesDir, filename);

    if (this.config.gptImage.debugImageGeneration) {
      this.logger.debug({ filepath, filename }, '[DEBUG] Generated filepath for image');
    }

    // Convert base64 to buffer and write to file
    const buffer = Buffer.from(base64Data, 'base64');

    if (this.config.gptImage.debugImageGeneration) {
      this.logger.debug(
        { bufferSize: buffer.length, filepath },
        '[DEBUG] Writing image buffer to file'
      );
    }

    await fs.writeFile(filepath, buffer);

    if (this.config.gptImage.debugImageGeneration) {
      this.logger.debug({ filepath }, '[DEBUG] File write completed successfully');
    }

    this.logger.info({ filepath, size: buffer.length, mimeType }, 'Saved generated image');

    return filepath;
  }
}
