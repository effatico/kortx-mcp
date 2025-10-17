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

// Perplexity-specific types
export interface PerplexityRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  searchMode?: 'academic' | 'sec' | 'web';
  disableSearch?: boolean;
  enableSearchClassifier?: boolean;
  searchDomainFilter?: Array<string>;
  searchRecencyFilter?: 'week' | 'month' | 'year';
  searchAfterDateFilter?: string; // MM/DD/YYYY format
  searchBeforeDateFilter?: string; // MM/DD/YYYY format
  lastUpdatedAfterFilter?: string; // MM/DD/YYYY format
  lastUpdatedBeforeFilter?: string; // MM/DD/YYYY format
  returnImages?: boolean;
  returnRelatedQuestions?: boolean;
  languagePreference?: string;
  webSearchOptions?: {
    context_size?: 'low' | 'medium' | 'high';
    user_location?: string;
  };
  mediaResponse?: {
    overrides?: {
      enable_video?: boolean;
      enable_images?: boolean;
    };
  };
  reasoningEffort?: 'low' | 'medium' | 'high'; // sonar-deep-research only
}

export interface PerplexityResponse {
  content: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason: string;
  citations?: Array<string>;
}
