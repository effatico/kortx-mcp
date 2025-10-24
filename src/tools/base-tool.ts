import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import { OpenAIClient } from '../llm/openai-client.js';
import { ContextGatherer } from '../context/gatherer.js';
import type { LLMRequest } from '../llm/types.js';
import type { ConsultationResult } from './types.js';
import { ResponseCache } from '../utils/cache.js';

/**
 * Base tool helper for consultation tools
 * Handles context gathering, prompt building, and LLM invocation
 */
export class BaseTool {
  protected config: Config;
  protected logger: Logger;
  protected openaiClient: OpenAIClient;
  protected contextGatherer: ContextGatherer;
  protected cache: ResponseCache | null;

  constructor(
    config: Config,
    logger: Logger,
    openaiClient: OpenAIClient,
    contextGatherer: ContextGatherer,
    cache?: ResponseCache
  ) {
    this.config = config;
    this.logger = logger.child({ component: 'base-tool' });
    this.openaiClient = openaiClient;
    this.contextGatherer = contextGatherer;
    this.cache = cache || null;
  }

  /**
   * Stream a consultation with context gathering and progressive response
   * Yields chunks as they arrive from the LLM
   */
  protected async *streamConsultation(
    query: string,
    systemPrompt: string,
    options: {
      gatherContext?: boolean;
      preferredModel?: string;
      additionalContext?: string;
      toolName?: string;
      bypassCache?: boolean;
    } = {}
  ): AsyncGenerator<string, ConsultationResult, void> {
    const model = options.preferredModel || this.config.openai.model;

    this.logger.info({ query, model, streaming: true }, 'Starting streaming consultation');

    // Gather context if enabled
    let contextText = '';
    let contextSources: string[] = [];

    if (options.gatherContext !== false) {
      try {
        const context = await this.contextGatherer.gatherContext(query);
        contextText = ContextGatherer.formatContextForLLM(context);
        contextSources = context.sourcesUsed;

        this.logger.debug(
          { contextSources, contextTokens: context.totalTokens },
          'Context gathered'
        );
      } catch (error) {
        this.logger.warn({ error }, 'Failed to gather context, proceeding without it');
      }
    }

    // Build prompt
    const userPrompt = this.buildUserPrompt(query, contextText, options.additionalContext);

    // Check cache if enabled and not bypassing
    if (this.cache && this.config.cache.enableResponseCache && !options.bypassCache) {
      const cacheKey = this.cache.generateKey({
        tool: options.toolName || 'unknown',
        model,
        prompt: systemPrompt + userPrompt,
        context: contextText,
      });

      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        this.logger.info({ model, cacheHit: true, streaming: true }, 'Returning cached response');
        const cachedResult = JSON.parse(cachedResponse) as ConsultationResult;

        // Yield the cached response in chunks (simulate streaming)
        const chunkSize = 50;
        for (let i = 0; i < cachedResult.response.length; i += chunkSize) {
          yield cachedResult.response.slice(i, i + chunkSize);
        }

        return {
          ...cachedResult,
          contextSources, // Include current context sources
        };
      }
    }

