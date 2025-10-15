import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextGatherer } from './gatherer.js';
import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import type { ContextSource, ContextChunk } from './types.js';

// Mock config
const mockConfig: Config = {
  openai: {
    apiKey: 'test-key',
    model: 'gpt-5',
    reasoningEffort: 'medium',
    maxTokens: 4096,
    temperature: 0.7,
  },
  server: {
    name: 'test-server',
    version: '1.0.0',
    port: 3000,
    transport: 'stdio',
    logLevel: 'info',
  },
  context: {
    enableSerena: true,
    enableMemory: true,
    enableCclsp: true,
    maxContextTokens: 1000,
    includeFileContent: true,
    includeGitHistory: false,
  },
};

// Mock logger
const mockLogger = {
  child: vi.fn(() => mockLogger),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as unknown as Logger;

describe('ContextGatherer', () => {
  let gatherer: ContextGatherer;

  beforeEach(() => {
    gatherer = new ContextGatherer(mockConfig, mockLogger);
    vi.clearAllMocks();
  });

  describe('registerSource', () => {
    it('should register a context source', () => {
      const mockSource: ContextSource = {
        name: 'test-source',
        gather: vi.fn(async () => []),
        isAvailable: vi.fn(async () => true),
      };

      gatherer.registerSource(mockSource);
      expect(mockLogger.info).toHaveBeenCalledWith(
        { source: 'test-source' },
        'Context source registered'
      );
    });
  });

  describe('gatherContext', () => {
    it('should gather and merge context from multiple sources', async () => {
      const source1: ContextSource = {
        name: 'source1',
        gather: vi.fn(async () => [
          {
            source: 'source1',
            content: 'Content from source 1',
            relevance: 0.9,
          },
        ]),
        isAvailable: vi.fn(async () => true),
      };

      const source2: ContextSource = {
        name: 'source2',
        gather: vi.fn(async () => [
          {
            source: 'source2',
            content: 'Content from source 2',
            relevance: 0.8,
          },
        ]),
        isAvailable: vi.fn(async () => true),
      };

      gatherer.registerSource(source1);
      gatherer.registerSource(source2);

      const context = await gatherer.gatherContext('test query');

      expect(context.query).toBe('test query');
      expect(context.sourcesUsed).toContain('source1');
      expect(context.sourcesUsed).toContain('source2');
      expect(context.totalTokens).toBeGreaterThan(0);
    });

    it('should respect token limits', async () => {
      const largeContent = 'x'.repeat(10000); // ~2500 tokens

      const source: ContextSource = {
        name: 'large-source',
        gather: vi.fn(async () => [
          { source: 'large-source', content: largeContent, relevance: 0.9 },
          { source: 'large-source', content: largeContent, relevance: 0.8 },
          { source: 'large-source', content: largeContent, relevance: 0.7 },
        ]),
        isAvailable: vi.fn(async () => true),
      };

      gatherer.registerSource(source);

      const context = await gatherer.gatherContext('test query', {
        maxTokens: 1000,
      });

      expect(context.totalTokens).toBeLessThanOrEqual(1000);
    });

    it('should sort chunks by relevance', async () => {
      const chunks: ContextChunk[] = [
        { source: 'test', content: 'low relevance', relevance: 0.3 },
        { source: 'test', content: 'high relevance', relevance: 0.9 },
        { source: 'test', content: 'medium relevance', relevance: 0.6 },
      ];

      const source: ContextSource = {
        name: 'test-source',
        gather: vi.fn(async () => chunks),
        isAvailable: vi.fn(async () => true),
      };

      gatherer.registerSource(source);

      const context = await gatherer.gatherContext('test query');

      // High relevance content should be included first
      expect(context.additionalInfo?.test?.[0]).toBe('high relevance');
    });

    it('should handle unavailable sources gracefully', async () => {
      const availableSource: ContextSource = {
        name: 'available',
        gather: vi.fn(async () => [{ source: 'available', content: 'content', relevance: 0.8 }]),
        isAvailable: vi.fn(async () => true),
      };

      const unavailableSource: ContextSource = {
        name: 'unavailable',
        gather: vi.fn(async () => []),
        isAvailable: vi.fn(async () => false),
      };

      gatherer.registerSource(availableSource);
      gatherer.registerSource(unavailableSource);

      const context = await gatherer.gatherContext('test query');

      expect(context.sourcesUsed).toContain('available');
      expect(context.sourcesUsed).not.toContain('unavailable');
      expect(unavailableSource.gather).not.toHaveBeenCalled();
    });

    it('should handle source errors gracefully', async () => {
      const errorSource: ContextSource = {
        name: 'error-source',
        gather: vi.fn(async () => {
          throw new Error('Source error');
        }),
        isAvailable: vi.fn(async () => true),
      };

      const goodSource: ContextSource = {
        name: 'good-source',
        gather: vi.fn(async () => [{ source: 'good-source', content: 'content', relevance: 0.8 }]),
        isAvailable: vi.fn(async () => true),
      };

      gatherer.registerSource(errorSource);
      gatherer.registerSource(goodSource);

      const context = await gatherer.gatherContext('test query');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'error-source' }),
        'Failed to gather from source'
      );
      expect(context.sourcesUsed).toContain('good-source');
      expect(context.sourcesUsed).not.toContain('error-source');
    });

    it('should organize chunks by source type', async () => {
      const source: ContextSource = {
        name: 'mixed-source',
        gather: vi.fn(async () => [
          { source: 'serena', content: 'code content', relevance: 0.9 },
          { source: 'memory', content: 'memory content', relevance: 0.8 },
          {
            source: 'file',
            content: 'file content',
            relevance: 0.7,
            metadata: { filepath: 'test.ts' },
          },
          { source: 'cclsp', content: 'lsp content', relevance: 0.6 },
        ]),
        isAvailable: vi.fn(async () => true),
      };

      gatherer.registerSource(source);

      const context = await gatherer.gatherContext('test query');

      expect(context.codeContext).toContain('code content');
      expect(context.memoryContext).toContain('memory content');
      expect(context.fileContents?.get('test.ts')).toBe('file content');
      expect(context.lspContext).toContain('lsp content');
    });

    it('should respect preferred sources option', async () => {
      const source1: ContextSource = {
        name: 'source1',
        gather: vi.fn(async () => [{ source: 'source1', content: 'content1', relevance: 0.9 }]),
        isAvailable: vi.fn(async () => true),
      };

      const source2: ContextSource = {
        name: 'source2',
        gather: vi.fn(async () => [{ source: 'source2', content: 'content2', relevance: 0.9 }]),
        isAvailable: vi.fn(async () => true),
      };

      gatherer.registerSource(source1);
      gatherer.registerSource(source2);

      const context = await gatherer.gatherContext('test query', {
        preferredSources: ['source1'],
      });

      expect(context.sourcesUsed).toContain('source1');
      expect(context.sourcesUsed).not.toContain('source2');
      expect(source1.gather).toHaveBeenCalled();
      expect(source2.gather).not.toHaveBeenCalled();
    });
  });

  describe('formatContextForLLM', () => {
    it('should format context into readable sections', () => {
      const context = {
        query: 'test query',
        codeContext: ['function foo() {}'],
        fileContents: new Map([['test.ts', 'const x = 1;']]),
        memoryContext: ['Previous decision: use TypeScript'],
        lspContext: ['Definition at line 10'],
        additionalInfo: { custom: ['custom info'] },
        totalTokens: 100,
        sourcesUsed: ['test'],
      };

      const formatted = ContextGatherer.formatContextForLLM(context);

      expect(formatted).toContain('## Code Context');
      expect(formatted).toContain('function foo() {}');
      expect(formatted).toContain('## File Contents');
      expect(formatted).toContain('### test.ts');
      expect(formatted).toContain('const x = 1;');
      expect(formatted).toContain('## Project Memory');
      expect(formatted).toContain('Previous decision: use TypeScript');
      expect(formatted).toContain('## LSP Information');
      expect(formatted).toContain('Definition at line 10');
      expect(formatted).toContain('## custom');
      expect(formatted).toContain('custom info');
    });

    it('should handle empty context sections gracefully', () => {
      const context = {
        query: 'test query',
        totalTokens: 0,
        sourcesUsed: [],
      };

      const formatted = ContextGatherer.formatContextForLLM(context);

      expect(formatted).toBe('');
    });
  });
});
