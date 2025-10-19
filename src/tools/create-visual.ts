import { z } from 'zod';

/**
 * Visual generation modes
 */
export const VisualMode = z.enum(['generate', 'edit', 'search']);
export type VisualModeType = z.infer<typeof VisualMode>;

/**
 * Base schema with common fields
 */
const BaseVisualSchema = z.object({
  mode: VisualMode.describe(
    'Operation mode: generate new images, edit existing images, or search for visual inspiration'
  ),
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .describe('Text description of the desired visual'),

  // GPT Image generation parameters (optional, defaults from config)
  model: z.literal('gpt-image-1').optional().describe('Image model to use'),
  size: z
    .enum(['1024x1024', '1536x1024', '1024x1536', 'auto'])
    .optional()
    .describe('Image dimensions'),
  quality: z.enum(['low', 'medium', 'high', 'auto']).optional().describe('Rendering quality'),
  background: z
    .enum(['transparent', 'opaque', 'auto'])
    .optional()
    .describe('Background transparency'),
  outputFormat: z.enum(['png', 'jpeg', 'webp']).optional().describe('Output image format'),
  outputCompression: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe('Compression level for JPEG/WebP (0-100)'),
  partialImages: z
    .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
    .optional()
    .describe('Number of partial images for streaming (0-3)'),
  n: z.coerce.number().int().min(1).max(10).optional().describe('Number of images to generate'),
});

/**
 * Generate mode schema
 */
const GenerateVisualSchema = BaseVisualSchema.extend({
  mode: z.literal('generate'),
}).strict();

/**
 * Edit mode schema
 */
const EditVisualSchema = BaseVisualSchema.extend({
  mode: z.literal('edit'),
  inputImages: z
    .array(z.string())
    .min(1, 'At least one input image is required for edit mode')
    .describe('Input images as base64 strings or file IDs'),
  inputImageMask: z
    .string()
    .optional()
    .describe('Optional mask image for inpainting (base64 or file ID)'),
  inputFidelity: z
    .enum(['low', 'high'])
    .optional()
    .describe('Input image detail preservation level'),
}).strict();

/**
 * Search mode schema
 */
const SearchVisualSchema = z
  .object({
    mode: z.literal('search'),
    prompt: z.string().min(1, 'Prompt is required').describe('Search query for visual inspiration'),
    searchMode: z
      .enum(['web', 'academic'])
      .optional()
      .describe('Search domain: web or academic papers'),
    searchRecencyFilter: z
      .enum(['week', 'month', 'year'])
      .optional()
      .describe('Filter results by recency'),
  })
  .strict();

/**
 * Complete input schema with discriminated union
 */
export const CreateVisualInputSchema = z.discriminatedUnion('mode', [
  GenerateVisualSchema,
  EditVisualSchema,
  SearchVisualSchema,
]);

export type CreateVisualInput = z.infer<typeof CreateVisualInputSchema>;

/**
 * Input sanitization helper
 */
export function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 4000); // Limit length to prevent abuse
}

/**
 * Validate that n does not exceed maxImages from config
 */
export function validateImageCount(n: number | undefined, maxImages: number): number {
  const count = n ?? 1;
  if (count > maxImages) {
    throw new Error(`Requested ${count} images, but maximum allowed is ${maxImages}`);
  }
  return count;
}
