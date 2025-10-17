import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

// OpenAI configuration schema
const OpenAIConfigSchema = z.object({
  apiKey: z.string().min(1, 'OPENAI_API_KEY is required'),
  model: z.enum(['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-codex']).default('gpt-5-mini'),
  reasoningEffort: z.enum(['minimal', 'low', 'medium', 'high']).default('minimal'),
  verbosity: z.enum(['low', 'medium', 'high']).default('low'),
  maxTokens: z.number().int().positive().default(1024),
});

// Perplexity configuration schema
const PerplexityConfigSchema = z.object({
  apiKey: z.string().min(1, 'PERPLEXITY_API_KEY is required'),
  model: z
    .enum(['sonar', 'sonar-pro', 'sonar-deep-research', 'sonar-reasoning', 'sonar-reasoning-pro'])
    .default('sonar'),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().int().positive().default(4096),
  searchMode: z.enum(['academic', 'sec', 'web']).default('web'),
  returnImages: z.boolean().default(false),
  returnRelatedQuestions: z.boolean().default(false),
});

// MCP Server configuration schema
const ServerConfigSchema = z.object({
  name: z.string().default('kortx-mcp'),
  version: z.string().default('0.1.0'),
  port: z.number().int().positive().default(3000),
  transport: z.enum(['stdio', 'streaming']).default('stdio'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Context gathering configuration
const ContextConfigSchema = z.object({
  enableSerena: z.boolean().default(true),
  enableMemory: z.boolean().default(true),
  enableCclsp: z.boolean().default(true),
  maxContextTokens: z.number().int().positive().default(32000),
  includeFileContent: z.boolean().default(true),
  includeGitHistory: z.boolean().default(false),
});

// Security configuration
const SecurityConfigSchema = z.object({
  enableRateLimiting: z.boolean().default(true),
  maxRequestsPerHour: z.number().int().positive().default(100),
  maxTokensPerRequest: z.number().int().positive().default(50000),
  maxTokensPerHour: z.number().int().positive().default(500000),
  requestTimeoutMs: z.number().int().positive().default(60000),
  maxInputSize: z.number().int().positive().default(100000), // 100KB
});

// Complete configuration schema
const ConfigSchema = z.object({
  openai: OpenAIConfigSchema,
  perplexity: PerplexityConfigSchema,
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
        maxTokens: process.env.OPENAI_MAX_TOKENS
          ? parseInt(process.env.OPENAI_MAX_TOKENS, 10)
          : undefined,
      },
      perplexity: {
        apiKey: process.env.PERPLEXITY_API_KEY,
        model: process.env.PERPLEXITY_MODEL,
        temperature: process.env.PERPLEXITY_TEMPERATURE
          ? parseFloat(process.env.PERPLEXITY_TEMPERATURE)
          : undefined,
        maxTokens: process.env.PERPLEXITY_MAX_TOKENS
          ? parseInt(process.env.PERPLEXITY_MAX_TOKENS, 10)
          : undefined,
        searchMode: process.env.PERPLEXITY_SEARCH_MODE as 'academic' | 'sec' | 'web' | undefined,
        returnImages: process.env.PERPLEXITY_RETURN_IMAGES === 'true' ? true : undefined,
        returnRelatedQuestions:
          process.env.PERPLEXITY_RETURN_RELATED_QUESTIONS === 'true' ? true : undefined,
      },
      server: {
        name: process.env.SERVER_NAME,
        version: process.env.SERVER_VERSION,
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
        transport: process.env.TRANSPORT as 'stdio' | 'streaming' | undefined,
        logLevel: process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error' | undefined,
      },
      context: {
        enableSerena: process.env.ENABLE_SERENA === 'false' ? false : undefined,
        enableMemory: process.env.ENABLE_MEMORY === 'false' ? false : undefined,
        enableCclsp: process.env.ENABLE_CCLSP === 'false' ? false : undefined,
        maxContextTokens: process.env.MAX_CONTEXT_TOKENS
          ? parseInt(process.env.MAX_CONTEXT_TOKENS, 10)
          : undefined,
        includeFileContent: process.env.INCLUDE_FILE_CONTENT === 'false' ? false : undefined,
        includeGitHistory: process.env.INCLUDE_GIT_HISTORY === 'true' ? true : undefined,
      },
      security: {
        enableRateLimiting: process.env.ENABLE_RATE_LIMITING === 'false' ? false : undefined,
        maxRequestsPerHour: process.env.MAX_REQUESTS_PER_HOUR
          ? parseInt(process.env.MAX_REQUESTS_PER_HOUR, 10)
          : undefined,
        maxTokensPerRequest: process.env.MAX_TOKENS_PER_REQUEST
          ? parseInt(process.env.MAX_TOKENS_PER_REQUEST, 10)
          : undefined,
        maxTokensPerHour: process.env.MAX_TOKENS_PER_HOUR
          ? parseInt(process.env.MAX_TOKENS_PER_HOUR, 10)
          : undefined,
        requestTimeoutMs: process.env.REQUEST_TIMEOUT_MS
          ? parseInt(process.env.REQUEST_TIMEOUT_MS, 10)
          : undefined,
        maxInputSize: process.env.MAX_INPUT_SIZE
          ? parseInt(process.env.MAX_INPUT_SIZE, 10)
          : undefined,
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
