import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import { logContextGathering } from '../utils/logger.js';
import type {
  ContextSource,
  ContextChunk,
  ContextGatherOptions,
  ConsultationContext,
} from './types.js';
import { encoding_for_model, type TiktokenModel } from 'tiktoken';

export class ContextGatherer {
  private sources: Map<string, ContextSource> = new Map();
  private config: Config;
  private logger: Logger;
  private tokenizer: ReturnType<typeof encoding_for_model> | null = null;

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger.child({ component: 'context-gatherer' });

    // Initialize tokenizer (lazy loaded on first use)
    try {
      // Use cl100k_base encoding (used by GPT-4 and GPT-5 models)
      this.tokenizer = encoding_for_model('gpt-4' as TiktokenModel);
      this.logger.debug('Tokenizer initialized successfully');
    } catch (error) {
      this.logger.warn({ error }, 'Failed to initialize tokenizer, falling back to estimation');
      this.tokenizer = null;
    }
  }

  registerSource(source: ContextSource): void {
    this.sources.set(source.name, source);
    this.logger.info({ source: source.name }, 'Context source registered');
  }

  async gatherContext(
    query: string,
    options: ContextGatherOptions = {}
  ): Promise<ConsultationContext> {
    const maxTokens = options.maxTokens || this.config.context.maxContextTokens;
    const startTime = Date.now();

    this.logger.debug({ query, options }, 'Starting context gathering');

    const chunks: ContextChunk[] = [];
    let totalTokens = 0;

    // Get active sources based on config and preferences
    const activeSources = await this.getActiveSources(options.preferredSources);

    // Gather from all sources in parallel
    const gatherPromises = activeSources.map(async source => {
      try {
        const sourceChunks = await source.gather(query, options);
        return { source: source.name, chunks: sourceChunks };
      } catch (error) {
        this.logger.warn({ source: source.name, error }, 'Failed to gather from source');
        return { source: source.name, chunks: [] };
      }
    });

    const results = await Promise.allSettled(gatherPromises);

    // Collect all chunks from successful sources
    for (const result of results) {
      if (result.status === 'fulfilled') {
        chunks.push(...result.value.chunks);
      }
    }

    // Sort by relevance
    const sortedChunks = chunks.sort((a, b) => b.relevance - a.relevance);

    // Select chunks up to token limit
    const selectedChunks: ContextChunk[] = [];
    for (const chunk of sortedChunks) {
      const chunkTokens = this.estimateTokens(chunk.content);

      if (totalTokens + chunkTokens <= maxTokens) {
        selectedChunks.push(chunk);
        totalTokens += chunkTokens;
      }
    }

    const duration = Date.now() - startTime;
    const sourcesUsed = [...new Set(selectedChunks.map(c => c.source))];

    logContextGathering(this.logger, sourcesUsed, totalTokens, duration);

    return this.buildContext(selectedChunks, query, totalTokens, sourcesUsed);
  }

  private async getActiveSources(preferred?: string[]): Promise<ContextSource[]> {
    const sources: ContextSource[] = [];

    if (preferred && preferred.length > 0) {
      // Use only preferred sources
      for (const name of preferred) {
        const source = this.sources.get(name);
        if (source && (await source.isAvailable())) {
          sources.push(source);
        }
      }
    } else {
      // Use all available sources based on config
      for (const [name, source] of this.sources.entries()) {
        const isEnabled = this.isSourceEnabled(name);
        const isAvailable = await source.isAvailable();

        if (isEnabled && isAvailable) {
          sources.push(source);
        }
      }
    }

    return sources;
  }

  private isSourceEnabled(sourceName: string): boolean {
    switch (sourceName) {
      case 'serena':
        return this.config.context.enableSerena;
      case 'memory':
        return this.config.context.enableMemory;
      case 'cclsp':
        return this.config.context.enableCclsp;
      case 'file':
        return this.config.context.includeFileContent;
      default:
        return true;
    }
  }

  private buildContext(
    chunks: ContextChunk[],
    query: string,
    totalTokens: number,
    sourcesUsed: string[]
  ): ConsultationContext {
    const context: ConsultationContext = {
      query,
      codeContext: [],
      fileContents: new Map(),
      memoryContext: [],
      lspContext: [],
      additionalInfo: {},
      totalTokens,
      sourcesUsed,
    };

    for (const chunk of chunks) {
      switch (chunk.source) {
        case 'serena':
          context.codeContext?.push(chunk.content);
          break;
        case 'memory':
          context.memoryContext?.push(chunk.content);
          break;
        case 'cclsp':
          context.lspContext?.push(chunk.content);
          break;
        case 'file':
          if (chunk.metadata?.filepath && typeof chunk.metadata.filepath === 'string') {
            context.fileContents?.set(chunk.metadata.filepath, chunk.content);
          }
          break;
        default:
          if (!context.additionalInfo) {
            context.additionalInfo = {};
          }
          if (!context.additionalInfo[chunk.source]) {
            context.additionalInfo[chunk.source] = [];
          }
          context.additionalInfo[chunk.source].push(chunk.content);
      }
    }

    return context;
  }

  private estimateTokens(text: string): number {
    if (this.tokenizer) {
      try {
        // Use tiktoken for accurate token counting
        const tokens = this.tokenizer.encode(text);
        return tokens.length;
      } catch (error) {
        this.logger.warn({ error }, 'Token encoding failed, using fallback estimation');
      }
    }

    // Fallback: Rough estimate ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Convert ConsultationContext to LLM-friendly format
   */
  static formatContextForLLM(context: ConsultationContext): string {
    const sections: string[] = [];

    if (context.codeContext && context.codeContext.length > 0) {
      sections.push('## Code Context\n' + context.codeContext.join('\n\n'));
    }

    if (context.fileContents && context.fileContents.size > 0) {
      const fileSection = ['## File Contents'];
      for (const [filepath, content] of context.fileContents.entries()) {
        fileSection.push(`### ${filepath}\n\`\`\`\n${content}\n\`\`\``);
      }
      sections.push(fileSection.join('\n'));
    }

    if (context.memoryContext && context.memoryContext.length > 0) {
      sections.push('## Project Memory\n' + context.memoryContext.join('\n\n'));
    }

    if (context.lspContext && context.lspContext.length > 0) {
      sections.push('## LSP Information\n' + context.lspContext.join('\n\n'));
    }

    if (context.additionalInfo && Object.keys(context.additionalInfo).length > 0) {
      for (const [source, items] of Object.entries(context.additionalInfo)) {
        sections.push(`## ${source}\n` + items.join('\n\n'));
      }
    }

    return sections.join('\n\n---\n\n');
  }
}
