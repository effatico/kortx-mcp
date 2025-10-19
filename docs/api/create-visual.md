# create-visual Tool API Documentation

The create-visual tool enables AI assistants to generate, edit, and search for images using GPT Image and Perplexity. It supports three distinct modes: generate (create new images), edit (modify existing images with multi-turn conversational editing), and search (find visual inspiration through web search).

## Overview

GPT Image (gpt-image-1) is OpenAI's image generation and editing model accessed through the Responses API. Unlike DALL-E, GPT Image supports multi-turn conversational workflows, allowing iterative refinement of images through natural dialogue. The tool also integrates Perplexity's web search for visual research and inspiration gathering.

### Key Capabilities

- **Image Generation**: Create images from text descriptions using GPT Image
- **Image Editing**: Modify existing images through conversational prompts with multi-turn refinement
- **Visual Search**: Find inspiration and reference images using Perplexity's web and academic search
- **Streaming Support**: Receive partial images during generation for faster preview
- **Transparency Control**: Generate images with transparent backgrounds
- **High Fidelity**: Preserve fine details like faces and logos during editing
- **Inpainting**: Edit specific regions using mask images

## Installation and Configuration

The create-visual tool is included in the kortx-mcp server. Configure it through environment variables:

### Required Configuration

```bash
# OpenAI API key for GPT Image access
OPENAI_API_KEY=your-openai-key

# Perplexity API key for search mode (optional)
PERPLEXITY_API_KEY=your-perplexity-key
```

### API Implementation Notes

**Important:** This tool uses OpenAI's **Responses API** (`responses.create()`) with the `image_generation` tool, not the direct Images API (`images.generate()`).

**Model Selection:**

- Responses API with `image_generation` tool → `model: "gpt-5"` (used internally)
- Direct Images API (not used) → `model: "gpt-image-1"`

**Input Image Format:**

- ✅ Base64-encoded images (inline: `data:image/png;base64,...`)
- ✅ Raw base64 strings (automatically prefixed with data URL)
- ❌ File IDs from `openai.files.create()` (not currently supported)

For file ID support, you would need to convert files to base64 first.

### Optional GPT Image Configuration

```bash
# Image generation defaults
GPT_IMAGE_SIZE=auto                    # Options: 1024x1024, 1536x1024, 1024x1536, auto (default)
GPT_IMAGE_QUALITY=auto                 # Options: low, medium, high, auto (default)
GPT_IMAGE_BACKGROUND=auto              # Options: transparent, opaque, auto (default)
GPT_IMAGE_OUTPUT_FORMAT=png            # Options: png, jpeg, webp
GPT_IMAGE_OUTPUT_COMPRESSION=85        # Range: 0-100 (for JPEG/WebP only)
GPT_IMAGE_INPUT_FIDELITY=low          # Options: low, high
GPT_IMAGE_MAX_IMAGES=4                 # Maximum images per request (1-4)
```

**Size Options:**

- `1024x1024` (square) - Balanced composition, fastest to generate
- `1536x1024` (landscape) - Wider scenes and panoramas
- `1024x1536` (portrait) - Vertical subjects and compositions
- `auto` (default) - Model chooses optimal size based on prompt

**Quality Options:**

- `low` - Fastest generation, 272-408 tokens, suitable for drafts
- `medium` - Balanced quality, 1056-1584 tokens, good for most uses
- `high` - Best quality, 4160-6240 tokens, detailed final outputs
- `auto` (default) - Model chooses quality based on prompt complexity

**Background Options:**

- `transparent` - Transparent background (PNG/WebP only)
- `opaque` - Opaque background
- `auto` (default) - Model chooses based on prompt context

**Note:** Square images with standard quality are fastest to generate. The `auto` option is recommended for best results.

## Usage Examples

### Generate Mode: Creating New Images

Generate mode creates images from text descriptions using GPT Image.

#### Basic Image Generation

```typescript
{
  "mode": "generate",
  "prompt": "A serene Japanese garden with cherry blossoms, koi pond, and traditional stone lanterns at sunset",
  "quality": "high",
  "size": "landscape",
  "outputFormat": "png"
}
```

**Response:**

```json
{
  "mode": "generate",
  "images": [
    {
      "b64_json": "iVBORw0KGgoAAAANS...",
      "revised_prompt": "A peaceful Japanese garden scene featuring delicate pink cherry blossoms..."
    }
  ],
  "model": "gpt-image-1",
  "tokensUsed": {
    "input": 0,
    "output": 5200,
    "total": 5200
  },
  "cost": 0.08
}
```

