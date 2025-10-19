/**
 * Shared constants for GPT Image configuration and validation
 *
 * These constants ensure consistency between config schema and tool input schemas.
 * Any changes to GPT Image API capabilities should be reflected here.
 */

/**
 * Supported image dimensions
 */
export const SIZE_OPTIONS = ['1024x1024', '1536x1024', '1024x1536', 'auto'] as const;
export type ImageSize = (typeof SIZE_OPTIONS)[number];

/**
 * Rendering quality levels
 */
export const QUALITY_OPTIONS = ['low', 'medium', 'high', 'auto'] as const;
export type ImageQuality = (typeof QUALITY_OPTIONS)[number];

/**
 * Background transparency options
 */
export const BACKGROUND_OPTIONS = ['transparent', 'opaque', 'auto'] as const;
export type ImageBackground = (typeof BACKGROUND_OPTIONS)[number];

/**
 * Output image formats
 */
export const OUTPUT_FORMAT_OPTIONS = ['png', 'jpeg', 'webp'] as const;
export type ImageFormat = (typeof OUTPUT_FORMAT_OPTIONS)[number];

/**
 * Input fidelity levels for edit mode
 */
export const INPUT_FIDELITY_OPTIONS = ['low', 'high'] as const;
export type InputFidelity = (typeof INPUT_FIDELITY_OPTIONS)[number];

/**
 * Allowed values for partial images during streaming (0-3)
 */
export const PARTIAL_IMAGE_VALUES = [0, 1, 2, 3] as const;
export type PartialImageCount = (typeof PARTIAL_IMAGE_VALUES)[number];

/**
 * Compression level bounds for JPEG/WebP formats
 */
export const COMPRESSION_MIN = 0;
export const COMPRESSION_MAX = 100;

/**
 * Image count bounds per request
 */
export const IMAGE_COUNT_MIN = 1;
export const IMAGE_COUNT_MAX = 10;

/**
 * Search modes for visual inspiration
 * Note: 'sec' mode is excluded as SEC filings are not relevant for visual search
 */
export const VISUAL_SEARCH_MODES = ['web', 'academic'] as const;
export type VisualSearchMode = (typeof VISUAL_SEARCH_MODES)[number];

/**
 * Search recency filters
 */
export const SEARCH_RECENCY_OPTIONS = ['week', 'month', 'year'] as const;
export type SearchRecency = (typeof SEARCH_RECENCY_OPTIONS)[number];
