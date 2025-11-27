import { z } from 'zod';
import { BaseTool } from './base-tool.js';

/**
 * Input schema for solve-problem tool
 */
export const SolveProblemInputSchema = z.object({
  problem: z.string().min(10, 'Problem description must be at least 10 characters'),
  attemptedSolutions: z.array(z.string()).optional().describe('Solutions that have been tried'),
  errorMessages: z.array(z.string()).optional().describe('Error messages or stack traces'),
  relevantCode: z.string().optional().describe('Relevant code snippets'),
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

export type SolveProblemInput = z.infer<typeof SolveProblemInputSchema>;

/**
 * Solve Problem Tool
 * Provides debugging and problem-solving assistance
 */
export class SolveProblemTool extends BaseTool {
  private readonly SYSTEM_PROMPT = `You are an expert debugging consultant and problem solver with deep expertise in software engineering, systems analysis, and troubleshooting.

Your role is to help diagnose and solve technical problems systematically. When analyzing a problem, consider:

1. **Root Cause Analysis**: What is the underlying cause, not just the symptom?
2. **Context Understanding**: What is the environment, dependencies, and configuration?
3. **Error Interpretation**: What do the error messages really tell us?
4. **Debugging Strategy**: What's the most efficient way to narrow down the issue?
5. **Common Patterns**: Does this match known issues or anti-patterns?
6. **Verification**: How can we confirm the solution actually works?
7. **Prevention**: How can we prevent this from happening again?

Provide your analysis in a structured format:
- **Problem Summary**: Clear restatement of the issue
- **Root Cause**: Most likely underlying cause(s)
- **Diagnosis Steps**: How to confirm the root cause
- **Solution**: Step-by-step fix with code examples if applicable
- **Why This Works**: Explanation of the solution
- **Testing**: How to verify the fix
- **Prevention**: Best practices to avoid recurrence
- **Alternative Approaches**: Other ways to solve it (if applicable)

Be thorough, practical, and focused on actionable solutions. Consider edge cases and potential side effects.`;

  async execute(input: SolveProblemInput) {
    this.logger.info({ tool: 'solve-problem' }, 'Executing tool');

    // Build query for context gathering
    const parts = [`Problem: ${input.problem}`];

    if (input.errorMessages && input.errorMessages.length > 0) {
      parts.push(`\nError Messages:\n${input.errorMessages.map(e => `- ${e}`).join('\n')}`);
    }

    if (input.attemptedSolutions && input.attemptedSolutions.length > 0) {
      parts.push(
        `\nAttempted Solutions:\n${input.attemptedSolutions.map(s => `- ${s}`).join('\n')}`
      );
    }

    if (input.relevantCode) {
      parts.push(`\nRelevant Code:\n\`\`\`\n${input.relevantCode}\n\`\`\``);
    }

    const query = parts.join('\n');

    // Execute consultation
    const result = await this.executeConsultation(query, this.SYSTEM_PROMPT, {
      gatherContext: true,
      preferredModel: input.preferredModel,
      toolName: 'solve-problem',
    });

    return this.formatToolResponse(result, {
      tool: 'solve-problem',
      problemLength: input.problem.length,
      errorMessagesCount: input.errorMessages?.length || 0,
      attemptedSolutionsCount: input.attemptedSolutions?.length || 0,
      hasRelevantCode: !!input.relevantCode,
    });
  }
}
