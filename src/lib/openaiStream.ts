// OpenAI-compatible streaming chat for Tetrate Agent Router (or any OpenAI-compatible gateway).
// Produces the same Vercel AI SDK data-stream format as streamAnthropicChat so the client
// doesn't need to know which backend is in use.

import type { AnthropicToolDef } from "./anthropicRaw";

interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
}

type MessageContent = string | Array<{ type: string; [key: string]: unknown }>;

interface StreamOpenAIChatParams {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  messages: Array<{ role: string; content: MessageContent }>;
  maxTokens: number;
  temperature: number;
  tools: AnthropicToolDef[];
  maxSteps?: number;
  onFinish?: (result: { text: string; totalTokens: number }) => void | Promise<void>;
}

function sseTextDeltaLine(text: string): string {
  return `0:${JSON.stringify(text)}\n`;
}

function toOpenAITools(tools: AnthropicToolDef[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

async function* parseOpenAISSE(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<{ data: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") return;
          yield { data };
        }
      }
    }
  }
}

interface OpenAITurnResult {
  text: string;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  stopReason: "stop" | "tool_calls";
  outputTokens: number;
}

async function runOneOpenAITurn(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: OpenAIMessage[];
  maxTokens: number;
  temperature: number;
  tools: AnthropicToolDef[];
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
}): Promise<OpenAITurnResult> {
  const { baseUrl, apiKey, model, systemPrompt, messages, maxTokens, temperature, tools, controller, encoder } = params;

  // Build the messages array with system prompt as first message
  const apiMessages: OpenAIMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: apiMessages,
    stream: true,
  };

  if (tools.length > 0) {
    body.tools = toOpenAITools(tools);
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Agent Router API error ${res.status}: ${errBody.slice(0, 300)}`);
  }

  let fullText = "";
  let outputTokens = 0;
  const toolCallsMap: Map<number, { id: string; name: string; argumentsBuf: string }> = new Map();
  let stopReason: "stop" | "tool_calls" = "stop";

  for await (const { data } of parseOpenAISSE(res.body)) {
    try {
      const parsed = JSON.parse(data);

      // Usage info may come in the final chunk
      if (parsed.usage?.completion_tokens) {
        outputTokens = parsed.usage.completion_tokens;
      }

      const choice = parsed.choices?.[0];
      if (!choice) continue;

      const delta = choice.delta;
      if (!delta) continue;

      // Text content
      if (delta.content) {
        fullText += delta.content;
        controller.enqueue(encoder.encode(sseTextDeltaLine(delta.content)));
      }

      // Tool calls arrive incrementally — accumulate by index
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCallsMap.has(idx)) {
            toolCallsMap.set(idx, { id: tc.id ?? "", name: tc.function?.name ?? "", argumentsBuf: "" });
          }
          const existing = toolCallsMap.get(idx)!;
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.argumentsBuf += tc.function.arguments;
        }
      }

      if (choice.finish_reason === "tool_calls") {
        stopReason = "tool_calls";
      } else if (choice.finish_reason === "stop") {
        stopReason = "stop";
      }
    } catch {
      // Skip unparseable SSE lines
    }
  }

  const toolCalls = Array.from(toolCallsMap.values()).map((tc) => ({
    id: tc.id,
    name: tc.name,
    arguments: tc.argumentsBuf ? JSON.parse(tc.argumentsBuf) : {},
  }));

  return { text: fullText, toolCalls, stopReason, outputTokens };
}

export function streamOpenAIChat(params: StreamOpenAIChatParams): ReadableStream<Uint8Array> {
  const { baseUrl, apiKey, model, system: systemPrompt, maxTokens, temperature, tools, maxSteps = 3, onFinish } = params;
  // Convert Anthropic image format to OpenAI format if needed
  function convertContent(content: MessageContent): string | Array<Record<string, unknown>> {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return String(content);
    return content.map((block) => {
      if (block.type === "image" && block.source && typeof block.source === "object" && "data" in block.source) {
        const src = block.source as { type: string; media_type: string; data: string };
        return { type: "image_url", image_url: { url: `data:${src.media_type};base64,${src.data}` } };
      }
      return block;
    });
  }

  const messages: OpenAIMessage[] = [...params.messages.map((m) => ({ role: m.role as "user" | "assistant", content: convertContent(m.content) as string | null }))];
  const encoder = new TextEncoder();
  let fullText = "";
  let totalTokens = 0;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let step = 0; step < maxSteps; step++) {
          const result = await runOneOpenAITurn({
            baseUrl, apiKey, model, systemPrompt, messages, maxTokens, temperature, tools, controller, encoder,
          });

          totalTokens += result.outputTokens;
          fullText += result.text;

          if (result.stopReason !== "tool_calls" || result.toolCalls.length === 0) break;

          // Build assistant message with tool calls
          const assistantMsg: OpenAIMessage = {
            role: "assistant",
            content: result.text || null,
            tool_calls: result.toolCalls.map((tc) => ({
              id: tc.id,
              type: "function",
              function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
            })),
          };
          messages.push(assistantMsg);

          // Execute tools and build tool result messages
          const toolResultMsgs: OpenAIMessage[] = [];
          for (const tc of result.toolCalls) {
            const tool = tools.find((t) => t.name === tc.name);
            let resultText: string;
            try {
              resultText = JSON.stringify(
                tool ? await tool.execute(tc.arguments) : { error: "Unknown tool" }
              );
            } catch (err) {
              resultText = JSON.stringify({ error: String(err).slice(0, 200) });
            }
            toolResultMsgs.push({
              role: "tool",
              content: resultText,
              tool_call_id: tc.id,
            });
          }
          messages.push(...toolResultMsgs);
        }

        await onFinish?.({ text: fullText, totalTokens });
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
// redeploy trigger
