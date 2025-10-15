import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { getConfig } from './config/index.js';
import {
  createLogger,
  logApplicationStart,
  logApplicationShutdown,
  logMCPServerStarted,
  logConfigurationLoaded,
  logToolExecutionStart,
  logToolExecutionComplete,
} from './utils/logger.js';
import { OpenAIClient } from './llm/openai-client.js';
import { ContextGatherer } from './context/gatherer.js';
import { FileContextSource } from './context/sources/file.js';
import { SerenaContextSource } from './context/sources/serena.js';
import { MemoryContextSource } from './context/sources/memory.js';
import { CclspContextSource } from './context/sources/cclsp.js';
import { ThinkAboutPlanTool, ThinkAboutPlanInputSchema } from './tools/think-about-plan.js';
import {
  SuggestAlternativeTool,
  SuggestAlternativeInputSchema,
} from './tools/suggest-alternative.js';
import { ImproveCopyTool, ImproveCopyInputSchema } from './tools/improve-copy.js';
import { SolveProblemTool, SolveProblemInputSchema } from './tools/solve-problem.js';

/**
 * Main MCP server for GPT-5 consultation
 */
export class MCPConsultantServer {
  private server: Server;
  private config: ReturnType<typeof getConfig>;
  private logger: ReturnType<typeof createLogger>;
  private openaiClient: OpenAIClient;
  private contextGatherer: ContextGatherer;
  private thinkAboutPlanTool: ThinkAboutPlanTool;
  private suggestAlternativeTool: SuggestAlternativeTool;
  private improveCopyTool: ImproveCopyTool;
  private solveProblemTool: SolveProblemTool;

