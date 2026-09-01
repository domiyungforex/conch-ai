import { NextRequest } from 'next/server';
import { createAIProvider } from '@/lib/ai/provider';
import { THE_WAY_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { detectIntent } from '@/lib/ai/query-router';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Query is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const intent = detectIntent(query);
    const ai = createAIProvider();

    const systemPrompt = `${THE_WAY_SYSTEM_PROMPT}\n\n## Current Query Context\nIntent: ${intent.intent}\nConfidence: ${Math.round(intent.confidence * 100)}%`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messages = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: query },
          ];
          for await (const chunk of ai.chatStream({ messages })) {
            if (chunk.type === 'text') controller.enqueue(encoder.encode(chunk.content));
          }
          controller.close();
        } catch (error) {
          console.error('[THE WAY] Stream error:', error);
          controller.enqueue(encoder.encode('\n\nI encountered an error. Please try again.'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