#### Multiple Images with Streaming

Generate multiple variations and receive partial images during generation:

```typescript
{
  "mode": "generate",
  "prompt": "Modern minimalist logo for a tech startup, featuring geometric shapes in blue and white",
  "n": 3,
  "partialImages": 2,
  "quality": "medium",
  "background": "transparent",
  "outputFormat": "png"
}
```

#### Advanced Prompting Techniques

For best results, include specific details about:

- **Subject**: What is the main focus of the image
- **Style**: Art style (photorealistic, illustration, 3D render, watercolor, etc.)
- **Composition**: Camera angle, framing, perspective
- **Lighting**: Time of day, mood, light sources
- **Colors**: Color palette, dominant colors, contrast
- **Atmosphere**: Mood, weather, ambiance

Example advanced prompt:

```typescript
{
  "mode": "generate",
  "prompt": "Photorealistic close-up portrait of a senior craftsman woodworker, weathered hands holding handmade chisel, workshop background with warm afternoon sunlight streaming through dusty windows, shallow depth of field, earthy brown and amber tones, Hasselblad medium format aesthetic",
  "quality": "high",
  "size": "portrait",
  "outputFormat": "jpeg",
  "outputCompression": 92
}
```

### Edit Mode: Modifying Existing Images

Edit mode allows you to modify existing images through conversational prompts. It supports multi-turn workflows where each edit builds on previous results.

#### Basic Image Editing

```typescript
{
  "mode": "edit",
  "prompt": "Change the sky to a dramatic sunset with orange and purple clouds",
  "inputImages": ["base64_encoded_image_data"],
  "quality": "high",
  "inputFidelity": "high"
}
```

#### Multi-Turn Conversational Editing

The Responses API enables iterative refinement through multiple edit rounds:

**Turn 1 - Initial Edit:**

```typescript
{
  "mode": "edit",
  "prompt": "Add a person sitting on the bench reading a book",
  "inputImages": ["base64_park_scene"],
  "inputFidelity": "high"
}
```

**Turn 2 - Refine Previous Edit:**

```typescript
{
  "mode": "edit",
  "prompt": "Make the person wearing a red jacket and change the book to a tablet",
  "inputImages": ["base64_result_from_turn_1"],
  "inputFidelity": "high"
}
```

**Turn 3 - Further Refinement:**

```typescript
{
  "mode": "edit",
  "prompt": "Add a coffee cup on the bench next to them",
  "inputImages": ["base64_result_from_turn_2"],
  "inputFidelity": "high"
}
```

#### Inpainting with Masks

Edit specific regions by providing a mask image (white areas will be edited, black areas preserved):

```typescript
{
  "mode": "edit",
  "prompt": "Replace the background with a futuristic cityscape",
  "inputImages": ["base64_portrait_image"],
  "inputImageMask": "base64_mask_image",
  "inputFidelity": "high",
  "quality": "high"
}
```

#### High Fidelity for Faces and Logos

Use high input fidelity when editing images with important details:

```typescript
{
  "mode": "edit",
  "prompt": "Change the background to professional gradient, keep the person and company logo unchanged",
  "inputImages": ["base64_corporate_photo"],
  "inputFidelity": "high",  // Preserves faces and logos
  "quality": "high"
}
```

### Search Mode: Finding Visual Inspiration

Search mode uses Perplexity to find images and visual references from the web or academic sources.

#### Web Image Search

```typescript
{
  "mode": "search",
  "prompt": "Modern Scandinavian interior design with natural wood and neutral colors",
  "searchMode": "web",
  "searchRecencyFilter": "month"
}
```

**Response:**

```json
{
  "mode": "search",
  "searchResults": {
    "content": "Here are inspiring examples of modern Scandinavian interior design...",
    "citations": [
      "https://example.com/scandinavian-design",
      "https://design-magazine.com/nordic-interiors"
    ],
    "imageUrls": [
      {
        "imageUrl": "https://cdn.example.com/living-room.jpg",
        "originUrl": "https://example.com/gallery/123",
        "width": 1920,
        "height": 1080
      }
    ]
  },
  "model": "sonar",
  "tokensUsed": {
    "input": 45,
    "output": 320,
    "total": 365
  },
  "cost": 0.000365
}
```

#### Academic Visual Search