  constructor() {
    // Load configuration
    this.config = getConfig();
    this.logger = createLogger(this.config);

    // Log configuration loaded
    logConfigurationLoaded(this.logger);
    logApplicationStart(this.logger, {
      name: this.config.server.name,
      version: this.config.server.version,
      logLevel: this.config.server.logLevel,
      transport: this.config.server.transport,
    });

    // Initialize core services
    this.openaiClient = new OpenAIClient(this.config, this.logger);
    this.contextGatherer = new ContextGatherer(this.config, this.logger);

    // Register context sources
    this.registerContextSources();

    // Initialize tools
    this.thinkAboutPlanTool = new ThinkAboutPlanTool(
      this.config,
      this.logger,
      this.openaiClient,
      this.contextGatherer
    );
    this.suggestAlternativeTool = new SuggestAlternativeTool(
      this.config,
      this.logger,
      this.openaiClient,
      this.contextGatherer
    );
    this.improveCopyTool = new ImproveCopyTool(
      this.config,
      this.logger,
      this.openaiClient,
      this.contextGatherer
    );
    this.solveProblemTool = new SolveProblemTool(
      this.config,
      this.logger,
      this.openaiClient,
      this.contextGatherer
    );

    // Create MCP server
    this.server = new Server(
      {
        name: this.config.server.name,
        version: this.config.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register tools
    this.registerTools();

    // Setup error handlers
    this.setupErrorHandlers();

    this.logger.info(
      {
        name: this.config.server.name,
        version: this.config.server.version,
      },
      'MCP Consultant server initialized'
    );
  }

  /**
   * Register context sources with the gatherer
   */
  private registerContextSources(): void {
    const workingDir = process.cwd();

    // File source (always available)
    const fileSource = new FileContextSource(this.logger, workingDir);
    this.contextGatherer.registerSource(fileSource);

    // Serena source (MCP integration - optional)
    const serenaSource = new SerenaContextSource(this.logger);
    this.contextGatherer.registerSource(serenaSource);

    // Memory source (MCP integration - optional)
    const memorySource = new MemoryContextSource(this.logger);
    this.contextGatherer.registerSource(memorySource);

    // Cclsp source (MCP integration - optional)
    const cclspSource = new CclspContextSource(this.logger);
    this.contextGatherer.registerSource(cclspSource);

    this.logger.info('Context sources registered');
  }

  /**
   * Register MCP tools with the server
   */
  private registerTools(): void {
    // Register tools/list handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'think-about-plan',
            description:
              'Get strategic feedback on plans and approaches. Analyzes clarity, feasibility, risks, dependencies, and suggests alternatives.',
            inputSchema: {
              type: 'object',
              properties: {
                plan: {
                  type: 'string',
                  description: 'Description of the plan to analyze',
                  minLength: 10,
                },
                context: {
                  type: 'string',
                  description: 'Additional context about the plan',
                },
                preferredModel: {
                  type: 'string',
                  enum: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-pro', 'gpt-5-codex'],
                  description: 'Preferred GPT-5 model to use',
                },
              },
              required: ['plan'],
            },
          },
          {
            name: 'suggest-alternative',
            description:
              'Suggest alternative approaches or solutions. Considers different paradigms, simpler solutions, proven patterns, and trade-offs.',
            inputSchema: {
              type: 'object',
              properties: {
                currentApproach: {
                  type: 'string',
                  description: 'Current approach description',
                  minLength: 10,
                },
                constraints: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Constraints or limitations to consider',
                },
                goals: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Goals or objectives to achieve',
                },
                preferredModel: {
                  type: 'string',
                  enum: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-pro', 'gpt-5-codex'],
                  description: 'Preferred GPT-5 model to use',
                },
              },
              required: ['currentApproach'],
            },
          },
          {
            name: 'improve-copy',
            description:
              'Improve text, documentation, or messaging. Focuses on clarity, conciseness, tone, structure, technical accuracy, and accessibility.',
            inputSchema: {
              type: 'object',
              properties: {
                originalText: {
                  type: 'string',
                  description: 'Original text to improve',
                  minLength: 1,
                },
                purpose: {
                  type: 'string',
                  description:
                    'Purpose of the text (e.g., "technical documentation", "user-facing message", "error message")',
                },
                targetAudience: {
                  type: 'string',
                  description: 'Target audience (e.g., "developers", "end users", "stakeholders")',
                },
                preferredModel: {
                  type: 'string',
                  enum: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-pro', 'gpt-5-codex'],
                  description: 'Preferred GPT-5 model to use',
                },
              },
              required: ['originalText', 'purpose'],
            },
          },
          {
            name: 'solve-problem',
            description:
              'Debug and problem-solving assistance. Performs root cause analysis, provides diagnosis steps, solutions, testing guidance, and prevention strategies.',
            inputSchema: {
              type: 'object',
              properties: {
                problem: {
                  type: 'string',
                  description: 'Description of the problem',
                  minLength: 10,
                },
                attemptedSolutions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Solutions that have been tried',
                },
                errorMessages: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Error messages or stack traces',
                },
                relevantCode: {
                  type: 'string',
                  description: 'Relevant code snippets',
                },
                preferredModel: {
                  type: 'string',
                  enum: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-pro', 'gpt-5-codex'],
                  description: 'Preferred GPT-5 model to use',
                },
              },
              required: ['problem'],
            },
          },
        ],
      };
    });

    // Register tools/call handler
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      logToolExecutionStart(this.logger, name, args);

      try {
        let result;
        switch (name) {
          case 'think-about-plan': {
            const input = ThinkAboutPlanInputSchema.parse(args);
            result = await this.thinkAboutPlanTool.execute(input);
            break;
          }

          case 'suggest-alternative': {
            const input = SuggestAlternativeInputSchema.parse(args);
            result = await this.suggestAlternativeTool.execute(input);
            break;
          }

          case 'improve-copy': {
            const input = ImproveCopyInputSchema.parse(args);
            result = await this.improveCopyTool.execute(input);
            break;
          }

          case 'solve-problem': {
            const input = SolveProblemInputSchema.parse(args);
            result = await this.solveProblemTool.execute(input);
            break;
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

        const duration = Date.now() - startTime;
        logToolExecutionComplete(this.logger, name, duration, true);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logToolExecutionComplete(this.logger, name, duration, false);

        if (error instanceof McpError) {
          throw error;
        }
        this.logger.error({ error, tool: name }, 'Tool execution error');
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    this.logger.info('MCP tools registered');
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    this.server.onerror = error => {
      this.logger.error({ error }, 'MCP server error');
    };

    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
  }

  /**
   * Start server with stdio transport
   */
  async startStdio(): Promise<void> {
    this.logger.info('Starting MCP server with stdio transport');

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logMCPServerStarted(this.logger, 'stdio');
  }

  /**
   * Start server with HTTP transport
   * Note: For now, HTTP transport is not fully implemented
   * Use stdio transport for Claude Code integration
   */
  async startHttp(_port?: number): Promise<void> {
    this.logger.warn(
      'HTTP transport not yet implemented. Please use stdio transport for Claude Code integration.'
    );
    throw new Error('HTTP transport not yet implemented');
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(signal: string): Promise<void> {
    logApplicationShutdown(this.logger, signal);

    try {
      await this.server.close();
      this.logger.info('MCP server closed');
      process.exit(0);
    } catch (error) {
      this.logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  }
}

/**
 * Main entry point
 */
export async function main(): Promise<void> {
  const server = new MCPConsultantServer();

  // Determine transport mode from environment or default to stdio
  const transport = process.env.TRANSPORT || 'stdio';

  if (transport === 'http') {
    await server.startHttp();
  } else {
    await server.startStdio();
  }
}
