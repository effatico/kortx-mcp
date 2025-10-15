export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
    reasoning?: number; // For models with reasoning
  };
  finishReason: string;
  reasoningContent?: string; // Hidden reasoning tokens
}

export interface LLMError extends Error {
  status?: number;
  code?: string;
  retryable?: boolean;
}

export interface ConsultationContext {
  query: string;
  codeContext?: string[];
  fileContents?: Map<string, string>;
  memoryContext?: string[];
  lspContext?: string[];
  additionalInfo?: Record<string, string[]>;
  totalTokens: number;
  sourcesUsed: string[];
}