Search academic papers for scientific visualizations:

```typescript
{
  "mode": "search",
  "prompt": "Neural network architecture diagrams and visualization techniques",
  "searchMode": "academic"
}
```

#### Recent Trends Research

Find current design trends and inspiration:

```typescript
{
  "mode": "search",
  "prompt": "2025 web design trends with examples",
  "searchMode": "web",
  "searchRecencyFilter": "week"
}
```

## Parameter Reference

### Common Parameters (All Modes)

| Parameter | Type                               | Required | Default | Description                      |
| --------- | ---------------------------------- | -------- | ------- | -------------------------------- |
| `mode`    | `"generate" \| "edit" \| "search"` | Yes      | -       | Operation mode                   |
| `prompt`  | `string`                           | Yes      | -       | Text description or search query |

### Generate/Edit Mode Parameters

| Parameter           | Type                                              | Required | Default         | Description                            |
| ------------------- | ------------------------------------------------- | -------- | --------------- | -------------------------------------- |
| `model`             | `"gpt-image-1"`                                   | No       | `"gpt-image-1"` | Image model to use                     |
| `size`              | `"auto" \| "square" \| "landscape" \| "portrait"` | No       | Config default  | Image dimensions                       |
| `quality`           | `"auto" \| "low" \| "medium" \| "high"`           | No       | Config default  | Rendering quality                      |
| `background`        | `"auto" \| "opaque" \| "transparent"`             | No       | Config default  | Background transparency                |
| `outputFormat`      | `"png" \| "jpeg" \| "webp"`                       | No       | Config default  | Output image format                    |
| `outputCompression` | `number` (0-100)                                  | No       | Config default  | Compression level for JPEG/WebP        |
| `partialImages`     | `0 \| 1 \| 2 \| 3`                                | No       | -               | Number of partial images for streaming |
| `n`                 | `number` (1-4)                                    | No       | 1               | Number of images to generate           |

### Edit Mode Additional Parameters

| Parameter        | Type              | Required | Default | Description                                                                      |
| ---------------- | ----------------- | -------- | ------- | -------------------------------------------------------------------------------- |
| `inputImages`    | `string[]`        | Yes      | -       | Input images as base64 strings or file IDs                                       |
| `inputImageMask` | `string`          | No       | -       | Optional single mask for inpainting (base64 or file ID). Only one mask supported |
| `inputFidelity`  | `"low" \| "high"` | No       | `"low"` | Input image detail preservation level                                            |

### Search Mode Specific Parameters

| Parameter             | Type                          | Required | Default | Description               |
| --------------------- | ----------------------------- | -------- | ------- | ------------------------- |
| `searchMode`          | `"web" \| "academic"`         | No       | `"web"` | Search domain             |
| `searchRecencyFilter` | `"week" \| "month" \| "year"` | No       | -       | Filter results by recency |

## Response Format

### Generate/Edit Mode Response

```typescript
{
  "mode": "generate", // or "edit"
  "images": [
    {
      "b64_json": string,        // Base64 encoded image
      "revised_prompt": string   // GPT's interpretation of prompt
    }
  ],
  "model": string,
  "tokensUsed": {
    "input": number,
    "output": number,
    "total": number
  },
  "cost": number
}
```

### Search Mode Response

```typescript
{
  "mode": "search",
  "searchResults": {
    "content": string,           // AI-generated summary
    "citations": string[],       // Source URLs
    "imageUrls": [               // Image search results (optional)
      {
        "imageUrl": string,
        "originUrl": string,
        "width": number,
        "height": number
      }
    ],
    "searchResults": [           // Web page search results (optional)
      {
        "title": string,
        "url": string,
        "snippet": string
      }
    ]
  },
  "model": string,
  "tokensUsed": {
    "input": number,
    "output": number,
    "total": number
  },
  "cost": number
}
```

**Note**: The nested `searchResults.searchResults` structure is maintained for consistency with Perplexity API response format.

## Cost Estimation

Understanding token costs helps manage your GPT Image budget effectively.

### Image Token Costs by Quality

Quality settings directly impact token consumption and cost:

| Quality | Average Tokens | Token Range | Approximate Cost\* |
| ------- | -------------- | ----------- | ------------------ |
| Low     | 340            | 272-408     | $0.02 per image    |
| Medium  | 1,320          | 1,056-1,584 | $0.04 per image    |
| High    | 5,200          | 4,160-6,240 | $0.08 per image    |
| Auto    | 1,320          | 1,056-1,584 | $0.04 per image    |

