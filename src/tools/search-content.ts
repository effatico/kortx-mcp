import { z } from 'zod';
import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import { PerplexityClient } from '../llm/perplexity-client.js';
import type { PerplexityRequest } from '../llm/types.js';

/**
 * Input schema for search-content tool
 */
export const SearchContentInputSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  model: z
    .enum(['sonar', 'sonar-pro', 'sonar-deep-research', 'sonar-reasoning', 'sonar-reasoning-pro'])
    .optional()
    .describe('Perplexity model to use for search'),
  searchMode: z
    .enum(['web', 'academic', 'sec'])
    .optional()
    .describe('Search mode: web for general, academic for research papers, sec for SEC filings'),
  searchRecencyFilter: z
    .enum(['week', 'month', 'year'])
    .optional()
    .describe('Filter results by recency'),
  searchDomainFilter: z
    .array(z.string())
    .optional()
    .describe('Filter to specific domains (e.g., ["github.com", "stackoverflow.com"])'),
  returnImages: z.boolean().optional().describe('Whether to return image results'),
  returnRelatedQuestions: z.boolean().optional().describe('Whether to return related questions'),
  reasoningEffort: z
    .enum(['low', 'medium', 'high'])
    .optional()
    .describe('Reasoning effort (only for sonar-deep-research model)'),
});

export type SearchContentInput = z.infer<typeof SearchContentInputSchema>;

/**
 * Search Content Tool
 * Performs real-time web search using Perplexity's Sonar models
 */
export class SearchContentTool {
  private config: Config;
  private logger: Logger;
  private perplexityClient: PerplexityClient;

  private readonly SYSTEM_PROMPT = `You are a web search assistant powered by Perplexity's Sonar models.

Your role is to search the web for real-time information and provide comprehensive, well-sourced answers.

When searching and responding:

1. **Comprehensive Coverage**: Search thoroughly and provide detailed, accurate information
2. **Citation Quality**: Always cite your sources with proper attribution
3. **Recency Awareness**: Prioritize recent information when relevant to the query
4. **Source Credibility**: Consider the authority and reliability of sources
5. **Contextual Understanding**: Understand the intent behind the query and provide relevant context
6. **Structured Response**: Organize information logically with clear sections

Response Format:
- **Summary**: Concise overview of findings
- **Key Points**: Main findings with citations
- **Sources**: List of cited sources with URLs
- **Related Questions**: Suggested follow-up questions (if enabled)

Always include citations in your response using the format: [Source Name](URL)`;

  constructor(config: Config, logger: Logger, perplexityClient: PerplexityClient) {
    this.config = config;
    this.logger = logger.child({ component: 'search-content-tool' });
    this.perplexityClient = perplexityClient;
  }

  async execute(input: SearchContentInput) {
    this.logger.info({ tool: 'search-content', query: input.query }, 'Executing search');

    const startTime = Date.now();

    // Build Perplexity request
    const request: PerplexityRequest = {
      messages: [
        { role: 'system', content: this.SYSTEM_PROMPT },
        { role: 'user', content: input.query },
      ],
      model: input.model || this.config.perplexity.model,
      searchMode: input.searchMode || this.config.perplexity.searchMode,
      searchRecencyFilter: input.searchRecencyFilter,
      searchDomainFilter: input.searchDomainFilter,
      returnImages: input.returnImages ?? this.config.perplexity.returnImages,
      returnRelatedQuestions:
        input.returnRelatedQuestions ?? this.config.perplexity.returnRelatedQuestions,
      reasoningEffort: input.reasoningEffort,
    };

    try {
      // Execute search with Perplexity
      const response = await this.perplexityClient.chat(request);

      const duration = Date.now() - startTime;

      // Calculate approximate cost (Perplexity pricing as of 2025)
      const cost = this.calculateCost(response.tokensUsed, response.model);

      this.logger.info(
        {
          model: response.model,
          tokensUsed: response.tokensUsed.total,
          citations: response.citations?.length || 0,
          cost,
          duration,
        },
        'Search complete'
      );

      return this.formatToolResponse(response, cost, {
        query: input.query,
        model: response.model,
        searchMode: request.searchMode,
        duration,
      });
    } catch (error) {
      this.logger.error({ error, query: input.query }, 'Search failed');
      throw error;
    }
  }

  /**
   * Calculate approximate cost based on token usage
   * Perplexity pricing (per 1M tokens, as of 2025)
   */
  private calculateCost(
    tokensUsed: {
      prompt: number;
      completion: number;
      total: number;
    },
    model: string
  ): number {
    // Pricing per 1M tokens
    const pricing: Record<string, { input: number; output: number }> = {
      sonar: { input: 1.0, output: 1.0 },
      'sonar-pro': { input: 3.0, output: 15.0 },
      'sonar-reasoning': { input: 1.0, output: 5.0 },
      'sonar-reasoning-pro': { input: 3.0, output: 15.0 },
      'sonar-deep-research': { input: 5.0, output: 30.0 },
    };

    const rates = pricing[model] || pricing['sonar'];

    const inputCost = (tokensUsed.prompt / 1_000_000) * rates.input;
    const outputCost = (tokensUsed.completion / 1_000_000) * rates.output;

    return inputCost + outputCost;
  }

  /**
   * Format search result as MCP tool response
   */
  private formatToolResponse(
    response: {
      content: string;
      model: string;
      tokensUsed: { prompt: number; completion: number; total: number };
      finishReason: string;
      citations?: string[];
    },
    cost: number,
    metadata: {
      query: string;
      model: string;
      searchMode?: string;
      duration: number;
    }
  ) {
    const citationsSection =
      response.citations && response.citations.length > 0
        ? `\n\n**Citations:**\n${response.citations.map((citation, idx) => `${idx + 1}. ${citation}`).join('\n')}`
        : '';

    const responseText = [
      response.content,
      citationsSection,
      '\n---',
      `\n**Search Metadata:**`,
      `- Model: ${metadata.model}`,
      `- Search Mode: ${metadata.searchMode || 'web'}`,
      `- Duration: ${metadata.duration}ms`,
      `- Tokens Used: ${response.tokensUsed.total} (prompt: ${response.tokensUsed.prompt}, completion: ${response.tokensUsed.completion})`,
      `- Estimated Cost: $${cost.toFixed(6)}`,
      response.citations && response.citations.length > 0
        ? `- Sources: ${response.citations.length} citations`
        : null,
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
