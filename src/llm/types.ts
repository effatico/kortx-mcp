export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
    reasoning?: number; // For models with reasoning
  };
  finishReason: string;
  reasoningContent?: string; // Hidden reasoning tokens
}

export interface LLMError extends Error {
  status?: number;
  code?: string;
  retryable?: boolean;
}

export interface ConsultationContext {
  query: string;
  codeContext?: string[];
  fileContents?: Map<string, string>;
  memoryContext?: string[];
  lspContext?: string[];
  additionalInfo?: Record<string, string[]>;
  totalTokens: number;
  sourcesUsed: string[];
}

// Perplexity-specific types
export interface PerplexityRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  searchMode?: 'academic' | 'sec' | 'web';
  disableSearch?: boolean;
  enableSearchClassifier?: boolean;
  searchDomainFilter?: Array<string>;
  searchRecencyFilter?: 'week' | 'month' | 'year';
  searchAfterDateFilter?: string; // MM/DD/YYYY format
  searchBeforeDateFilter?: string; // MM/DD/YYYY format
  lastUpdatedAfterFilter?: string; // MM/DD/YYYY format
  lastUpdatedBeforeFilter?: string; // MM/DD/YYYY format
  returnImages?: boolean;
  returnRelatedQuestions?: boolean;
  languagePreference?: string;
  webSearchOptions?: {
    context_size?: 'low' | 'medium' | 'high';
    user_location?: {
      country?: string;
      region?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
  };
  mediaResponse?: {
    overrides?: {
      enable_video?: boolean;
      enable_images?: boolean;
    };
  };
  reasoningEffort?: 'low' | 'medium' | 'high'; // sonar-deep-research only
}

export interface PerplexityResponse {
  content: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason: string;
  citations?: Array<string>;
  images?: Array<PerplexityImageResult>;
  searchResults?: Array<PerplexitySearchResult>;
}

/**
 * Image result from Perplexity search
 */
export interface PerplexityImageResult {
  /** URL of the image */
  imageUrl: string;
  /** URL of the page where the image was found */
  originUrl?: string;
  /** Image height in pixels */
  height?: number;
  /** Image width in pixels */
  width?: number;
}

/**
 * Search result from Perplexity
 */
export interface PerplexitySearchResult {
  /** Title of the search result */
  title: string;
  /** URL of the search result */
  url: string;
  /** Publication or last updated date */
  date?: string;
  /** Last updated timestamp */
  last_updated?: string;
  /** Snippet/preview of the content */
  snippet?: string;
  /** Source type */
  source?: 'web' | 'attachment';
}

// GPT Image generation types
/**
 * Supported image models for generation
 */
export type ImageModel = 'gpt-image-1';

/**
 * Image dimensions supported by GPT Image
 * - '1024x1024': Square format
 * - '1536x1024': Landscape format
 * - '1024x1536': Portrait format
 * - 'auto': Let the model choose based on prompt
 */
export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';

/**
 * Image quality levels
 * - 'low': Fastest generation, 272-408 tokens
 * - 'medium': Balanced quality, 1056-1584 tokens
 * - 'high': Best quality, 4160-6240 tokens
 * - 'auto': Let the model choose based on prompt
 */
export type ImageQuality = 'low' | 'medium' | 'high' | 'auto';

/**
 * Background transparency options
 * - 'transparent': Generate with transparent background (PNG/WebP only)
 * - 'opaque': Generate with opaque background
 * - 'auto': Let the model choose based on prompt
 */
export type ImageBackground = 'transparent' | 'opaque' | 'auto';

/**
 * Output image format
 * - 'png': Default format, supports transparency
 * - 'jpeg': Faster generation, smaller file size
 * - 'webp': Modern format with compression support
 */
export type ImageFormat = 'png' | 'jpeg' | 'webp';

/**
 * Input fidelity for preserving details from input images
 * - 'low': Standard preservation
 * - 'high': Better preserve details like faces, logos, textures
 */
export type InputFidelity = 'low' | 'high';

/**
 * Request parameters for GPT Image generation via Responses API
 * @see https://platform.openai.com/docs/guides/image-generation
 */
export interface GPTImageRequest {
  /** The text prompt describing the image to generate */
  prompt: string;
  /** The model to use for image generation. If omitted, treated as 'gpt-image-1' */
  model?: ImageModel;
  /** Number of images to generate. If omitted, treated as 1 */
  n?: number;
  /** Image dimensions. If omitted, treated as 'auto' */
  size?: ImageSize;
  /** Rendering quality. If omitted, treated as 'auto'. Higher quality uses more tokens */
  quality?: ImageQuality;
  /** Background transparency. Only works with PNG/WebP formats. If omitted, treated as 'auto' */
  background?: ImageBackground;
  /** Output image format. If omitted, treated as 'png' */
  outputFormat?: ImageFormat;
  /** Compression level for JPEG/WebP. Must be 0-100 (validated at runtime). Higher = better quality, larger file */
  outputCompression?: number;
  /** Input fidelity for preserving input image details. Use 'high' for faces/logos */
  inputFidelity?: InputFidelity;
  /** Input images as base64-encoded strings or file IDs for image editing */
  inputImages?: Array<string>;
  /** Mask image for inpainting (editing specific regions). Must have alpha channel */
  inputImageMask?: string;
  /** Number of partial images to stream (0-3). 0 = only final image */
  partialImages?: 0 | 1 | 2 | 3;
}

/**
 * Response from GPT Image generation
 */
export interface GPTImageResponse {
  /** Generated images data */
  images: Array<{
    /** Base64-encoded image data */
    b64_json: string;
    /** Revised prompt used by the model (if prompt was automatically improved) */
    revised_prompt?: string;
  }>;
  /** Model used for generation */
  model: string;
  /** Unix timestamp of when the image was created */
  created: number;
}