\*Approximate placeholder pricing - update with actual GPT Image rates

### Input Image Token Costs (Edit Mode)

Input images consume tokens based on fidelity setting:

| Input Fidelity | Tokens per Image | Use Case                   |
| -------------- | ---------------- | -------------------------- |
| Low            | ~500             | Simple objects, scenes     |
| High           | ~1,000           | Faces, logos, fine details |

### Streaming Overhead

Partial images add overhead for faster preview:

- Each partial image adds ~10-20% token overhead
- Useful for interactive workflows
- Balance preview speed vs cost

### Cost Calculation Example

**Scenario**: Edit a portrait photo (high fidelity input) and generate high-quality output

```
Input cost:  1 image × 1,000 tokens × $0.00002 per token = $0.02
Output cost: 1 image × 5,200 tokens × $0.000015 per token = $0.08
Total:       $0.10 per edit

Note: Token rates shown are illustrative placeholders.
Actual GPT Image pricing may vary - check OpenAI pricing page for current rates.
```

### Perplexity Search Costs

| Model     | Input (per 1M tokens) | Output (per 1M tokens) |
| --------- | --------------------- | ---------------------- |
| sonar     | $1.00                 | $1.00                  |
| sonar-pro | $3.00                 | $15.00                 |

Typical search query: ~$0.0003-$0.002 depending on result complexity

## Error Handling

### Common Errors

#### Invalid Mode

```json
{
  "error": "Invalid mode. Must be 'generate', 'edit', or 'search'"
}
```

#### Missing Input Images (Edit Mode)

```json
{
  "error": "At least one input image is required for edit mode"
}
```

#### Image Count Exceeds Maximum

```json
{
  "error": "Requested 5 images, but maximum allowed is 4"
}
```

#### Invalid Quality Setting

```json
{
  "error": "Quality must be one of: auto, low, medium, high"
}
```

### Error Recovery Best Practices

1. **Validate Input**: Check all required parameters before making requests
2. **Handle Rate Limits**: Implement exponential backoff for rate limit errors
3. **Check Image Format**: Ensure input images are properly base64 encoded
4. **Monitor Costs**: Track token usage to avoid unexpected charges
5. **Log Errors**: Keep detailed logs for debugging and monitoring

## Best Practices

### Image Generation

1. **Be Specific**: Include details about style, composition, lighting, and colors
2. **Use Quality Wisely**: Start with medium quality, upgrade to high only when needed
3. **Leverage Transparency**: Use transparent backgrounds for logos and UI elements
4. **Batch Requests**: Generate multiple variations in one request when exploring options
5. **Format Selection**: Use PNG for transparency, JPEG for smaller files, WebP for modern web

### Image Editing

1. **High Fidelity for Details**: Always use high input fidelity for faces, logos, and text
2. **Multi-Turn Refinement**: Break complex edits into multiple conversational turns
3. **Use Masks for Precision**: Apply masks when editing specific regions
4. **Preserve Quality**: Match quality settings between input and output
5. **Iterative Approach**: Start with broad changes, then refine details

### Visual Search

1. **Specific Queries**: Be clear about what you're looking for
2. **Use Recency Filters**: Filter by time period for trending content
3. **Choose Right Domain**: Use 'academic' for research, 'web' for general inspiration
4. **Verify Sources**: Check citations for credibility
5. **Combine with Generation**: Use search results to inform generation prompts

### Multi-Turn Editing Workflows

The Responses API enables conversational image editing:

1. **Start Broad**: Make major changes first (background, composition, subject)
2. **Refine Incrementally**: Add details in subsequent turns (colors, lighting, small objects)
3. **Maintain Consistency**: Reference previous edits in your prompts
4. **Use High Fidelity**: Preserve quality across multiple edit rounds
5. **Document Changes**: Keep track of prompts used in each turn for reproducibility

### Cost Optimization

1. **Start Low**: Use low quality for quick iterations, high quality for final output
2. **Limit Partial Images**: Only use streaming when preview speed matters
3. **Batch Wisely**: Generate multiple images per request to amortize overhead
4. **Choose Format**: JPEG/WebP with compression can reduce token costs
5. **Monitor Usage**: Track costs per project to stay within budget

## Troubleshooting

### Images Not Generating

**Issue**: Request succeeds but no images returned

**Solutions**:

