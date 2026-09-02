/* eslint-disable @typescript-eslint/no-explicit-any */import type { AIChatParams, AIStructuredResponse, AIStreamChunk, AIProviderInterface } from '@/types';

export abstract class AIProvider implements AIProviderInterface {
  abstract name: string;
  abstract chat(params: AIChatParams): Promise<AIStructuredResponse>;
  abstract chatStream(params: AIChatParams): AsyncGenerator<AIStreamChunk>;
  abstract embed(text: string): Promise<number[]>;
}

export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'openai';
  switch (provider) {
    case 'anthropic': return new AnthropicProvider();
    default: return new OpenAIProvider();
  }
}

class OpenAIProvider extends AIProvider {
  name = 'openai';
  async chat(params: AIChatParams): Promise<AIStructuredResponse> {
    const { generateText } = await import('ai');
    const { createOpenAI } = await import('@ai-sdk/openai');
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await generateText({ model: openai('gpt-4o') as any, messages: params.messages as any, temperature: params.temperature ?? 0.7 });
    return { content: result.text, citations: [], intent: 'GENERAL_BIBLE', metadata: { model: 'gpt-4o', tokens: { input: 0, output: 0 }, latency: 0 } };
  }
  async *chatStream(params: AIChatParams): AsyncGenerator<AIStreamChunk> {
    const { streamText } = await import('ai');
    const { createOpenAI } = await import('@ai-sdk/openai');
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = streamText({ model: openai('gpt-4o') as any, messages: params.messages as any, temperature: params.temperature ?? 0.7 });
    for await (const chunk of result.textStream) { yield { type: 'text', content: chunk }; }
    yield { type: 'done', content: '' };
  }
  async embed(text: string): Promise<number[]> {
    const { embed } = await import('ai');
    const { createOpenAI } = await import('@ai-sdk/openai');
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await embed({ model: openai.embedding('text-embedding-3-small') as any, value: text });
    return result.embedding;
  }
}

class AnthropicProvider extends AIProvider {
  name = 'anthropic';
  async chat(params: AIChatParams): Promise<AIStructuredResponse> {
    const { generateText } = await import('ai');
    const { createAnthropic } = await import('@ai-sdk/anthropic');
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const result = await generateText({ model: anthropic('claude-sonnet-4-20250514') as any, messages: params.messages as any, temperature: params.temperature ?? 0.7 });
    return { content: result.text, citations: [], intent: 'GENERAL_BIBLE', metadata: { model: 'claude-sonnet-4-20250514', tokens: { input: 0, output: 0 }, latency: 0 } };
  }
  async *chatStream(params: AIChatParams): AsyncGenerator<AIStreamChunk> {
    const { streamText } = await import('ai');
    const { createAnthropic } = await import('@ai-sdk/anthropic');
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const result = streamText({ model: anthropic('claude-sonnet-4-20250514') as any, messages: params.messages as any, temperature: params.temperature ?? 0.7 });
    for await (const chunk of result.textStream) { yield { type: 'text', content: chunk }; }
    yield { type: 'done', content: '' };
  }
  async embed(text: string): Promise<number[]> {
    const { createOpenAI } = await import('@ai-sdk/openai');
    const { embed } = await import('ai');
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await embed({ model: openai.embedding('text-embedding-3-small') as any, value: text });
    return result.embedding;
  }
}
