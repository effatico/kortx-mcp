import type { z } from 'zod';

export interface ToolContext {
  query: string;
  gatheredContext?: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
    reasoning?: number;
  };
}

export interface ToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface ConsultationResult {
  response: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
    reasoning?: number;
  };
  contextSources?: string[];
  cost?: number;
}

export type ToolSchema<T> = z.ZodType<T>;
