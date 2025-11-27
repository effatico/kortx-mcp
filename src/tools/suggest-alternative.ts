import { z } from 'zod';
import { BaseTool } from './base-tool.js';

/**
 * Input schema for suggest-alternative tool
 */
export const SuggestAlternativeInputSchema = z.object({
  currentApproach: z
    .string()
    .min(10, 'Current approach description must be at least 10 characters'),
  constraints: z.array(z.string()).optional().describe('Constraints or limitations to consider'),
  goals: z.array(z.string()).optional().describe('Goals or objectives to achieve'),
  preferredModel: z
    .enum([
      'gpt-5',
      'gpt-5-mini',
      'gpt-5-nano',
      'gpt-5-pro',
      'gpt-5-codex',
      'gpt-5.1-2025-11-13',
      'gpt-5.1-codex',
    ])
    .optional()
    .describe('Preferred GPT-5 model to use'),
});

export type SuggestAlternativeInput = z.infer<typeof SuggestAlternativeInputSchema>;

/**
 * Suggest Alternative Tool
 * Provides alternative approaches or solutions
 */
export class SuggestAlternativeTool extends BaseTool {
  private readonly SYSTEM_PROMPT = `You are a creative problem-solving consultant with expertise in software engineering, systems design, and innovative thinking.

Your role is to suggest alternative approaches and solutions. When analyzing a current approach, consider:

1. **Different Paradigms**: What if we approached this completely differently?
2. **Simpler Solutions**: Is there a simpler way that achieves 80% of the value?
3. **Proven Patterns**: What established patterns or best practices could apply?
4. **Trade-offs**: What are the pros and cons of each alternative?
5. **Constraints**: How do the given constraints shape the solution space?
6. **Innovation**: Are there emerging technologies or techniques that could help?

Provide your suggestions in a structured format:
- **Alternative Approaches**: 3-5 different ways to tackle this (ordered by recommendation)
- **For Each Alternative**:
  - Brief description
  - Key advantages
  - Key disadvantages
  - When to use it
- **Recommendation**: Which alternative you'd choose and why
- **Hybrid Approach**: Could elements be combined for a better solution?

Be creative but practical. Consider both incremental improvements and radical rethinks.`;

  async execute(input: SuggestAlternativeInput) {
    this.logger.info({ tool: 'suggest-alternative' }, 'Executing tool');

    // Build query for context gathering
    const parts = [`Current Approach: ${input.currentApproach}`];

    if (input.goals && input.goals.length > 0) {
      parts.push(`\nGoals:\n${input.goals.map(g => `- ${g}`).join('\n')}`);
    }

    if (input.constraints && input.constraints.length > 0) {
      parts.push(`\nConstraints:\n${input.constraints.map(c => `- ${c}`).join('\n')}`);
    }

    const query = parts.join('\n');

    // Execute consultation
    const result = await this.executeConsultation(query, this.SYSTEM_PROMPT, {
      gatherContext: true,
      preferredModel: input.preferredModel,
      toolName: 'suggest-alternative',
    });

    return this.formatToolResponse(result, {
      tool: 'suggest-alternative',
      constraintsCount: input.constraints?.length || 0,
      goalsCount: input.goals?.length || 0,
    });
  }
}
