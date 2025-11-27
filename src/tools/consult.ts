import { z } from 'zod';
import { BaseTool } from './base-tool.js';

/**
 * Expert domain personas for consultation
 */
const DOMAIN_PROMPTS: Record<string, string> = {
  'software-architecture': `You are a senior software architect with 20+ years of experience designing scalable, maintainable systems.
Your expertise spans distributed systems, microservices, event-driven architectures, and domain-driven design.
You understand trade-offs between different architectural patterns and can guide decisions based on specific requirements.`,

  security: `You are a cybersecurity expert and application security specialist.
Your expertise covers OWASP vulnerabilities, secure coding practices, authentication/authorization patterns, encryption, and threat modeling.
You help identify security risks and recommend mitigations.`,

  performance: `You are a performance engineering expert specializing in optimization and scalability.
Your expertise includes profiling, caching strategies, database optimization, memory management, and load testing.
You identify bottlenecks and recommend evidence-based optimizations.`,

  database: `You are a database expert with deep knowledge of SQL, NoSQL, and NewSQL systems.
Your expertise covers schema design, query optimization, indexing strategies, replication, and data modeling.
You help choose the right database technology and optimize data access patterns.`,

  devops: `You are a DevOps and infrastructure expert.
Your expertise includes CI/CD pipelines, containerization, Kubernetes, cloud platforms (AWS/GCP/Azure), monitoring, and infrastructure as code.
You help design reliable, automated deployment processes.`,

  frontend: `You are a frontend architecture expert specializing in modern web development.
Your expertise covers React, Vue, Angular, state management, performance optimization, accessibility, and responsive design.
You guide decisions on component architecture and user experience.`,

  backend: `You are a backend development expert specializing in server-side systems.
Your expertise includes API design, service patterns, data processing, message queues, and integration patterns.
You help design robust, scalable backend services.`,

  'ai-ml': `You are an AI/ML engineering expert.
Your expertise covers machine learning pipelines, model deployment, MLOps, vector databases, and LLM integration patterns.
You guide decisions on AI system architecture and implementation.`,

  general: `You are a senior software engineering consultant with broad expertise across multiple domains.
You provide thoughtful, experienced guidance on technical decisions, trade-offs, and best practices.
You adapt your advice to the specific context and constraints provided.`,
};

/**
 * Input schema for consult tool
 */
export const ConsultInputSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  domain: z
    .enum([
      'software-architecture',
      'security',
      'performance',
      'database',
      'devops',
      'frontend',
      'backend',
      'ai-ml',
      'general',
    ])
    .optional()
    .default('general')
    .describe('Domain expertise to consult'),
  context: z.string().optional().describe('Additional context about the question'),
  constraints: z.array(z.string()).optional().describe('Constraints or limitations to consider'),
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

export type ConsultInput = z.infer<typeof ConsultInputSchema>;

/**
 * Consult Tool
 * Expert consultation with domain-specific personas
 */
export class ConsultTool extends BaseTool {
  private buildSystemPrompt(domain: string): string {
    const domainExpertise = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS['general'];

    return `${domainExpertise}

When answering questions:
1. **Understand First**: Make sure you understand the question and context fully
2. **Be Specific**: Provide concrete, actionable advice rather than generic guidance
3. **Consider Trade-offs**: Explain the pros and cons of your recommendations
4. **Cite Experience**: Reference relevant patterns, practices, or real-world examples
5. **Be Honest**: If you're uncertain or the question is outside your expertise, say so

Structure your response clearly:
- **Answer**: Direct response to the question
- **Reasoning**: Why this is the recommended approach
- **Considerations**: Important factors or trade-offs to keep in mind
- **Next Steps**: Concrete actions the asker can take (if applicable)

Be concise but thorough. Focus on practical, implementable advice.`;
  }

  async execute(input: ConsultInput) {
    const domain = input.domain || 'general';
    this.logger.info({ tool: 'consult', domain }, 'Executing tool');

    // Build query for context gathering
    const parts = [`Question: ${input.question}`];

    if (input.context) {
      parts.push(`\nContext: ${input.context}`);
    }

    if (input.constraints && input.constraints.length > 0) {
      parts.push(`\nConstraints:\n${input.constraints.map(c => `- ${c}`).join('\n')}`);
    }

    const query = parts.join('\n');
    const systemPrompt = this.buildSystemPrompt(domain);

    // Execute consultation
    const result = await this.executeConsultation(query, systemPrompt, {
      gatherContext: true,
      preferredModel: input.preferredModel,
      additionalContext: input.context,
      toolName: 'consult',
    });

    return this.formatToolResponse(result, {
      tool: 'consult',
      domain,
      questionLength: input.question.length,
      constraintsCount: input.constraints?.length || 0,
    });
  }
}
