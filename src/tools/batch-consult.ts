import { z } from 'zod';
import type { Logger } from '../utils/logger.js';
import type { ThinkAboutPlanTool } from './think-about-plan.js';
import type { SuggestAlternativeTool } from './suggest-alternative.js';
import type { ImproveCopyTool } from './improve-copy.js';
import type { SolveProblemTool } from './solve-problem.js';
import type { ConsultTool } from './consult.js';
import type { SearchContentTool } from './search-content.js';
import type { CreateVisualTool } from './create-visual.js';

/**
 * Batch request item schema
 */
export const BatchRequestItemSchema = z.object({
  toolName: z.enum([
    'think-about-plan',
    'suggest-alternative',
    'improve-copy',
    'solve-problem',
    'consult',
    'search-content',
    'create-visual',
  ]),
  input: z.record(z.string(), z.any()),
  requestId: z.string().optional(),
});

/**
 * Batch consult input schema
 */
export const BatchConsultInputSchema = z.object({
  requests: z
    .array(BatchRequestItemSchema)
    .min(1)
    .max(10)
    .describe('Array of consultation requests (1-10 items)'),
});

export type BatchConsultInput = z.infer<typeof BatchConsultInputSchema>;
export type BatchRequestItem = z.infer<typeof BatchRequestItemSchema>;

/**
 * Batch response item
 */
export interface BatchResponseItem {
  requestId?: string;
  toolName: string;
  status: 'fulfilled' | 'rejected';
  result?: unknown;
  error?: string;
}

/**
 * Common interface for tool execute method
 */
interface ToolExecute {
  execute(input: Record<string, unknown>): Promise<unknown>;
}

/**
 * Tool instances interface
 */
export interface ToolInstances {
  thinkAboutPlan: ThinkAboutPlanTool;
  suggestAlternative: SuggestAlternativeTool;
  improveCopy: ImproveCopyTool;
  solveProblem: SolveProblemTool;
  consult: ConsultTool;
  searchContent: SearchContentTool;
  createVisual: CreateVisualTool;
}

/**
 * Batch consultation tool for parallel execution
 */
export class BatchConsultTool {
  private logger: Logger;
  private toolInstances: ToolInstances;

  constructor(logger: Logger, toolInstances: ToolInstances) {
    this.logger = logger;
    this.toolInstances = toolInstances;
  }

  /**
   * Execute batch consultation
   */
  async execute(input: BatchConsultInput): Promise<{ content: [{ type: string; text: string }] }> {
    const { requests } = input;

    this.logger.info(
      {
        batchSize: requests.length,
        tools: requests.map(r => r.toolName),
      },
      'Executing batch consultation'
    );

    // Execute all requests in parallel using Promise.allSettled for fault tolerance
    const results = await Promise.allSettled(
      requests.map(async (request, index) => {
        const { toolName, input: toolInput, requestId } = request;

        try {
          this.logger.debug(
            {
              toolName,
              requestId: requestId || index,
            },
            'Executing batch request item'
          );

          const tool = this.getToolInstance(toolName) as ToolExecute;
          const result = await tool.execute(toolInput);

          return {
            requestId,
            toolName,
            status: 'fulfilled' as const,
            result,
          };
        } catch (error) {
          this.logger.warn(
            {
              toolName,
              requestId: requestId || index,
              error: error instanceof Error ? error.message : String(error),
            },
            'Batch request item failed'
          );

          return {
            requestId,
            toolName,
            status: 'rejected' as const,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    // Transform Promise.allSettled results into batch response items
    const batchResults: BatchResponseItem[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // This should rarely happen since we already catch errors in the map function
        return {
          requestId: requests[index].requestId,
          toolName: requests[index].toolName,
          status: 'rejected',
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      }
    });

    const successCount = batchResults.filter(r => r.status === 'fulfilled').length;
    const failureCount = batchResults.filter(r => r.status === 'rejected').length;

    this.logger.info(
      {
        total: batchResults.length,
        success: successCount,
        failure: failureCount,
      },
      'Batch consultation completed'
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              batchResults,
              summary: {
                total: batchResults.length,
                success: successCount,
                failure: failureCount,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Get tool instance by name
   */
  private getToolInstance(
    toolName: string
  ):
    | ThinkAboutPlanTool
    | SuggestAlternativeTool
    | ImproveCopyTool
    | SolveProblemTool
    | ConsultTool
    | SearchContentTool
    | CreateVisualTool {
    switch (toolName) {
      case 'think-about-plan':
        return this.toolInstances.thinkAboutPlan;
      case 'suggest-alternative':
        return this.toolInstances.suggestAlternative;
      case 'improve-copy':
        return this.toolInstances.improveCopy;
      case 'solve-problem':
        return this.toolInstances.solveProblem;
      case 'consult':
        return this.toolInstances.consult;
      case 'search-content':
        return this.toolInstances.searchContent;
      case 'create-visual':
        return this.toolInstances.createVisual;
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
