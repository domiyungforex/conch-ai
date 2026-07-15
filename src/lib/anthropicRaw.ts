// Vercel AI SDK's Anthropic provider (@ai-sdk/anthropic) doesn't yet support Claude 5's
// "adaptive thinking" API shape (thinking.type: "adaptive" + output_config.effort), which
// claude-sonnet-5 and claude-opus-4-8 require and which rejects any explicit `temperature`.
// This talks to the Anthropic Messages API directly, bypassing the SDK for those models.
// claude-haiku-4-5 doesn't need thinking mode and uses plain `temperature` instead.

const FLAGSHIP_MODELS = new Set(["claude-sonnet-5", "claude-opus-4-8"]);

export interface AnthropicToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

type AnthropicMessage = { role: "user" | "assistant"; content: string | ContentBlock[] };

interface StreamChatParams {
  apiKey: string;
  model: string;
  system: string;
  messages: AnthropicMessage[];
  maxTokens: number;
  temperature: number;
  tools: AnthropicToolDef[];
  maxSteps?: number;
  onFinish?: (result: { text: string; totalTokens: number }) => void | Promise<void>;
}

function sseTextDeltaLine(text: string): string {
  return `0:${JSON.stringify(text)}\n`;
}

async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: string }> {
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

      let event = "message";
      let data = "";
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (data) yield { event, data };
    }
  }
}

async function runOneTurn(params: {
  apiKey: string;
  model: string;
  system: string;
  messages: AnthropicMessage[];
  maxTokens: number;
  temperature: number;
  tools: AnthropicToolDef[];
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
}): Promise<{ content: ContentBlock[]; stopReason: string | null; outputTokens: number }> {
  const { apiKey, model, system, messages, maxTokens, temperature, tools, controller, encoder } = params;
  const isFlagship = FLAGSHIP_MODELS.has(model);

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    system,
    messages,
    stream: true,
  };
  if (tools.length > 0) {
    body.tools = tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema }));
  }
  if (isFlagship) {
    body.thinking = { type: "adaptive" };
    body.output_config = { effort: "medium" };
  } else {
    body.temperature = temperature;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const blocks: Array<{ type: string; text: string; toolId?: string; toolName?: string; jsonBuf: string }> = [];
  let stopReason: string | null = null;
  let outputTokens = 0;

  for await (const { event, data } of parseSSE(res.body)) {
    if (event === "ping") continue;
    if (event === "error") throw new Error(`Anthropic stream error: ${data.slice(0, 300)}`);

    const parsed = JSON.parse(data);

    if (parsed.type === "content_block_start") {
      const cb = parsed.content_block;
      blocks[parsed.index] =
        cb.type === "tool_use"
          ? { type: "tool_use", text: "", toolId: cb.id, toolName: cb.name, jsonBuf: "" }
          : { type: cb.type, text: "", jsonBuf: "" };
    } else if (parsed.type === "content_block_delta") {
      const block = blocks[parsed.index];
      if (parsed.delta.type === "text_delta") {
        block.text += parsed.delta.text;
        controller.enqueue(encoder.encode(sseTextDeltaLine(parsed.delta.text)));
      } else if (parsed.delta.type === "input_json_delta") {
        block.jsonBuf += parsed.delta.partial_json;
      }
      // thinking_delta content is intentionally not streamed to the client
    } else if (parsed.type === "message_delta") {
      stopReason = parsed.delta.stop_reason;
      outputTokens = parsed.usage?.output_tokens ?? 0;
    }
  }

  // Only text (non-empty) and tool_use blocks are valid to replay in a follow-up request.
  // "thinking" blocks are intentionally dropped here — they're not needed for the
  // adaptive-thinking tool loop and an empty one would produce an invalid empty text block.
  const content: ContentBlock[] = blocks
    .filter((b) => b.type === "tool_use" || (b.type === "text" && b.text.length > 0))
    .map((b) =>
      b.type === "tool_use"
        ? { type: "tool_use", id: b.toolId!, name: b.toolName!, input: b.jsonBuf ? JSON.parse(b.jsonBuf) : {} }
        : { type: "text", text: b.text }
    );

  return { content, stopReason, outputTokens };
}

export function streamAnthropicChat(params: StreamChatParams): ReadableStream<Uint8Array> {
  const { apiKey, model, system, maxTokens, temperature, tools, maxSteps = 3, onFinish } = params;
  const messages: AnthropicMessage[] = [...params.messages];
  const encoder = new TextEncoder();
  let fullText = "";
  let totalTokens = 0;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let step = 0; step < maxSteps; step++) {
          const { content, stopReason, outputTokens } = await runOneTurn({
            apiKey, model, system, messages, maxTokens, temperature, tools, controller, encoder,
          });

          totalTokens += outputTokens;
          fullText += content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");

          if (stopReason !== "tool_use") break;

          messages.push({ role: "assistant", content });

          const toolResults: ContentBlock[] = [];
          for (const block of content) {
            if (block.type !== "tool_use") continue;
            const tool = tools.find((t) => t.name === block.name);
            let resultText: string;
            try {
              resultText = JSON.stringify(tool ? await tool.execute(block.input) : { error: "Unknown tool" });
            } catch (err) {
              resultText = JSON.stringify({ error: String(err).slice(0, 200) });
            }
            toolResults.push({ type: "tool_result", tool_use_id: block.id, content: resultText });
          }
          messages.push({ role: "user", content: toolResults });
        }

        await onFinish?.({ text: fullText, totalTokens });
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
