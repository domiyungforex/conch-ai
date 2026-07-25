// Runs Python via Anthropic's server-side code_execution tool — an Anthropic-hosted
// sandbox (Python 3.11 + bash, no internet), not a self-managed execution provider.
// Deliberately a one-off, non-streaming request rather than routed through the main
// chat tool loop in anthropicRaw.ts: that loop always declares web_search, and Anthropic's
// own docs warn against mixing a standalone code_execution tool with the *_20260209 web
// tools in one request (creates two separate, confusing execution environments).

const MODEL = "claude-haiku-4-5-20251001";

export interface PythonRunResult {
  stdout: string;
  stderr: string;
  returnCode: number | null;
}

interface AnthropicContentBlock {
  type: string;
  content?: {
    type?: string;
    stdout?: string;
    stderr?: string;
    return_code?: number;
    error_code?: string;
  };
}

export async function runPythonSnippet(apiKey: string, code: string): Promise<PythonRunResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      temperature: 0,
      system:
        "You are a code execution proxy. When given Python code, execute it EXACTLY as provided via the bash tool — write it to a file and run it with python3, or use a heredoc — without modifying, fixing, or improving it in any way. Do not add explanatory text before or after; just execute it. If the code errors, let it fail naturally rather than trying to fix it.",
      messages: [
        { role: "user", content: `Execute this Python code exactly as written:\n\n\`\`\`python\n${code}\n\`\`\`` },
      ],
      tools: [{ type: "code_execution_20260120", name: "code_execution" }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();
  const blocks: AnthropicContentBlock[] = data.content ?? [];

  let stdout = "";
  let stderr = "";
  let returnCode: number | null = null;

  for (const block of blocks) {
    if (block.type !== "bash_code_execution_tool_result" || !block.content) continue;
    const result = block.content;
    if (result.type === "bash_code_execution_result") {
      if (result.stdout) stdout += result.stdout;
      if (result.stderr) stderr += result.stderr;
      if (typeof result.return_code === "number") returnCode = result.return_code;
    } else if (result.error_code) {
      stderr += `Execution error: ${result.error_code}\n`;
    }
  }

  return { stdout, stderr, returnCode };
}