- Check OpenAI API key is valid and has credit
- Verify prompt doesn't violate content policy
- Try simplifying the prompt
- Check quality setting isn't too high for available resources

### Poor Image Quality

**Issue**: Generated images don't match expectations

**Solutions**:

- Increase quality setting from low to medium or high
- Add more specific details to prompt (style, lighting, composition)
- Try generating multiple variations with `n: 3` or `n: 4`
- Use reference images in edit mode for better results

### Edits Not Preserving Details

**Issue**: Important details lost during editing

**Solutions**:

- Set `inputFidelity: "high"` for faces, logos, text
- Use masks to protect regions that shouldn't change
- Break edit into smaller, more focused changes
- Increase quality setting for both input and output

### Search Returns Irrelevant Results

**Issue**: Visual search doesn't find what you need

**Solutions**:

- Make search query more specific
- Add context (style, time period, medium)
- Try different search modes (web vs academic)
- Use recency filters to narrow results

### High Costs

**Issue**: Token usage higher than expected

**Solutions**:

- Use lower quality settings for iterative work
- Reduce number of partial images
- Avoid generating multiple high-quality images unnecessarily
- Use search mode for inspiration before generation
- Monitor token usage in responses

## Responses API Multi-Turn Capabilities

GPT Image through the Responses API supports multi-turn conversational workflows, allowing natural iterative refinement:

### Conversational Context

Each edit can reference previous edits naturally:

```typescript
// Turn 1
'Add a red car to the street';

// Turn 2
'Make the car blue instead';

// Turn 3
'Add a person walking next to the blue car';
```

### Benefits Over Single-Turn APIs

- **Natural Workflow**: Describe changes conversationally
- **Context Awareness**: Model understands previous modifications
- **Iterative Refinement**: Perfect images through multiple small adjustments
- **Undo/Redo**: Easy to revert changes by providing previous image
- **Experimentation**: Try different variations of the same base image

### Best Practices for Multi-Turn Editing

1. Start with a good base image (high quality generation)
2. Make one conceptual change per turn
3. Use high input fidelity to preserve quality across turns
4. Keep prompts focused on the specific change needed
5. Save intermediate results for branching experiments

## Troubleshooting

### Timeout Errors

If you encounter timeout errors (`Request timed out`), this typically happens when:

- Generating high-quality images
- Creating multiple images in one request
- Editing images with high input fidelity
- Network connectivity is slow

**Solutions:**

1. **Increase Timeout**: Set `GPT_IMAGE_TIMEOUT` to a higher value:

   ```bash
   # For high quality images
   GPT_IMAGE_TIMEOUT=180000  # 3 minutes

   # For multiple images or editing
   GPT_IMAGE_TIMEOUT=240000  # 4 minutes
   ```

2. **Reduce Quality Settings**: Lower the quality or size to speed up generation:

   ```bash
   GPT_IMAGE_QUALITY=medium  # Instead of high
   GPT_IMAGE_SIZE=1024x1024  # Instead of auto
   ```

3. **Generate Fewer Images**: Reduce the `n` parameter in your request

**Recommended Timeout Settings:**

| Scenario                   | Timeout     | Setting                              |
| -------------------------- | ----------- | ------------------------------------ |
| Low quality, single image  | 60 seconds  | `GPT_IMAGE_TIMEOUT=60000`            |
| Medium quality, 1-2 images | 120 seconds | `GPT_IMAGE_TIMEOUT=120000` (default) |
| High quality, single image | 180 seconds | `GPT_IMAGE_TIMEOUT=180000`           |
| Multiple images or editing | 240 seconds | `GPT_IMAGE_TIMEOUT=240000`           |

### PNG Compression Errors

If you see "Compression less than 100 is not supported for PNG output format":

- PNG only supports lossless compression (100)
- Switch to JPEG or WebP for lossy compression
- Or set `outputCompression: 100` for PNG

## Related Documentation

- [OpenAI GPT Image Documentation](https://platform.openai.com/docs/guides/images)
- [Perplexity API Documentation](https://docs.perplexity.ai)
- [Kortx Configuration Guide](../configuration.md)
- [Getting Started](../getting-started.md)
- [Other Kortx Tools](../api/)
  - [think-about-plan](./think-about-plan.md)
  - [suggest-alternative](./suggest-alternative.md)
  - [improve-copy](./improve-copy.md)
  - [solve-problem](./solve-problem.md)
