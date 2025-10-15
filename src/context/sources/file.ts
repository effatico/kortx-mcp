import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from '../../utils/logger.js';
import type { ContextSource, ContextChunk, ContextGatherOptions } from '../types.js';

export class FileContextSource implements ContextSource {
  name = 'file';
  private logger: Logger;
  private workingDirectory: string;

  constructor(logger: Logger, workingDirectory: string = process.cwd()) {
    this.logger = logger.child({ contextSource: 'file' });
    this.workingDirectory = workingDirectory;
  }

  async isAvailable(): Promise<boolean> {
    // File source is always available
    return true;
  }

  async gather(query: string, options?: ContextGatherOptions): Promise<ContextChunk[]> {
    if (!options?.includeFileContent) {
      return [];
    }

    this.logger.debug({ query }, 'Gathering file context');

    const chunks: ContextChunk[] = [];

    try {
      // Extract file paths from query
      const filePaths = this.extractFilePaths(query);

      for (const filepath of filePaths) {
        try {
          const absolutePath = join(this.workingDirectory, filepath);

          // Check if file exists and is readable
          await access(absolutePath, constants.R_OK);

          const content = await readFile(absolutePath, 'utf-8');

          // Calculate relevance based on file size and query mention
          const relevance = this.calculateRelevance(filepath, query, content);

          chunks.push({
            source: this.name,
            content,
            relevance,
            metadata: {
              filepath,
              absolutePath,
              size: content.length,
            },
          });

          this.logger.debug({ filepath, size: content.length }, 'File read successfully');
        } catch (error) {
          this.logger.warn({ filepath, error }, 'Failed to read file');
        }
      }
    } catch (error) {
      this.logger.error({ error }, 'Error gathering file context');
    }

    return chunks;
  }

  private extractFilePaths(query: string): string[] {
    const paths: string[] = [];

    // Match common file path patterns
    // e.g., "check src/index.ts", "look at ./config/app.ts", "file:package.json"
    const patterns = [
      /(?:^|\s)([a-zA-Z0-9_\-./]+\.[a-zA-Z]{2,})/g, // Simple path with extension
      /file:([^\s]+)/gi, // file: protocol
      /`([^`]+\.[a-zA-Z]{2,})`/g, // backtick quoted paths
      /"([^"]+\.[a-zA-Z]{2,})"/g, // double quoted paths
      /'([^']+\.[a-zA-Z]{2,})'/g, // single quoted paths
    ];

    for (const pattern of patterns) {
      const matches = query.matchAll(pattern);
      for (const match of matches) {
        const path = match[1];
        if (path && !paths.includes(path)) {
          paths.push(path);
        }
      }
    }

    return paths;
  }

  private calculateRelevance(filepath: string, query: string, content: string): number {
    let relevance = 0.5; // Base relevance

    // Higher relevance if filepath is explicitly mentioned in query
    if (query.toLowerCase().includes(filepath.toLowerCase())) {
      relevance += 0.3;
    }

    // Slightly higher relevance for smaller files (easier to process)
    if (content.length < 10000) {
      relevance += 0.1;
    }

    // Lower relevance for very large files
    if (content.length > 50000) {
      relevance -= 0.2;
    }

    return Math.max(0, Math.min(1, relevance));
  }
}
