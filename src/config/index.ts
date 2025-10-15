import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

// OpenAI configuration schema
const OpenAIConfigSchema = z.object({
  apiKey: z.string().min(1, 'OPENAI_API_KEY is required'),
  model: z.enum(['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-pro', 'gpt-5-codex']).default('gpt-5'),
  reasoningEffort: z.enum(['minimal', 'low', 'medium', 'high']).default('medium'),
  maxTokens: z.number().int().positive().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
});

// MCP Server configuration schema
const ServerConfigSchema = z.object({
  name: z.string().default('mcp-consultant'),
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

// Complete configuration schema
const ConfigSchema = z.object({
  openai: OpenAIConfigSchema,
  server: ServerConfigSchema,
  context: ContextConfigSchema,
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
        maxTokens: process.env.OPENAI_MAX_TOKENS
          ? parseInt(process.env.OPENAI_MAX_TOKENS, 10)
          : undefined,
        temperature: process.env.OPENAI_TEMPERATURE
          ? parseFloat(process.env.OPENAI_TEMPERATURE)
          : undefined,
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
  const { model, reasoningEffort } = config.openai;

  // gpt-5-pro only supports high effort
  if (model === 'gpt-5-pro' && reasoningEffort !== 'high') {
    console.warn(
      '⚠️  Warning: gpt-5-pro only supports reasoning_effort: high. Overriding to high.'
    );
    config.openai.reasoningEffort = 'high';
  }

  // gpt-5-codex doesn't support minimal effort
  if (model === 'gpt-5-codex' && reasoningEffort === 'minimal') {
    console.warn(
      '⚠️  Warning: gpt-5-codex does not support reasoning_effort: minimal. Using low instead.'
    );
    config.openai.reasoningEffort = 'low';
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