    // Call OpenAI with streaming
    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model,
    };

    // Collect chunks and yield them as they arrive
    const chunks: string[] = [];

    const llmResponse = await this.openaiClient.chatStream(request, (chunk: string) => {
      chunks.push(chunk);
    });

    // Yield all collected chunks
    for (const chunk of chunks) {
      yield chunk;
    }

    // Calculate cost (approximate based on GPT-5 pricing)
    const cost = this.calculateCost(llmResponse.tokensUsed, model);

    this.logger.info(
      {
        model: llmResponse.model,
        tokensUsed: llmResponse.tokensUsed.total,
        cost,
        streaming: true,
      },
      'Streaming consultation complete'
    );

    const result: ConsultationResult = {
      response: llmResponse.content,
      model: llmResponse.model,
      tokensUsed: llmResponse.tokensUsed,
      contextSources,
      cost,
    };

    // Store in cache if enabled
    if (this.cache && this.config.cache.enableResponseCache && !options.bypassCache) {
      const cacheKey = this.cache.generateKey({
        tool: options.toolName || 'unknown',
        model,
        prompt: systemPrompt + userPrompt,
        context: contextText,
      });

      const ttl = this.config.cache.consultationTTLSeconds;
      this.cache.set(cacheKey, JSON.stringify(result), ttl);
    }

    return result;
  }

  /**
   * Execute a consultation with context gathering
   */
  protected async executeConsultation(
    query: string,
    systemPrompt: string,
    options: {
      gatherContext?: boolean;
      preferredModel?: string;
      additionalContext?: string;
      toolName?: string;
      bypassCache?: boolean;
    } = {}
  ): Promise<ConsultationResult> {
    const model = options.preferredModel || this.config.openai.model;

    this.logger.info({ query, model }, 'Starting consultation');

    // Gather context if enabled
    let contextText = '';
    let contextSources: string[] = [];

    if (options.gatherContext !== false) {
      try {
        const context = await this.contextGatherer.gatherContext(query);
        contextText = ContextGatherer.formatContextForLLM(context);
        contextSources = context.sourcesUsed;

        this.logger.debug(
          { contextSources, contextTokens: context.totalTokens },
          'Context gathered'
        );
      } catch (error) {
        this.logger.warn({ error }, 'Failed to gather context, proceeding without it');
      }
    }

    // Build prompt
    const userPrompt = this.buildUserPrompt(query, contextText, options.additionalContext);

    // Check cache if enabled and not bypassing
    if (this.cache && this.config.cache.enableResponseCache && !options.bypassCache) {
      const cacheKey = this.cache.generateKey({
        tool: options.toolName || 'unknown',
        model,
        prompt: systemPrompt + userPrompt,
        context: contextText,
      });

      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        this.logger.info({ model, cacheHit: true }, 'Returning cached response');
        const cachedResult = JSON.parse(cachedResponse) as ConsultationResult;
        return {
          ...cachedResult,
          contextSources, // Include current context sources
        };
      }
    }

    // Call OpenAI
    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model,
    };

    const response = await this.openaiClient.chat(request);

    // Calculate cost (approximate based on GPT-5 pricing)
    const cost = this.calculateCost(response.tokensUsed, model);

    this.logger.info(
      {
        model: response.model,
        tokensUsed: response.tokensUsed.total,
        cost,
      },
      'Consultation complete'
    );

    const result: ConsultationResult = {
      response: response.content,
      model: response.model,
      tokensUsed: response.tokensUsed,
      contextSources,
      cost,
    };

    // Store in cache if enabled
    if (this.cache && this.config.cache.enableResponseCache && !options.bypassCache) {
      const cacheKey = this.cache.generateKey({
        tool: options.toolName || 'unknown',
        model,
        prompt: systemPrompt + userPrompt,
        context: contextText,
      });

      const ttl = this.config.cache.consultationTTLSeconds;
      this.cache.set(cacheKey, JSON.stringify(result), ttl);
    }

    return result;
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(query: string, contextText: string, additionalContext?: string): string {
    const parts: string[] = [];

    if (contextText) {
      parts.push('# Relevant Context\n\n' + contextText);
      parts.push('\n---\n');
    }

    if (additionalContext) {
      parts.push('# Additional Context\n\n' + additionalContext);
      parts.push('\n---\n');
    }

    parts.push('# Query\n\n' + query);

    return parts.join('\n');
  }

  /**
   * Calculate approximate cost based on token usage
   * Rates as of 2025 (placeholder - update with actual rates)
   */
  private calculateCost(
    tokensUsed: {
      prompt: number;
      completion: number;
      total: number;
      reasoning?: number;
    },
    model: string
  ): number {
    // Placeholder pricing (per 1M tokens)
    const pricing: Record<string, { input: number; output: number; reasoning?: number }> = {
      'gpt-5': { input: 2.5, output: 10.0, reasoning: 5.0 },
      'gpt-5-mini': { input: 0.15, output: 0.6 },
      'gpt-5-nano': { input: 0.08, output: 0.3 },
      'gpt-5-pro': { input: 5.0, output: 15.0, reasoning: 10.0 },
      'gpt-5-codex': { input: 3.0, output: 12.0, reasoning: 6.0 },
    };

    const rates = pricing[model] || pricing['gpt-5'];

    const inputCost = (tokensUsed.prompt / 1_000_000) * rates.input;
    const outputCost = (tokensUsed.completion / 1_000_000) * rates.output;
    const reasoningCost = tokensUsed.reasoning
      ? (tokensUsed.reasoning / 1_000_000) * (rates.reasoning || rates.input)
      : 0;

    return inputCost + outputCost + reasoningCost;
  }

  /**
   * Format consultation result as MCP tool response
   */
  protected formatToolResponse(
    result: ConsultationResult,
    additionalInfo?: Record<string, unknown>
  ) {
    const responseText = [
      result.response,
      '\n---',
      `\n**Model:** ${result.model}`,
      `**Tokens Used:** ${result.tokensUsed.total} (prompt: ${result.tokensUsed.prompt}, completion: ${result.tokensUsed.completion}${result.tokensUsed.reasoning ? `, reasoning: ${result.tokensUsed.reasoning}` : ''})`,
      result.cost ? `**Estimated Cost:** $${result.cost.toFixed(6)}` : null,
      result.contextSources && result.contextSources.length > 0
        ? `**Context Sources:** ${result.contextSources.join(', ')}`
        : null,
      additionalInfo ? `\n**Additional Info:**\n${JSON.stringify(additionalInfo, null, 2)}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: responseText,
        },
      ],
    };
  }
}
