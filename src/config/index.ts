import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';
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
} from '../tools/gpt-image-constants.js';

// Load environment variables
dotenvConfig();

// Boolean coercion helper that handles "true"/"false" strings correctly
const booleanSchema = (defaultValue: boolean) =>
  z
    .union([z.boolean(), z.string()])
    .transform(val => {
      if (typeof val === 'boolean') return val;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return defaultValue;
    })
    .default(defaultValue);

// OpenAI configuration schema
const OpenAIConfigSchema = z.object({
  apiKey: z.string().min(1, 'OPENAI_API_KEY is required'),
  model: z.enum(['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-codex']).default('gpt-5-mini'),
  reasoningEffort: z.enum(['minimal', 'low', 'medium', 'high']).default('minimal'),
  verbosity: z.enum(['low', 'medium', 'high']).default('low'),
  maxTokens: z.coerce.number().int().positive().default(1024),
});

// Perplexity configuration schema
const PerplexityConfigSchema = z.object({
  apiKey: z.string().min(1, 'PERPLEXITY_API_KEY is required'),
  model: z
    .enum(['sonar', 'sonar-pro', 'sonar-deep-research', 'sonar-reasoning', 'sonar-reasoning-pro'])
    .default('sonar'),
  temperature: z.coerce.number().min(0).max(2).default(0.2),
  maxTokens: z.coerce.number().int().positive().default(4096),
  searchMode: z.enum(['academic', 'sec', 'web']).default('web'),
  returnImages: booleanSchema(false),
  returnRelatedQuestions: booleanSchema(false),
});

/**
 * GPT Image configuration schema for image generation via Responses API
 *
 * Supports GPT Image (gpt-image-1) model with comprehensive configuration options
 * for image generation, editing, and streaming.
 *
 * Note: Uses the shared OPENAI_API_KEY from the openai config section for authentication.
 * No separate GPT_IMAGE_API_KEY is required.
 */
const GPTImageConfigSchema = z.object({
  /** Image model to use (default: 'gpt-image-1') */
  model: z.literal('gpt-image-1').default('gpt-image-1'),

  /** Default image dimensions (default: 'auto' - model chooses based on prompt) */
  size: z.enum(SIZE_OPTIONS).default('auto'),

  /** Default rendering quality (default: 'auto' - model chooses based on prompt) */
  quality: z.enum(QUALITY_OPTIONS).default('auto'),

  /** Default background transparency (default: 'auto' - model chooses based on prompt) */
  background: z.enum(BACKGROUND_OPTIONS).default('auto'),

  /** Default output image format (default: 'png') */
  outputFormat: z.enum(OUTPUT_FORMAT_OPTIONS).default('png'),

  /** Default compression level for JPEG/WebP (0-100, default: 85) */
  outputCompression: z.coerce.number().int().min(COMPRESSION_MIN).max(COMPRESSION_MAX).default(85),

  /** Default input fidelity for preserving input image details (default: 'low') */
  inputFidelity: z.enum(INPUT_FIDELITY_OPTIONS).default('low'),

  /** Maximum number of images per request (default: 4) */
  maxImages: z.coerce.number().int().min(IMAGE_COUNT_MIN).max(IMAGE_COUNT_MAX).default(4),

  /** Default partial images for streaming (0-3, default: 0 - only final image) */
  partialImages: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(0),

  /** API timeout in milliseconds (default: 120000 - 2 minutes) */
  timeout: z.coerce.number().int().positive().default(120000),

  /** Enable cost tracking for image generation (default: true) */
  enableCostTracking: booleanSchema(true),

  /** Cost alert threshold in dollars (default: 10.0) */
  costAlertThreshold: z.coerce.number().positive().default(10.0),
});

