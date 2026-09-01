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

// Anthropic's flagship models (sonnet-5, opus-4-8) require the adaptive
// thinking request shape and reject an explicit `temperature` — the same
// constraint the app's streaming chat path handles in anthropicRaw.ts.
// Mirrored here so gateway completions can route to those models too.
const ANTHROPIC_FLAGSHIP_MODELS = new Set(["claude-sonnet-5", "claude-opus-4-8"]);

class AnthropicProvider implements ModelGatewayProvider {
  id = "anthropic";

  // When AGENT_ROUTER_BASE_URL is set and OPENAI_API_KEY is available,
  // route Claude models through Agent Router instead of direct Anthropic API.
  private get useAgentRouter(): boolean {
    return !!(process.env.AGENT_ROUTER_BASE_URL && process.env.OPENAI_API_KEY);
  }

  private get baseUrl(): string {
    return this.useAgentRouter
      ? `${process.env.AGENT_ROUTER_BASE_URL}/v1`
      : "https://api.anthropic.com/v1";
  }

  supportsModel(model: string): boolean {
    return model.startsWith("claude-");
  }

  async complete(req: ModelGatewayRequest): Promise<ModelGatewayResult> {
    // When routing through Agent Router, use Anthropic Messages format with Bearer auth
    if (this.useAgentRouter) {
      const apiKey = process.env.OPENAI_API_KEY!;
      const flagship = ANTHROPIC_FLAGSHIP_MODELS.has(req.model);
      const body: Record<string, unknown> = {
        model: req.model,
        max_tokens: req.maxTokens ?? 1024,
        system: req.system,
        messages: req.messages,
      };
      if (flagship) {
        body.thinking = { type: "adaptive" };
        body.output_config = { effort: "low" };
      } else {
        body.temperature = req.temperature ?? 0.7;
      }

      const res = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Agent Router API error ${res.status}: ${errBody.slice(0, 300)}`);
      }

      const data = await res.json();
      return {
        text: data.content?.[0]?.text ?? "",
        usage: {
          inputTokens: data.usage?.input_tokens ?? 0,
          outputTokens: data.usage?.output_tokens ?? 0,
        },
        provider: "agent-router",
      };
    }

    // Direct Anthropic API path
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const flagship = ANTHROPIC_FLAGSHIP_MODELS.has(req.model);
    const body: Record<string, unknown> = {
      model: req.model,
      max_tokens: req.maxTokens ?? 1024,
      system: req.system,
      messages: req.messages,
    };
    if (flagship) {
      body.thinking = { type: "adaptive" };
      body.output_config = { effort: "low" };
    } else {
      body.temperature = req.temperature ?? 0.7;
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

// OpenAI-compatible provider (OpenRouter, OpenAI, or any compatible gateway).
// Enabled whenever OPENROUTER_API_KEY or OPENAI_API_KEY is set.
class OpenAIProvider implements ModelGatewayProvider {
  id = "openai";

  private get baseUrl(): string {
    if (process.env.OPENROUTER_API_KEY) return "https://openrouter.ai/api/v1";
    return "https://api.openai.com/v1";
  }

  private get apiKey(): string | undefined {
    return process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  }

  supportsModel(model: string): boolean {
    return true;
  }

  async complete(req: ModelGatewayRequest): Promise<ModelGatewayResult> {
    const apiKey = this.apiKey;
    if (!apiKey) throw new Error("No API key configured (OPENROUTER_API_KEY or OPENAI_API_KEY)");

    const reasoningModel = req.model.startsWith("o");
    const body: Record<string, unknown> = {
      model: req.model,
      messages: [
        ...(req.system ? [{ role: "system", content: req.system }] : []),
        ...req.messages,
      ],
      max_tokens: req.maxTokens ?? 1024,
    };
    if (!reasoningModel) body.temperature = req.temperature ?? 0.7;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`OpenAI API error ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
      provider: this.id,
    };
  }
}

const providers: ModelGatewayProvider[] = [new AnthropicProvider(), new OpenAIProvider()];

export function registerProvider(provider: ModelGatewayProvider): void {
  providers.push(provider);
}

export async function completeViaGateway(req: ModelGatewayRequest): Promise<ModelGatewayResult> {
  const provider = providers.find((p) => p.supportsModel(req.model));
  if (!provider) throw new Error(`No model gateway provider registered for model "${req.model}"`);
  return provider.complete(req);
}
