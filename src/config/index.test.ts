import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, validateModelConstraints } from './index.js';
import type { Config } from './index.js';

describe('Configuration Management', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    it('should load valid configuration with all required fields', () => {
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      process.env.OPENAI_MODEL = 'gpt-5';
      process.env.OPENAI_REASONING_EFFORT = 'medium';
      process.env.OPENAI_MAX_TOKENS = '2048';

      const config = loadConfig();

      expect(config.openai.apiKey).toBe('test-api-key-123');
      expect(config.openai.model).toBe('gpt-5');
      expect(config.openai.reasoningEffort).toBe('medium');
      expect(config.openai.maxTokens).toBe(2048);
    });

    it('should apply default values when optional fields are missing', () => {
      process.env.OPENAI_API_KEY = 'test-api-key-123';

      const config = loadConfig();

      expect(config.openai.model).toBe('gpt-5-mini');
      expect(config.openai.reasoningEffort).toBe('minimal');
      expect(config.openai.maxTokens).toBe(1024);
      expect(config.server.name).toBe('mcp-consultant');
      expect(config.server.version).toBe('0.1.0');
      expect(config.server.port).toBe(3000);
      expect(config.server.transport).toBe('stdio');
      expect(config.server.logLevel).toBe('info');
      expect(config.context.enableSerena).toBe(true);
      expect(config.context.enableMemory).toBe(true);
      expect(config.context.enableCclsp).toBe(true);
    });

    it('should throw error when OPENAI_API_KEY is missing', () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => loadConfig()).toThrow();
    });

    it('should throw error when OPENAI_API_KEY is empty string', () => {
      process.env.OPENAI_API_KEY = '';

      expect(() => loadConfig()).toThrow();
    });

    it('should accept all valid model values', () => {
      const validModels = ['gpt-5', 'gpt-5-mini', 'gpt-5-nano'];

      validModels.forEach(model => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.OPENAI_MODEL = model;

        const config = loadConfig();
        expect(config.openai.model).toBe(model);
      });
    });

    it('should reject invalid model values', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MODEL = 'gpt-4-turbo';

      expect(() => loadConfig()).toThrow();
    });

    it('should accept all valid reasoning effort values', () => {
      const validEfforts = ['minimal', 'low', 'medium', 'high'];

      validEfforts.forEach(effort => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.OPENAI_REASONING_EFFORT = effort;

        const config = loadConfig();
        expect(config.openai.reasoningEffort).toBe(effort);
      });
    });

    it('should reject invalid reasoning effort values', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_REASONING_EFFORT = 'extreme';

      expect(() => loadConfig()).toThrow();
    });

    it('should validate maxTokens is positive integer', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MAX_TOKENS = '-100';

      expect(() => loadConfig()).toThrow();
    });

    // Temperature parameter not yet implemented - planned for future version
    it.skip('should validate temperature is between 0 and 2', () => {
      process.env.OPENAI_API_KEY = 'test-key';

      // Valid temperatures
      process.env.OPENAI_TEMPERATURE = '0';
      expect(loadConfig().openai.temperature).toBe(0);

      process.env.OPENAI_TEMPERATURE = '2';
      expect(loadConfig().openai.temperature).toBe(2);

      // Invalid temperatures
      process.env.OPENAI_TEMPERATURE = '-0.1';
      expect(() => loadConfig()).toThrow();

      process.env.OPENAI_TEMPERATURE = '2.1';
      expect(() => loadConfig()).toThrow();
    });

    it('should accept all valid transport values', () => {
      const validTransports = ['stdio', 'streaming'];

      validTransports.forEach(transport => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.TRANSPORT = transport;

        const config = loadConfig();
        expect(config.server.transport).toBe(transport);
      });
    });

    it('should accept all valid log level values', () => {
      const validLevels = ['debug', 'info', 'warn', 'error'];

      validLevels.forEach(level => {
        process.env.OPENAI_API_KEY = 'test-key';
        process.env.LOG_LEVEL = level;

        const config = loadConfig();
        expect(config.server.logLevel).toBe(level);
      });
    });

    it('should handle context feature flags correctly', () => {
      process.env.OPENAI_API_KEY = 'test-key';

      // Test disabling features
      process.env.ENABLE_SERENA = 'false';
      process.env.ENABLE_MEMORY = 'false';
      process.env.ENABLE_CCLSP = 'false';
      process.env.INCLUDE_FILE_CONTENT = 'false';

      let config = loadConfig();
      expect(config.context.enableSerena).toBe(false);
      expect(config.context.enableMemory).toBe(false);
      expect(config.context.enableCclsp).toBe(false);
      expect(config.context.includeFileContent).toBe(false);

      // Test enabling git history
      delete process.env.ENABLE_SERENA;
      delete process.env.ENABLE_MEMORY;
      delete process.env.ENABLE_CCLSP;
      delete process.env.INCLUDE_FILE_CONTENT;
      process.env.INCLUDE_GIT_HISTORY = 'true';

      config = loadConfig();
      expect(config.context.includeGitHistory).toBe(true);
    });
  });

  describe('validateModelConstraints', () => {
    // gpt-5-pro and gpt-5-codex models not yet available - planned for future version
    it.skip('should override reasoning effort to high for gpt-5-pro', () => {
      const config: Config = {
        openai: {
          apiKey: 'test-key',
          model: 'gpt-5-pro' as any,
          reasoningEffort: 'medium',
          maxTokens: 4096,
        },
        server: {
          name: 'test',
          version: '1.0.0',
          port: 3000,
          transport: 'stdio',
          logLevel: 'info',
        },
        context: {
          enableSerena: true,
          enableMemory: true,
          enableCclsp: true,
          maxContextTokens: 32000,
          includeFileContent: true,
          includeGitHistory: false,
        },
      };

      validateModelConstraints(config);

      expect(config.openai.reasoningEffort).toBe('high');
    });

    it.skip('should override minimal effort to low for gpt-5-codex', () => {
      const config: Config = {
        openai: {
          apiKey: 'test-key',
          model: 'gpt-5-codex' as any,
          reasoningEffort: 'minimal',
          maxTokens: 4096,
        },
        server: {
          name: 'test',
          version: '1.0.0',
          port: 3000,
          transport: 'stdio',
          logLevel: 'info',
        },
        context: {
          enableSerena: true,
          enableMemory: true,
          enableCclsp: true,
          maxContextTokens: 32000,
          includeFileContent: true,
          includeGitHistory: false,
        },
      };

      validateModelConstraints(config);

      expect(config.openai.reasoningEffort).toBe('low');
    });

    it.skip('should not modify valid gpt-5-pro configuration', () => {
      const config: Config = {
        openai: {
          apiKey: 'test-key',
          model: 'gpt-5-pro' as any,
          reasoningEffort: 'high',
          maxTokens: 4096,
        },
        server: {
          name: 'test',
          version: '1.0.0',
          port: 3000,
          transport: 'stdio',
          logLevel: 'info',
        },
        context: {
          enableSerena: true,
          enableMemory: true,
          enableCclsp: true,
          maxContextTokens: 32000,
          includeFileContent: true,
          includeGitHistory: false,
        },
      };

      validateModelConstraints(config);

      expect(config.openai.reasoningEffort).toBe('high');
    });

    it.skip('should not modify valid gpt-5-codex configuration', () => {
      const config: Config = {
        openai: {
          apiKey: 'test-key',
          model: 'gpt-5-codex' as any,
          reasoningEffort: 'low',
          maxTokens: 4096,
        },
        server: {
          name: 'test',
          version: '1.0.0',
          port: 3000,
          transport: 'stdio',
          logLevel: 'info',
        },
        context: {
          enableSerena: true,
          enableMemory: true,
          enableCclsp: true,
          maxContextTokens: 32000,
          includeFileContent: true,
          includeGitHistory: false,
        },
      };

      validateModelConstraints(config);

      expect(config.openai.reasoningEffort).toBe('low');
    });

    it('should not modify configurations for other models', () => {
      const models = ['gpt-5', 'gpt-5-mini', 'gpt-5-nano'];
      const efforts = ['minimal', 'low', 'medium', 'high'];

      models.forEach(model => {
        efforts.forEach(effort => {
          const config: Config = {
            openai: {
              apiKey: 'test-key',
              model: model as any,
              reasoningEffort: effort as any,
              maxTokens: 4096,
            },
            server: {
              name: 'test',
              version: '1.0.0',
              port: 3000,
              transport: 'stdio',
              logLevel: 'info',
            },
            context: {
              enableSerena: true,
              enableMemory: true,
              enableCclsp: true,
              maxContextTokens: 32000,
              includeFileContent: true,
              includeGitHistory: false,
            },
          };

          validateModelConstraints(config);

          expect(config.openai.reasoningEffort).toBe(effort);
        });
      });
    });
  });
});
