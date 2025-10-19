import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CreateVisualInputSchema,
  sanitizePrompt,
  validateImageCount,
  type CreateVisualInput,
  CreateVisualTool,
} from './create-visual.js';
import type { Config } from '../config/index.js';
import type { Logger } from '../utils/logger.js';
import { OpenAIClient } from '../llm/openai-client.js';
import { PerplexityClient } from '../llm/perplexity-client.js';
import { ContextGatherer } from '../context/gatherer.js';
import type { GPTImageResponse } from '../llm/types.js';
import type { ConsultationContext } from '../context/types.js';

describe('CreateVisualInputSchema', () => {
  describe('Generate mode', () => {
    it('should validate basic generate request', () => {
      const input = {
        mode: 'generate' as const,
        prompt: 'A sunset over mountains',
      };

      const result = CreateVisualInputSchema.parse(input);
      expect(result.mode).toBe('generate');
      expect(result.prompt).toBe('A sunset over mountains');
    });

    it('should validate generate request with all optional parameters', () => {
      const input: CreateVisualInput = {
        mode: 'generate',
        prompt: 'A futuristic city',
        model: 'gpt-image-1',
        size: '1536x1024',
        quality: 'high',
        background: 'transparent',
        outputFormat: 'png',
        outputCompression: 85,
        partialImages: 2,
        n: 4,
      };

      const result = CreateVisualInputSchema.parse(input);
      expect(result.size).toBe('1536x1024');
      expect(result.quality).toBe('high');
      expect(result.n).toBe(4);
    });

    it('should reject generate mode with inputImages', () => {
      const input = {
        mode: 'generate',
        prompt: 'A sunset',
        inputImages: ['base64string'],
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow();
    });

    it('should reject generate mode with inputImageMask', () => {
      const input = {
        mode: 'generate',
        prompt: 'A sunset',
        inputImageMask: 'base64mask',
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow();
    });

    it('should reject empty prompt', () => {
      const input = {
        mode: 'generate',
        prompt: '',
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow('Prompt is required');
    });
  });

  describe('Edit mode', () => {
    it('should validate basic edit request', () => {
      const input = {
        mode: 'edit' as const,
        prompt: 'Add a rainbow',
        inputImages: ['base64string1'],
      };

      const result = CreateVisualInputSchema.parse(input);
      expect(result.mode).toBe('edit');
      expect(result.inputImages).toHaveLength(1);
    });

    it('should validate edit request with mask and fidelity', () => {
      const input: CreateVisualInput = {
        mode: 'edit',
        prompt: 'Remove background',
        inputImages: ['base64string1', 'base64string2'],
        inputImageMask: 'base64mask',
        inputFidelity: 'high',
      };

      const result = CreateVisualInputSchema.parse(input);
      expect(result.inputImageMask).toBe('base64mask');
      expect(result.inputFidelity).toBe('high');
    });

    it('should validate edit request with all generation parameters', () => {
      const input: CreateVisualInput = {
        mode: 'edit',
        prompt: 'Enhance colors',
        inputImages: ['base64string'],
        size: '1024x1024',
        quality: 'medium',
        background: 'opaque',
        outputFormat: 'jpeg',
        outputCompression: 90,
        n: 2,
      };

      const result = CreateVisualInputSchema.parse(input);
      expect(result.size).toBe('1024x1024');
      expect(result.n).toBe(2);
    });

    it('should reject edit mode without inputImages', () => {
      const input = {
        mode: 'edit',
        prompt: 'Add a rainbow',
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow();
    });

    it('should reject edit mode with empty inputImages array', () => {
      const input = {
        mode: 'edit',
        prompt: 'Add a rainbow',
        inputImages: [],
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow(
        'At least one input image is required for edit mode'
      );
    });
  });

  describe('Search mode', () => {
    it('should validate basic search request', () => {
      const input = {
        mode: 'search' as const,
        prompt: 'modern architecture',
      };

      const result = CreateVisualInputSchema.parse(input);
      expect(result.mode).toBe('search');
      expect(result.prompt).toBe('modern architecture');
    });

    it('should validate search request with all parameters', () => {
      const input: CreateVisualInput = {
        mode: 'search',
        prompt: 'sustainable architecture',
        searchMode: 'academic',
        searchRecencyFilter: 'month',
      };

      const result = CreateVisualInputSchema.parse(input);
      expect(result.searchMode).toBe('academic');
      expect(result.searchRecencyFilter).toBe('month');
    });

    it('should reject search mode with image generation parameters', () => {
      const input = {
        mode: 'search',
        prompt: 'architecture',
        size: '1024x1024',
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow();
    });

    it('should reject search mode with inputImages', () => {
      const input = {
        mode: 'search',
        prompt: 'architecture',
        inputImages: ['base64string'],
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow();
    });

    it('should reject empty prompt in search mode', () => {
      const input = {
        mode: 'search',
        prompt: '',
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow('Prompt is required');
    });
  });

  describe('Parameter validation', () => {
    it('should validate partialImages with literal union', () => {
      const validValues = [0, 1, 2, 3];

      validValues.forEach(value => {
        const input = {
          mode: 'generate' as const,
          prompt: 'Test',
          partialImages: value,
        };
        expect(() => CreateVisualInputSchema.parse(input)).not.toThrow();
      });
    });

    it('should reject invalid partialImages value', () => {
      const input = {
        mode: 'generate',
        prompt: 'Test',
        partialImages: 5,
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow();
    });

    it('should validate n within range', () => {
      const input = {
        mode: 'generate' as const,
        prompt: 'Test',
        n: 5,
      };

      expect(() => CreateVisualInputSchema.parse(input)).not.toThrow();
    });

    it('should reject n below minimum', () => {
      const input = {
        mode: 'generate',
        prompt: 'Test',
        n: 0,
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow();
    });

    it('should reject n above maximum', () => {
      const input = {
        mode: 'generate',
        prompt: 'Test',
        n: 11,
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow();
    });

    it('should validate outputCompression range', () => {
      const validValues = [0, 50, 85, 100];

      validValues.forEach(value => {
        const input = {
          mode: 'generate' as const,
          prompt: 'Test',
          outputCompression: value,
        };
        expect(() => CreateVisualInputSchema.parse(input)).not.toThrow();
      });
    });

    it('should reject outputCompression out of range', () => {
      const input = {
        mode: 'generate',
        prompt: 'Test',
        outputCompression: 101,
      };

      expect(() => CreateVisualInputSchema.parse(input)).toThrow();
    });
  });
});

describe('sanitizePrompt', () => {
  it('should trim whitespace', () => {
    expect(sanitizePrompt('  test  ')).toBe('test');
  });

  it('should normalize multiple spaces', () => {
    expect(sanitizePrompt('hello    world')).toBe('hello world');
  });

  it('should limit length to 4000 characters', () => {
    const longPrompt = 'a'.repeat(5000);
    const result = sanitizePrompt(longPrompt);
    expect(result).toHaveLength(4000);
  });

  it('should handle newlines and tabs', () => {
    expect(sanitizePrompt('hello\n\tworld')).toBe('hello world');
  });

  it('should handle empty string', () => {
    expect(sanitizePrompt('')).toBe('');
  });
});

describe('validateImageCount', () => {
  it('should return count when within limit', () => {
    expect(validateImageCount(3, 5)).toBe(3);
  });

  it('should return 1 when n is undefined', () => {
    expect(validateImageCount(undefined, 5)).toBe(1);
  });

  it('should throw when count exceeds maxImages', () => {
    expect(() => validateImageCount(6, 5)).toThrow('Requested 6 images, but maximum allowed is 5');
  });

  it('should allow n equal to maxImages', () => {
    expect(validateImageCount(5, 5)).toBe(5);
  });
});

describe('CreateVisualTool', () => {
  let mockConfig: Config;
  let mockLogger: Logger;
  let mockOpenAIClient: OpenAIClient;
  let mockPerplexityClient: PerplexityClient;
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
        name: 'kortx-mcp',
        version: '1.0.0',
        logLevel: 'info',
      },
      logging: {
        level: 'info',
        pretty: false,
      },
      gptImage: {
        model: 'gpt-image-1',
        maxImages: 10,
        maxInputImages: 10,
      },
      perplexity: {
        apiKey: 'test-perplexity-key',
        model: 'sonar',
        maxTokens: 4096,
      },
    } as Config;

    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as Logger;

    mockOpenAIClient = {
      generateImage: vi.fn(),
      editImage: vi.fn(),
    } as unknown as OpenAIClient;

    mockPerplexityClient = {
      chat: vi.fn(),
    } as unknown as PerplexityClient;

    mockContextGatherer = {
      gatherContext: vi.fn(),
    } as unknown as ContextGatherer;
  });

  describe('Generate mode', () => {
    it('should call generateImage and format response correctly', async () => {
      const mockResponse: GPTImageResponse = {
        model: 'gpt-image-1',
        images: [
          {
            b64_json: 'base64encodedimage',
            revised_prompt: 'A beautiful sunset over mountains',
          },
        ],
        created: 1234567890,
      };

      const mockContext: ConsultationContext = {
        query: 'generate image',
        totalTokens: 100,
        sourcesUsed: ['context'],
      };

      vi.mocked(mockOpenAIClient.generateImage).mockResolvedValue(mockResponse);
      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      const result = await tool.execute({
        mode: 'generate',
        prompt: 'A sunset over mountains',
        n: 1,
        quality: 'medium',
      });

      expect(mockOpenAIClient.generateImage).toHaveBeenCalledWith({
        prompt: 'A sunset over mountains',
        model: 'gpt-image-1',
        n: 1,
        quality: 'medium',
      });

      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('**Model:** gpt-image-1');
      expect(result.content[0].text).toContain('Generated 1 image(s)');
      expect(result.content[1].type).toBe('image');
      expect(result.content[1].data).toBe('base64encodedimage');
    });

    it('should validate image count does not exceed maximum', async () => {
      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      await expect(
        tool.execute({
          mode: 'generate',
          prompt: 'Test',
          n: 15,
        })
      ).rejects.toThrow('Requested 15 images, but maximum allowed is 10');
    });

    it('should calculate costs correctly for different quality levels', async () => {
      const mockResponse: GPTImageResponse = {
        model: 'gpt-image-1',
        images: [{ b64_json: 'img1' }, { b64_json: 'img2' }],
        created: 1234567890,
      };

      const mockContext: ConsultationContext = {
        query: 'generate',
        totalTokens: 50,
        sourcesUsed: [],
      };

      vi.mocked(mockOpenAIClient.generateImage).mockResolvedValue(mockResponse);
      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      const result = await tool.execute({
        mode: 'generate',
        prompt: 'Test',
        n: 2,
        quality: 'high',
      });

      const textContent = result.content[0].text;
      expect(textContent).toContain('**Tokens Used:** 10400'); // 2 images * 5200 tokens (high quality)
    });
  });

  describe('Edit mode', () => {
    it('should call editImage and format response correctly', async () => {
      const mockResponse: GPTImageResponse = {
        model: 'gpt-image-1',
        images: [{ b64_json: 'editedimage' }],
        created: 1234567890,
      };

      const mockContext: ConsultationContext = {
        query: 'edit image',
        totalTokens: 100,
        sourcesUsed: [],
      };

      vi.mocked(mockOpenAIClient.editImage).mockResolvedValue(mockResponse);
      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      const result = await tool.execute({
        mode: 'edit',
        prompt: 'Add a rainbow',
        inputImages: ['base64input'],
        inputFidelity: 'high',
      });

      expect(mockOpenAIClient.editImage).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Add a rainbow',
          inputImages: ['base64input'],
          model: 'gpt-image-1',
          inputFidelity: 'high',
        })
      );

      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('**Model:** gpt-image-1');
      expect(result.content[1].type).toBe('image');
    });

    it('should enforce max output images limit', async () => {
      const customConfig = {
        ...mockConfig,
        gptImage: {
          ...mockConfig.gptImage,
          maxImages: 2,
        },
      };

      const tool = new CreateVisualTool(
        customConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      await expect(
        tool.execute({
          mode: 'edit',
          prompt: 'Edit',
          inputImages: ['img1'],
          n: 5,
        })
      ).rejects.toThrow('Requested 5 images, but maximum allowed is 2');
    });

    it('should calculate input fidelity tokens correctly', async () => {
      const mockResponse: GPTImageResponse = {
        model: 'gpt-image-1',
        images: [{ b64_json: 'edited' }],
        created: 1234567890,
      };

      const mockContext: ConsultationContext = {
        query: 'edit',
        totalTokens: 50,
        sourcesUsed: [],
      };

      vi.mocked(mockOpenAIClient.editImage).mockResolvedValue(mockResponse);
      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      const result = await tool.execute({
        mode: 'edit',
        prompt: 'Test',
        inputImages: ['img1', 'img2'],
        inputFidelity: 'high',
      });

      const textContent = result.content[0].text;
      expect(textContent).toContain('**Tokens Used:** 3320'); // input: 2000 (2 images * 1000 high fidelity) + output: 1320 (1 image medium quality)
    });
  });

  describe('Search mode', () => {
    it('should call PerplexityClient.chat and format results', async () => {
      const mockResponse = {
        content: 'Found beautiful landscape images in these galleries...',
        model: 'sonar',
        tokensUsed: {
          prompt: 100,
          completion: 200,
          total: 300,
        },
        finishReason: 'stop',
        citations: ['https://example.com/gallery1', 'https://example.com/gallery2'],
      };

      const mockContext: ConsultationContext = {
        query: 'search images',
        totalTokens: 50,
        sourcesUsed: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);
      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      const result = await tool.execute({
        mode: 'search',
        prompt: 'modern architecture',
        searchMode: 'web',
      });

      expect(mockPerplexityClient.chat).toHaveBeenCalled();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Found beautiful landscape images');
      expect(result.content[0].text).toContain('Citations');
      expect(result.content[0].text).toContain('https://example.com/gallery1');
    });

    it('should handle search without citations', async () => {
      const mockResponse = {
        content: 'Search results without citations',
        model: 'sonar',
        tokensUsed: {
          prompt: 50,
          completion: 100,
          total: 150,
        },
        finishReason: 'stop',
      };

      const mockContext: ConsultationContext = {
        query: 'search',
        totalTokens: 30,
        sourcesUsed: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);
      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      const result = await tool.execute({
        mode: 'search',
        prompt: 'test search',
      });

      expect(result.content[0].text).not.toContain('Citations');
    });

    it('should include image URLs when present in search results', async () => {
      const mockResponse = {
        content: 'Found images of modern architecture',
        model: 'sonar',
        tokensUsed: {
          prompt: 100,
          completion: 200,
          total: 300,
        },
        finishReason: 'stop',
        citations: ['https://example.com/source'],
        images: [
          {
            imageUrl: 'https://example.com/image1.jpg',
            originUrl: 'https://example.com/page1',
            width: 1920,
            height: 1080,
          },
          {
            imageUrl: 'https://example.com/image2.jpg',
            originUrl: 'https://example.com/page2',
            width: 1280,
            height: 720,
          },
        ],
      };

      const mockContext: ConsultationContext = {
        query: 'search images',
        totalTokens: 50,
        sourcesUsed: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);
      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      const result = await tool.execute({
        mode: 'search',
        prompt: 'modern architecture',
        searchMode: 'web',
      });

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Images Found:');
      expect(result.content[0].text).toContain('https://example.com/image1.jpg');
      expect(result.content[0].text).toContain('https://example.com/image2.jpg');
      expect(result.content[0].text).toContain('Source: https://example.com/page1');
      expect(result.content[0].text).toContain('Dimensions: 1920x1080');
      expect(result.content[0].text).toContain('Dimensions: 1280x720');
    });

    it('should include search results when present', async () => {
      const mockResponse = {
        content: 'Architecture search results',
        model: 'sonar',
        tokensUsed: {
          prompt: 100,
          completion: 200,
          total: 300,
        },
        finishReason: 'stop',
        searchResults: [
          {
            title: 'Modern Architecture Gallery',
            url: 'https://example.com/gallery',
            snippet: 'Collection of contemporary building designs',
          },
          {
            title: 'Architectural Digest',
            url: 'https://example.com/digest',
            snippet: 'Latest trends in architecture',
          },
        ],
      };

      const mockContext: ConsultationContext = {
        query: 'search',
        totalTokens: 50,
        sourcesUsed: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);
      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      const result = await tool.execute({
        mode: 'search',
        prompt: 'architecture',
      });

      expect(result.content[0].text).toContain('Search Results:');
      expect(result.content[0].text).toContain('Modern Architecture Gallery');
      expect(result.content[0].text).toContain('https://example.com/gallery');
      expect(result.content[0].text).toContain('Collection of contemporary building designs');
      expect(result.content[0].text).toContain('Architectural Digest');
    });

    it('should include both images and search results when both present', async () => {
      const mockResponse = {
        content: 'Comprehensive search results with images',
        model: 'sonar',
        tokensUsed: {
          prompt: 150,
          completion: 250,
          total: 400,
        },
        finishReason: 'stop',
        citations: ['https://example.com/source1'],
        images: [
          {
            imageUrl: 'https://example.com/img.jpg',
            originUrl: 'https://example.com/page',
          },
        ],
        searchResults: [
          {
            title: 'Architecture Resource',
            url: 'https://example.com/resource',
            snippet: 'Comprehensive architecture guide',
          },
        ],
      };

      const mockContext: ConsultationContext = {
        query: 'search',
        totalTokens: 50,
        sourcesUsed: [],
      };

      vi.mocked(mockPerplexityClient.chat).mockResolvedValue(mockResponse);
      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      const result = await tool.execute({
        mode: 'search',
        prompt: 'architecture',
      });

      const text = result.content[0].text as string;
      expect(text).toContain('Images Found:');
      expect(text).toContain('https://example.com/img.jpg');
      expect(text).toContain('Search Results:');
      expect(text).toContain('Architecture Resource');
      expect(text).toContain('Citations:');
      expect(text).toContain('https://example.com/source1');
    });
  });

  describe('Error handling', () => {
    it('should handle OpenAI API errors in generate mode', async () => {
      vi.mocked(mockOpenAIClient.generateImage).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const mockContext: ConsultationContext = {
        query: 'generate',
        totalTokens: 50,
        sourcesUsed: [],
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      await expect(
        tool.execute({
          mode: 'generate',
          prompt: 'Test',
        })
      ).rejects.toThrow('API rate limit exceeded');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle OpenAI API errors in edit mode', async () => {
      vi.mocked(mockOpenAIClient.editImage).mockRejectedValue(new Error('Invalid image format'));

      const mockContext: ConsultationContext = {
        query: 'edit',
        totalTokens: 50,
        sourcesUsed: [],
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      await expect(
        tool.execute({
          mode: 'edit',
          prompt: 'Edit',
          inputImages: ['invalid'],
        })
      ).rejects.toThrow('Invalid image format');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle Perplexity API errors in search mode', async () => {
      vi.mocked(mockPerplexityClient.chat).mockRejectedValue(new Error('Network timeout'));

      const mockContext: ConsultationContext = {
        query: 'search',
        totalTokens: 50,
        sourcesUsed: [],
      };

      vi.mocked(mockContextGatherer.gatherContext).mockResolvedValue(mockContext);

      const tool = new CreateVisualTool(
        mockConfig,
        mockLogger,
        mockOpenAIClient,
        mockContextGatherer,
        mockPerplexityClient
      );

      await expect(
        tool.execute({
          mode: 'search',
          prompt: 'Test',
        })
      ).rejects.toThrow('Network timeout');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
