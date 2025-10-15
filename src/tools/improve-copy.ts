import { z } from 'zod';
import { BaseTool } from './base-tool.js';

/**
 * Input schema for improve-copy tool
 */
export const ImproveCopyInputSchema = z.object({
  originalText: z.string().min(1, 'Original text cannot be empty'),
  purpose: z
    .string()
    .describe(
      'Purpose of the text (e.g., "technical documentation", "user-facing message", "error message")'
    ),
  targetAudience: z
    .string()
    .optional()
    .describe('Target audience (e.g., "developers", "end users", "stakeholders")'),
  preferredModel: z
    .enum(['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-pro', 'gpt-5-codex'])
    .optional()
    .describe('Preferred GPT-5 model to use'),
});

export type ImproveCopyInput = z.infer<typeof ImproveCopyInputSchema>;

/**
 * Improve Copy Tool
 * Improves text, documentation, or messaging
 */
export class ImproveCopyTool extends BaseTool {
  private readonly SYSTEM_PROMPT = `You are a professional technical writer and communications expert specializing in clear, effective writing for software development.

Your role is to improve text while maintaining its essential meaning and technical accuracy. When improving copy, consider:

1. **Clarity**: Is the message clear and unambiguous?
2. **Conciseness**: Can it be said more succinctly without losing meaning?
3. **Tone**: Is the tone appropriate for the audience and context?
4. **Structure**: Is the information organized logically?
5. **Technical Accuracy**: Are technical terms used correctly?
6. **Actionability**: For instructions, is it clear what the reader should do?
7. **Accessibility**: Can it be understood by the target audience?

Provide your improvements in a structured format:
- **Improved Version**: The rewritten text
- **Key Changes**: Bullet list of main improvements made
- **Rationale**: Why these changes improve the text
- **Alternative Versions**: 1-2 alternative phrasings (if applicable)
- **Additional Suggestions**: Other improvements to consider (if any)

Focus on making the text clearer, more professional, and more effective.`;

  async execute(input: ImproveCopyInput) {
    this.logger.info({ tool: 'improve-copy' }, 'Executing tool');

    // Build query for context gathering
    const parts = [`Original Text:\n${input.originalText}`, `\nPurpose: ${input.purpose}`];

    if (input.targetAudience) {
      parts.push(`Target Audience: ${input.targetAudience}`);
    }

    const query = parts.join('\n');

    // Execute consultation
    const result = await this.executeConsultation(query, this.SYSTEM_PROMPT, {
      gatherContext: false, // Don't gather context for copy improvement
      preferredModel: input.preferredModel,
    });

    return this.formatToolResponse(result, {
      tool: 'improve-copy',
      originalLength: input.originalText.length,
      purpose: input.purpose,
    });
  }
}
