import { z } from 'zod';
import { BaseTool } from './base-tool.js';

/**
 * Input schema for think-about-plan tool
 */
export const ThinkAboutPlanInputSchema = z.object({
  plan: z.string().min(10, 'Plan description must be at least 10 characters'),
  context: z.string().optional().describe('Additional context about the plan'),
  preferredModel: z
    .enum(['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-pro', 'gpt-5-codex'])
    .optional()
    .describe('Preferred GPT-5 model to use'),
});

export type ThinkAboutPlanInput = z.infer<typeof ThinkAboutPlanInputSchema>;

/**
 * Think About Plan Tool
 * Provides strategic feedback on plans and approaches
 */
export class ThinkAboutPlanTool extends BaseTool {
  private readonly SYSTEM_PROMPT = `You are a strategic planning consultant with deep expertise in software engineering, project management, and systems thinking.

Your role is to provide thoughtful, actionable feedback on plans and approaches. When analyzing a plan, consider:

1. **Clarity & Completeness**: Is the plan clear and well-defined? Are there gaps or ambiguities?
2. **Feasibility**: Is the plan realistic given typical constraints (time, resources, complexity)?
3. **Risks & Challenges**: What could go wrong? What are the potential blockers?
4. **Dependencies**: What assumptions does the plan make? What external factors could affect it?
5. **Alternative Approaches**: Are there better or simpler ways to achieve the same goal?
6. **Success Criteria**: How will success be measured? What does "done" look like?

Provide your feedback in a structured format:
- **Assessment**: Overall evaluation of the plan
- **Strengths**: What's good about this approach
- **Concerns**: Potential issues or risks
- **Suggestions**: Specific recommendations for improvement
- **Questions**: Important questions to consider before proceeding

Be direct, honest, and constructive. Focus on actionable insights.`;

  async execute(input: ThinkAboutPlanInput) {
    this.logger.info({ tool: 'think-about-plan' }, 'Executing tool');

    // Build query for context gathering
    const query = `Plan: ${input.plan}${input.context ? `\nContext: ${input.context}` : ''}`;

    // Execute consultation
    const result = await this.executeConsultation(query, this.SYSTEM_PROMPT, {
      gatherContext: true,
      preferredModel: input.preferredModel,
      additionalContext: input.context,
      toolName: 'think-about-plan',
    });

    return this.formatToolResponse(result, {
      tool: 'think-about-plan',
      planLength: input.plan.length,
    });
  }
}
