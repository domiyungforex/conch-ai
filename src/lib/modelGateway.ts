// A provider-agnostic seam for simple, non-streaming completions — so a
// future module (an opportunity summarizer, a signal classifier, etc.) can
// ask "the model" a question without hardcoding Anthropic's request shape
// into its own service file, and without touching the app's main streaming
// chat path (src/lib/anthropicRaw.ts), which is stable, tool-using, and
// deliberately left alone here.
//
// Deliberately NOT a rewrite of the chat route through this gateway — that
// path already streams and calls tools, which this interface doesn't cover,
// and rewriting proven, working code to prove an abstraction isn't
// justified. This exists for new, simple call sites; only Anthropic is
// registered today, but nothing about the interface assumes it.

export interface ModelGatewayMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ModelGatewayRequest {
  model: string;
  system?: string;
  messages: ModelGatewayMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface ModelGatewayUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ModelGatewayResult {
  text: string;
  usage: ModelGatewayUsage;
  provider: string;
}

export interface ModelGatewayProvider {
  id: string;
  supportsModel(model: string): boolean;
  complete(req: ModelGatewayRequest): Promise<ModelGatewayResult>;
}

class AnthropicProvider implements ModelGatewayProvider {
  id = "anthropic";

  supportsModel(model: string): boolean {
    return model.startsWith("claude-");
  }

  async complete(req: ModelGatewayRequest): Promise<ModelGatewayResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.7,
        system: req.system,
        messages: req.messages,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Anthropic API error ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    return {
      text,
      usage: {
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0,
      },
      provider: this.id,
    };
  }
}

const providers: ModelGatewayProvider[] = [new AnthropicProvider()];

export function registerProvider(provider: ModelGatewayProvider): void {
  providers.push(provider);
}

export async function completeViaGateway(req: ModelGatewayRequest): Promise<ModelGatewayResult> {
  const provider = providers.find((p) => p.supportsModel(req.model));
  if (!provider) throw new Error(`No model gateway provider registered for model "${req.model}"`);
  return provider.complete(req);
}
