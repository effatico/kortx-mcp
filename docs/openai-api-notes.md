# OpenAI GPT-5 API Notes

## Overview

GPT-5 series models (released August 2025) introduce advanced reasoning capabilities with fine-grained control over computation effort and response verbosity.

## Available Models

### GPT-5

- **Full model**: Balanced performance and reasoning depth
- Supports all reasoning effort levels (minimal, low, medium, high)
- Default choice for most applications

### GPT-5-mini

- **Lightweight variant**: Faster responses, lower cost
- Supports all reasoning effort levels
- Good for simpler tasks with cost constraints

### GPT-5-nano

- **Ultra-fast variant**: Minimal latency
- Supports all reasoning effort levels
- Ideal for high-throughput applications

### GPT-5-pro

- **Maximum reasoning**: Highest quality outputs
- **Only supports** `reasoning_effort: high`
- Best for complex analytical tasks

### GPT-5-codex

- **Code-specialized**: Optimized for programming tasks
- **Does not support** `reasoning_effort: minimal`
- Ideal for code generation, debugging, refactoring

## Reasoning Effort Parameter

Controls the computational depth and processing time for each request.

### Levels

1. **minimal** (NEW in GPT-5)
   - **Use cases**: Deterministic, lightweight tasks
   - Extraction, formatting, short rewrites
   - Simple classification
   - Fastest time-to-first-token
   - Few or no reasoning tokens generated
   - **Not available**: gpt-5-codex

2. **low**
   - **Use cases**: Quick responses with light computation
   - Simple questions
   - Basic transformations
   - Time-sensitive applications

3. **medium** (DEFAULT)
   - **Use cases**: Balanced performance
   - General-purpose queries
   - Standard complexity tasks
   - Auto-selected if not specified

4. **high**
   - **Use cases**: Complex analytical tasks
   - Deep reasoning required
   - Multi-step problem solving
   - Longer processing time, more reasoning tokens
   - **Only option**: gpt-5-pro

### Token Impact

- Higher effort = more `reasoning_tokens` generated
- Reasoning tokens are billed separately
- `reasoning_tokens` not included in completion_tokens count
- Monitor `usage.reasoning_tokens` in API responses

## Verbosity Parameter (NEW)

Controls response length and detail level.

### Levels

- **low**: Short, concise answers
- **medium**: Balanced detail (default)
- **high**: Comprehensive, detailed responses

### Use Cases

- **low**: Quick facts, yes/no answers, summaries
- **medium**: Standard explanations, tutorials
- **high**: In-depth analysis, comprehensive documentation

## API Request Structure

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing' },
  ],
  reasoning_effort: 'medium', // minimal | low | medium | high
  verbosity: 'medium', // low | medium | high
  max_tokens: 4096,
  temperature: 0.7,
});
```

## Response Structure

```typescript
{
  id: 'chatcmpl-xyz',
  object: 'chat.completion',
  created: 1234567890,
  model: 'gpt-5',
  choices: [{
    index: 0,
    message: {
      role: 'assistant',
      content: '...'
    },
    finish_reason: 'stop'
  }],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 200,
    reasoning_tokens: 50,    // NEW: Reasoning computation
    total_tokens: 350
  }
}
```

## Pricing Considerations

### Token Types

1. **prompt_tokens**: Input tokens (your messages)
2. **completion_tokens**: Output tokens (model's response)
3. **reasoning_tokens**: Hidden reasoning computation (GPT-5 specific)

### Cost Optimization

- Use `minimal` effort for simple tasks (reduces reasoning tokens)
- Set appropriate `max_tokens` limits
- Choose smaller models (mini/nano) when sufficient
- Monitor `reasoning_tokens` usage
- Use `verbosity: low` when full details aren't needed

## Model Selection Strategy

### Decision Tree

```
Complex analytical task?
├─ Yes → gpt-5-pro (high effort only)
└─ No
   └─ Code-related task?
      ├─ Yes → gpt-5-codex (no minimal effort)
      └─ No
         └─ Need minimal latency?
            ├─ Yes → gpt-5-nano
            └─ No
               └─ Cost-constrained?
                  ├─ Yes → gpt-5-mini
                  └─ No → gpt-5
```

## Error Handling

### Common Errors

- **Invalid reasoning_effort**: Model doesn't support requested level
- **Token limit exceeded**: Reduce max_tokens or simplify prompt
- **Rate limit**: Implement exponential backoff
- **Model not found**: Check model name spelling

### Retry Strategy

```typescript
async function callWithRetry(requestFn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (error.status === 429) {
        // Rate limit
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
      } else {
        throw error; // Non-retryable error
      }
    }
  }
}
```

## Best Practices

1. **Start with medium effort**: Adjust based on actual needs
2. **Monitor token usage**: Track reasoning_tokens for cost management
3. **Use minimal for extraction**: When structure is more important than reasoning
4. **Set max_tokens appropriately**: Prevent runaway costs
5. **Implement timeouts**: 60 seconds recommended
6. **Handle errors gracefully**: Network issues, rate limits, etc.
7. **Log requests/responses**: For debugging and cost analysis
8. **Validate inputs**: Use Zod schemas for type safety

## Rate Limits

- Vary by organization and model tier
- Monitor `x-ratelimit-*` headers
- Implement token bucket or sliding window
- Use queuing for high-throughput applications

## Streaming Support

GPT-5 supports streaming for real-time response delivery:

```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-5',
  messages: [...],
  reasoning_effort: 'medium',
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

## References

- [OpenAI GPT-5 API Documentation](https://platform.openai.com/docs)
- [GPT-5 Prompting Guide](https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide)
- [Reasoning Models Guide](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/reasoning)
