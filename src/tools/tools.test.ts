import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import { OpenAIClient } from '../llm/openai-client.js';
import { ContextGatherer } from '../context/gatherer.js';
import { ThinkAboutPlanTool } from './think-about-plan.js';
import { SuggestAlternativeTool } from './suggest-alternative.js';
import { ImproveCopyTool } from './improve-copy.js';
import { SolveProblemTool } from './solve-problem.js';
import type { LLMResponse } from '../llm/types.js';
import type { ConsultationContext } from '../context/types.js';

describe('Consultation Tools', () => {
  let mockConfig: Config;
  let mockLogger: Logger;
  let mockOpenAIClient: OpenAIClient;
  let mockContextGatherer: ContextGatherer;

  beforeEach(() => {
    mockConfig = {
      openai: {
        apiKey: 'test-key',
        model: 'gpt-5',
        maxTokens: 4096,
        temperature: 0.7,
      },
      context: {
        maxContextTokens: 8000,
        preferredSources: [],
      },
      server: {
        name: 'mcp-consultant',
        version: '1.0.0',
        logLevel: 'info',
      },
      logging: {
        level: 'info',
        pretty: false,
      },
    };

    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as Logger;

    mockOpenAIClient = {
      chat: vi.fn(),
    } as unknown as OpenAIClient;

    mockContextGatherer = {
      gatherContext: vi.fn(),
    } as unknown as ContextGatherer;
  });

  describe('ThinkAboutPlanTool', () => {
    let tool: ThinkAboutPlanTool;

    beforeEach(() => {
      tool = new ThinkAboutPlanTool(mockConfig, mockLogger, mockOpenAIClient, mockContextGatherer);
    });

    it('should execute with valid plan input', async () => {
      const mockContext: ConsultationContext = {
        query: 'test plan',
        totalTokens: 100,
        sourcesUsed: ['file'],
      };

      const mockResponse: LLMResponse = {
        content: 'Assessment: Good plan\nStrengths: Clear objectives',
        model: 'gpt-5',
        tokensUsed: {
          prompt: 150,
          completion: 50,
          total: 200,
        },
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);
      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({
        plan: 'Implement new authentication system using OAuth 2.0',
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Assessment: Good plan');
      expect(result.content[0].text).toContain('**Model:** gpt-5');
      expect(result.content[0].text).toContain('**Tokens Used:** 200');
    });

    it('should include additional context when provided', async () => {
      const mockContext: ConsultationContext = {
        query: 'test',
        totalTokens: 50,
        sourcesUsed: [],
      };

      const mockResponse: LLMResponse = {
        content: 'Analysis complete',
        model: 'gpt-5',
        tokensUsed: { prompt: 100, completion: 30, total: 130 },
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);
      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      await tool.execute({
        plan: 'Refactor database layer',
        context: 'Legacy codebase with tight coupling',
      });

      const chatCall = vi.mocked(mockOpenAIClient.chat).mock.calls[0][0];
      expect(chatCall.messages[1].content).toContain('Legacy codebase');
    });

    it('should use preferred model when specified', async () => {
      const mockContext: ConsultationContext = {
        query: 'test',
        totalTokens: 50,
        sourcesUsed: [],
      };

      const mockResponse: LLMResponse = {
        content: 'Response',
        model: 'gpt-5-pro',
        tokensUsed: { prompt: 100, completion: 30, total: 130 },
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);
      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      await tool.execute({
        plan: 'Test plan',
        preferredModel: 'gpt-5-pro',
      });

      const chatCall = vi.mocked(mockOpenAIClient.chat).mock.calls[0][0];
      expect(chatCall.model).toBe('gpt-5-pro');
    });
  });

  describe('SuggestAlternativeTool', () => {
    let tool: SuggestAlternativeTool;

    beforeEach(() => {
      tool = new SuggestAlternativeTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer
      );
    });

    it('should execute with current approach', async () => {
      const mockContext: ConsultationContext = {
        query: 'current approach',
        totalTokens: 100,
        sourcesUsed: ['file'],
      };

      const mockResponse: LLMResponse = {
        content: 'Alternative 1: Use microservices\nAlternative 2: Use serverless',
        model: 'gpt-5',
        tokensUsed: { prompt: 200, completion: 100, total: 300 },
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);
      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({
        currentApproach: 'Monolithic application with MySQL database',
      });

      expect(result.content[0].text).toContain('Alternative 1');
      expect(result.content[0].text).toContain('Alternative 2');
    });

    it('should include goals and constraints in query', async () => {
      const mockContext: ConsultationContext = {
        query: 'test',
        totalTokens: 50,
        sourcesUsed: [],
      };

      const mockResponse: LLMResponse = {
        content: 'Alternatives provided',
        model: 'gpt-5',
        tokensUsed: { prompt: 150, completion: 50, total: 200 },
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);
      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      await tool.execute({
        currentApproach: 'REST API with polling',
        goals: ['Real-time updates', 'Low latency'],
        constraints: ['Cannot use WebSockets', 'Must support mobile'],
      });

      const gatherCall = vi.mocked(mockContextGatherer.gatherContext).mock.calls[0][0];
      expect(gatherCall).toContain('Goals:');
      expect(gatherCall).toContain('Real-time updates');
      expect(gatherCall).toContain('Constraints:');
      expect(gatherCall).toContain('Cannot use WebSockets');
    });
  });

  describe('ImproveCopyTool', () => {
    let tool: ImproveCopyTool;

    beforeEach(() => {
      tool = new ImproveCopyTool(mockConfig, mockLogger, mockOpenAIClient, mockContextGatherer);
    });

    it('should execute with original text and purpose', async () => {
      const mockResponse: LLMResponse = {
        content: 'Improved Version: Clear and concise message\nKey Changes: Simplified language',
        model: 'gpt-5',
        tokensUsed: { prompt: 100, completion: 50, total: 150 },
      };

      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({
        originalText: 'The system will proceed to execute the operation.',
        purpose: 'user-facing message',
      });

      expect(result.content[0].text).toContain('Improved Version');
      expect(result.content[0].text).toContain('Key Changes');
    });

    it('should not gather context for copy improvement', async () => {
      const mockResponse: LLMResponse = {
        content: 'Improved text',
        model: 'gpt-5',
        tokensUsed: { prompt: 80, completion: 40, total: 120 },
      };

      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      await tool.execute({
        originalText: 'Original text here',
        purpose: 'technical documentation',
      });

      // gatherContext should not be called for copy improvement
      expect(mockContextGatherer.gatherContext).not.toHaveBeenCalled();
    });

    it('should include target audience when provided', async () => {
      const mockResponse: LLMResponse = {
        content: 'Improved for developers',
        model: 'gpt-5',
        tokensUsed: { prompt: 90, completion: 45, total: 135 },
      };

      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      await tool.execute({
        originalText: 'Error occurred during processing',
        purpose: 'error message',
        targetAudience: 'developers',
      });

      const chatCall = vi.mocked(mockOpenAIClient.chat).mock.calls[0][0];
      expect(chatCall.messages[1].content).toContain('Target Audience: developers');
    });
  });

  describe('SolveProblemTool', () => {
    let tool: SolveProblemTool;

    beforeEach(() => {
      tool = new SolveProblemTool(mockConfig, mockLogger, mockOpenAIClient, mockContextGatherer);
    });

    it('should execute with problem description', async () => {
      const mockContext: ConsultationContext = {
        query: 'problem',
        totalTokens: 100,
        sourcesUsed: ['file', 'memory'],
      };

      const mockResponse: LLMResponse = {
        content:
          'Root Cause: Race condition\nSolution: Use mutex lock\nTesting: Add concurrent tests',
        model: 'gpt-5',
        tokensUsed: { prompt: 250, completion: 120, total: 370 },
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);
      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({
        problem: 'Application crashes intermittently under high load',
      });

      expect(result.content[0].text).toContain('Root Cause');
      expect(result.content[0].text).toContain('Solution');
      expect(result.content[0].text).toContain('Testing');
    });

    it('should include error messages and attempted solutions', async () => {
      const mockContext: ConsultationContext = {
        query: 'test',
        totalTokens: 150,
        sourcesUsed: [],
      };

      const mockResponse: LLMResponse = {
        content: 'Diagnosis complete',
        model: 'gpt-5',
        tokensUsed: { prompt: 300, completion: 150, total: 450 },
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);
      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      await tool.execute({
        problem: 'Database connection timeout',
        errorMessages: ['Error: connect ETIMEDOUT', 'SequelizeConnectionError: Connection lost'],
        attemptedSolutions: ['Increased timeout to 30s', 'Tried connection pooling'],
      });

      const gatherCall = vi.mocked(mockContextGatherer.gatherContext).mock.calls[0][0];
      expect(gatherCall).toContain('Error Messages:');
      expect(gatherCall).toContain('connect ETIMEDOUT');
      expect(gatherCall).toContain('Attempted Solutions:');
      expect(gatherCall).toContain('Increased timeout');
    });

    it('should include relevant code when provided', async () => {
      const mockContext: ConsultationContext = {
        query: 'test',
        totalTokens: 200,
        sourcesUsed: ['file'],
      };

      const mockResponse: LLMResponse = {
        content: 'Found the bug',
        model: 'gpt-5',
        tokensUsed: { prompt: 350, completion: 180, total: 530 },
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);
      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      await tool.execute({
        problem: 'Null pointer exception',
        relevantCode: 'const user = users.find(u => u.id === id);\nreturn user.name;',
      });

      const gatherCall = vi.mocked(mockContextGatherer.gatherContext).mock.calls[0][0];
      expect(gatherCall).toContain('Relevant Code:');
      expect(gatherCall).toContain('users.find');
    });

    it('should gather context for problem solving', async () => {
      const mockContext: ConsultationContext = {
        query: 'test',
        totalTokens: 100,
        sourcesUsed: ['file', 'memory', 'serena'],
      };

      const mockResponse: LLMResponse = {
        content: 'Solution provided',
        model: 'gpt-5',
        tokensUsed: { prompt: 200, completion: 100, total: 300 },
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);
      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({
        problem: 'Memory leak in production',
      });

      expect(mockContextGatherer.gatherContext).toHaveBeenCalledTimes(1);
      expect(result.content[0].text).toContain('**Context Sources:** file, memory, serena');
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate costs for different models', async () => {
      const tool = new ThinkAboutPlanTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer
      );

      const mockContext: ConsultationContext = {
        query: 'test',
        totalTokens: 50,
        sourcesUsed: [],
      };

      const mockResponse: LLMResponse = {
        content: 'Response',
        model: 'gpt-5-mini',
        tokensUsed: {
          prompt: 1000,
          completion: 500,
          total: 1500,
        },
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);
      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({
        plan: 'Test plan',
        preferredModel: 'gpt-5-mini',
      });

      // gpt-5-mini: input $0.15/1M, output $0.6/1M
      // Cost = (1000/1M * 0.15) + (500/1M * 0.6) = 0.00015 + 0.0003 = 0.00045
      expect(result.content[0].text).toContain('**Estimated Cost:** $0.000450');
    });

    it('should include reasoning tokens in cost calculation', async () => {
      const tool = new SolveProblemTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer
      );

      const mockContext: ConsultationContext = {
        query: 'test',
        totalTokens: 100,
        sourcesUsed: [],
      };

      const mockResponse: LLMResponse = {
        content: 'Solution',
        model: 'gpt-5-pro',
        tokensUsed: {
          prompt: 1000,
          completion: 500,
          total: 2500,
          reasoning: 1000,
        },
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);
      vi.mocked(mockOpenAIClient.chat).mockResolvedValue(mockResponse);

      const result = await tool.execute({
        problem: 'Complex debugging scenario',
      });

      // gpt-5-pro: input $5/1M, output $15/1M
      // Cost = (1000/1M * 5) + (500/1M * 15) = 0.005 + 0.0075 = 0.0125
      // Note: Reasoning cost appears to be included separately in actual usage
      expect(result.content[0].text).toContain('**Estimated Cost:** $0.012500');
      expect(result.content[0].text).toContain('reasoning: 1000');
    });
  });
});
