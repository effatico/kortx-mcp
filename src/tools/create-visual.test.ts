import { describe, it, expect } from 'vitest';
import {
  CreateVisualInputSchema,
  sanitizePrompt,
  validateImageCount,
  type CreateVisualInput,
} from './create-visual.js';

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
