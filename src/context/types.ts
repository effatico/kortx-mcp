export interface ContextChunk {
  source: string;
  content: string;
  relevance: number; // 0-1 score
  metadata?: Record<string, unknown>;
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

export interface ContextGatherOptions {
  maxTokens?: number;
  preferredSources?: string[];
  includeFileContent?: boolean;
}

export interface ContextSource {
  name: string;
  gather(query: string, options?: ContextGatherOptions): Promise<ContextChunk[]>;
  isAvailable(): Promise<boolean>;
}