// MCP Server configuration schema
const ServerConfigSchema = z.object({
  name: z.string().default('kortx-mcp'),
  version: z.string().default('0.1.0'),
  port: z.coerce.number().int().positive().default(3000),
  transport: z.enum(['stdio', 'streaming']).default('stdio'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  auditLogging: z.coerce.boolean().default(false),
});

// Context gathering configuration
const ContextConfigSchema = z.object({
  enableSerena: booleanSchema(true),
  enableMemory: booleanSchema(true),
  enableCclsp: booleanSchema(true),
  maxContextTokens: z.coerce.number().int().positive().default(32000),
  includeFileContent: booleanSchema(true),
  includeGitHistory: booleanSchema(false),
});

// Security configuration
const SecurityConfigSchema = z.object({
  enableRateLimiting: booleanSchema(true),
  maxRequestsPerHour: z.coerce.number().int().positive().default(100),
  maxTokensPerRequest: z.coerce.number().int().positive().default(50000),
  maxTokensPerHour: z.coerce.number().int().positive().default(500000),
  requestTimeoutMs: z.coerce.number().int().positive().default(60000),
  maxInputSize: z.coerce.number().int().positive().default(100000), // 100KB
});

// Complete configuration schema
const ConfigSchema = z.object({
  openai: OpenAIConfigSchema,
  perplexity: PerplexityConfigSchema,
  gptImage: GPTImageConfigSchema,
  server: ServerConfigSchema,
  context: ContextConfigSchema,
  security: SecurityConfigSchema,
});

export type Config = z.infer<typeof ConfigSchema>;

// Parse and validate configuration
export function loadConfig(): Config {
  try {
    return ConfigSchema.parse({
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL,
        reasoningEffort: process.env.OPENAI_REASONING_EFFORT,
        verbosity: process.env.OPENAI_VERBOSITY,
        maxTokens: process.env.OPENAI_MAX_TOKENS,
      },
      perplexity: {
        apiKey: process.env.PERPLEXITY_API_KEY,
        model: process.env.PERPLEXITY_MODEL,
        temperature: process.env.PERPLEXITY_TEMPERATURE,
        maxTokens: process.env.PERPLEXITY_MAX_TOKENS,
        searchMode: process.env.PERPLEXITY_SEARCH_MODE,
        returnImages: process.env.PERPLEXITY_RETURN_IMAGES,
        returnRelatedQuestions: process.env.PERPLEXITY_RETURN_RELATED_QUESTIONS,
      },
      gptImage: {
        model: process.env.GPT_IMAGE_MODEL,
        size: process.env.GPT_IMAGE_SIZE,
        quality: process.env.GPT_IMAGE_QUALITY,
        background: process.env.GPT_IMAGE_BACKGROUND,
        outputFormat: process.env.GPT_IMAGE_FORMAT,
        outputCompression: process.env.GPT_IMAGE_COMPRESSION,
        inputFidelity: process.env.GPT_IMAGE_FIDELITY,
        maxImages: process.env.GPT_IMAGE_MAX_IMAGES,
        partialImages: process.env.GPT_IMAGE_PARTIAL_IMAGES,
        timeout: process.env.GPT_IMAGE_TIMEOUT,
        enableCostTracking: process.env.GPT_IMAGE_ENABLE_COST_TRACKING,
        costAlertThreshold: process.env.GPT_IMAGE_COST_ALERT_THRESHOLD,
      },
      server: {
        name: process.env.SERVER_NAME,
        version: process.env.SERVER_VERSION,
        port: process.env.PORT,
        transport: process.env.TRANSPORT,
        logLevel: process.env.LOG_LEVEL,
        auditLogging: process.env.AUDIT_LOGGING,
      },
      context: {
        enableSerena: process.env.ENABLE_SERENA,
        enableMemory: process.env.ENABLE_MEMORY,
        enableCclsp: process.env.ENABLE_CCLSP,
        maxContextTokens: process.env.MAX_CONTEXT_TOKENS,
        includeFileContent: process.env.INCLUDE_FILE_CONTENT,
        includeGitHistory: process.env.INCLUDE_GIT_HISTORY,
      },
      security: {
        enableRateLimiting: process.env.ENABLE_RATE_LIMITING,
        maxRequestsPerHour: process.env.MAX_REQUESTS_PER_HOUR,
        maxTokensPerRequest: process.env.MAX_TOKENS_PER_REQUEST,
        maxTokensPerHour: process.env.MAX_TOKENS_PER_HOUR,
        requestTimeoutMs: process.env.REQUEST_TIMEOUT_MS,
        maxInputSize: process.env.MAX_INPUT_SIZE,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(err => `  - ${err.path.join('.')}: ${err.message}`);

      console.error('❌ Invalid environment configuration:');
      missingVars.forEach(msg => console.error(msg));
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      console.error('See .env.example for reference.\n');

      process.exit(1);
    }
    throw error;
  }
}

// Validate model-specific constraints
export function validateModelConstraints(config: Config): void {
  // Model-specific reasoning effort support:
  // - gpt-5, gpt-5-mini, gpt-5-nano: support 'minimal', 'low', 'medium', 'high'
  // - gpt-5-codex: supports 'low', 'medium', 'high' (NOT 'minimal')
  //
  // Note: The OpenAI client will automatically adjust 'minimal' to 'low' for gpt-5-codex
  // to prevent API errors. This is handled at runtime rather than config validation
  // to allow dynamic model selection via tool parameters.

  if (config.openai.model === 'gpt-5-codex' && config.openai.reasoningEffort === 'minimal') {
    console.warn(
      '⚠️  Warning: gpt-5-codex does not support "minimal" reasoning effort.\n' +
        '   The client will automatically adjust to "low" at runtime.\n' +
        '   Consider setting OPENAI_REASONING_EFFORT=low in your .env file.\n'
    );
  }
}

// Export singleton instance
let configInstance: Config | null = null;

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
    validateModelConstraints(configInstance);
  }
  return configInstance;
}
