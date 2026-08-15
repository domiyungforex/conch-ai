"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Check, Send, Loader2, KeyRound, Radio, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ENDPOINTS, GROUPS, type EndpointSpec, type FieldSpec } from "@/lib/apiDocsSpec";

const BASE_URL = "https://conchportal.com";

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  POST: "bg-coral-500/15 text-coral-300 border-coral-500/30",
  PATCH: "bg-gold-500/15 text-gold-300 border-gold-500/30",
  DELETE: "bg-red-500/15 text-red-300 border-red-500/30",
};

const AUTH_LABELS: Record<EndpointSpec["auth"], string> = {
  read: "MEMORY_READ, MEMORY_WRITE, or FULL",
  write: "MEMORY_WRITE or FULL",
  chat: "CHAT or FULL",
  session: "Dashboard session only",
};

type FieldValues = Record<string, string>;
type AuthMode = "session" | "apiKey";

function collectFieldValue(field: FieldSpec, raw: string | undefined, forSample: boolean): unknown {
  const trimmed = raw?.trim();
  if (trimmed) {
    switch (field.kind) {
      case "number": {
        const n = Number(trimmed);
        return Number.isNaN(n) ? undefined : n;
      }
      case "boolean":
        return trimmed === "true";
      case "tags":
        return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
      default:
        return trimmed;
    }
  }
  if (forSample) {
    if (field.placeholder) {
      return field.kind === "tags" ? field.placeholder.split(",").map((s) => s.trim()) : field.placeholder;
    }
    if (field.default !== undefined) return field.default;
  }
  return undefined;
}

function buildPath(endpoint: EndpointSpec, values: FieldValues, forSample: boolean): string {
  let path: string = endpoint.path;
  for (const f of endpoint.fields.filter((f) => f.in === "path")) {
    const v = collectFieldValue(f, values[f.name], forSample);
    path = path.replace(`{${f.name}}`, v !== undefined ? String(v) : `{${f.name}}`);
  }
  return path;
}

function buildQueryString(endpoint: EndpointSpec, values: FieldValues, forSample: boolean): string {
  const params = new URLSearchParams();
  for (const f of endpoint.fields.filter((f) => f.in === "query")) {
    const v = collectFieldValue(f, values[f.name], forSample);
    if (v !== undefined && v !== "") params.set(f.name, String(v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function buildBody(endpoint: EndpointSpec, values: FieldValues, forSample: boolean): Record<string, unknown> | undefined {
  const fields = endpoint.fields.filter((f) => f.in === "body");
  if (fields.length === 0) return undefined;
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    const v = collectFieldValue(f, values[f.name], forSample);
    if (v !== undefined) body[f.name] = v;
  }
  return Object.keys(body).length ? body : undefined;
}

function buildCurlSample(endpoint: EndpointSpec, values: FieldValues, authMode: AuthMode, apiKeyValue: string): string {
  const url = `${BASE_URL}${buildPath(endpoint, values, true)}${buildQueryString(endpoint, values, true)}`;
  const body = buildBody(endpoint, values, true);
  const lines = [`curl -X ${endpoint.method} "${url}" \\`];

  if (endpoint.auth === "session") {
    lines.push(`  -H "Cookie: __session=<your Clerk session cookie>" \\  # dashboard-only endpoint`);
  } else {
    const key = authMode === "apiKey" && apiKeyValue.trim() ? apiKeyValue.trim() : "cnch_your_api_key";
    lines.push(`  -H "Authorization: Bearer ${key}" \\`);
  }

  if (body) {
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${JSON.stringify(body)}'`);
  } else {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, "");
  }
  return lines.join("\n");
}

function buildJsSample(endpoint: EndpointSpec, values: FieldValues, authMode: AuthMode, apiKeyValue: string): string {
  const url = `${BASE_URL}${buildPath(endpoint, values, true)}${buildQueryString(endpoint, values, true)}`;
  const body = buildBody(endpoint, values, true);
  const headerLines: string[] = [];

  if (endpoint.auth === "session") {
    headerLines.push(`    // dashboard-only endpoint — send with credentials: "include" from a logged-in browser`);
  } else {
    const key = authMode === "apiKey" && apiKeyValue.trim() ? apiKeyValue.trim() : "cnch_your_api_key";
    headerLines.push(`    "Authorization": "Bearer ${key}",`);
  }
  if (body) headerLines.push(`    "Content-Type": "application/json",`);

  const optsLines = [
    `const res = await fetch("${url}", {`,
    `  method: "${endpoint.method}",`,
    `  headers: {`,
    ...headerLines,
    `  },`,
  ];
  if (body) optsLines.push(`  body: JSON.stringify(${JSON.stringify(body)}),`);
  optsLines.push(`});`);

  if (endpoint.streaming) {
    optsLines.push(
      ``,
      `// Real-time text stream — read and concatenate "0:"-prefixed chunks`,
      `const reader = res.body.getReader();`,
      `const decoder = new TextDecoder();`,
      `let text = "";`,
      `while (true) {`,
      `  const { done, value } = await reader.read();`,
      `  if (done) break;`,
      `  for (const line of decoder.decode(value).split("\\n")) {`,
      `    if (line.startsWith("0:")) text += JSON.parse(line.slice(2));`,
      `  }`,
      `}`
    );
  } else {
    optsLines.push(`const data = await res.json();`);
  }

  return optsLines.join("\n");
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="text-xs font-mono text-slate-300 bg-black/40 border border-white/8 rounded-xl p-4 pr-10 overflow-x-auto whitespace-pre-wrap break-words">
        {code}
      </pre>
      <CopyButton value={code} />
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldSpec; value: string; onChange: (v: string) => void }) {
  if (field.kind === "enum") {
    return (
      <Select value={value || "__unset"} onValueChange={(v) => onChange(v === "__unset" ? "" : v)}>
        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-xs">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unset">
            {field.default !== undefined ? `(default: ${field.default})` : "(unset)"}
          </SelectItem>
          {field.enumValues?.map((v) => (
            <SelectItem key={v} value={v}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.kind === "boolean") {
    return (
      <Select value={value || "__unset"} onValueChange={(v) => onChange(v === "__unset" ? "" : v)}>
        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-xs">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unset">{field.default !== undefined ? `(default: ${String(field.default)})` : "(unset)"}</SelectItem>
          <SelectItem value="true">true</SelectItem>
          <SelectItem value="false">false</SelectItem>
        </SelectContent>
      </Select>
    );
  }
  if (field.kind === "textarea") {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-base md:text-xs min-h-[70px]"
      />
    );
  }
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      type={field.kind === "number" ? "number" : "text"}
      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-base md:text-xs"
    />
  );
}

interface ResponseState {
  status: number;
  latencyMs: number;
  body: unknown;
  conversationId?: string | null;
}

function statusStyle(status: number): string {
  if (status === 0) return "bg-red-500/15 text-red-300 border-red-500/30";
  if (status < 300) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (status < 500) return "bg-gold-500/15 text-gold-300 border-gold-500/30";
  return "bg-red-500/15 text-red-300 border-red-500/30";
}

export function ApiDocsConsole() {
  const [activeId, setActiveId] = useState<string>(ENDPOINTS[0].id);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [authMode, setAuthMode] = useState<AuthMode>("session");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [sending, setSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [response, setResponse] = useState<ResponseState | null>(null);

  const active = useMemo(() => ENDPOINTS.find((e) => e.id === activeId)!, [activeId]);

  useEffect(() => {
    const initial: FieldValues = {};
    for (const f of active.fields) {
      if (f.default !== undefined) initial[f.name] = String(f.default);
    }
    setFieldValues(initial);
    setResponse(null);
    setStreamedText("");
    if (active.auth === "session") setAuthMode("session");
  }, [active]);

  const curlSample = useMemo(() => buildCurlSample(active, fieldValues, authMode, apiKeyValue), [active, fieldValues, authMode, apiKeyValue]);
  const jsSample = useMemo(() => buildJsSample(active, fieldValues, authMode, apiKeyValue), [active, fieldValues, authMode, apiKeyValue]);

  const missingRequired = active.fields.some((f) => f.required && !fieldValues[f.name]?.trim());
  const needsKey = active.auth !== "session" && authMode === "apiKey" && !apiKeyValue.trim();

  async function handleSend() {
    if (missingRequired || needsKey) return;

    setSending(true);
    setResponse(null);
    setStreamedText("");

    const path = buildPath(active, fieldValues, false);
    const query = buildQueryString(active, fieldValues, false);
    const body = buildBody(active, fieldValues, false);
    const headers: Record<string, string> = {};
    if (body) headers["Content-Type"] = "application/json";
    if (active.auth !== "session" && authMode === "apiKey") headers["Authorization"] = `Bearer ${apiKeyValue.trim()}`;

    const start = performance.now();

    try {
      const res = await fetch(`${path}${query}`, {
        method: active.method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (active.streaming) {
        setIsStreaming(true);
        const conversationId = res.headers.get("X-Conversation-Id");

        if (!res.ok || !res.body) {
          const errBody = await res.json().catch(() => ({}));
          setResponse({ status: res.status, latencyMs: performance.now() - start, body: errBody });
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const text = JSON.parse(line.slice(2));
                if (typeof text === "string") {
                  accumulated += text;
                  setStreamedText(accumulated);
                }
              } catch {
                // skip malformed chunk
              }
            }
          }
        }

        setResponse({ status: res.status, latencyMs: performance.now() - start, body: null, conversationId });
        setIsStreaming(false);
      } else {
        const text = await res.text();
        let parsed: unknown;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = text;
        }
        setResponse({ status: res.status, latencyMs: performance.now() - start, body: parsed });
      }
    } catch (err) {
      setResponse({
        status: 0,
        latencyMs: performance.now() - start,
        body: { error: err instanceof Error ? err.message : "Network error" },
      });
    } finally {
      setSending(false);
      setIsStreaming(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Intro / auth */}
      <GlassCard className="p-5 md:p-6 space-y-4">
        <div>
          <h1 className="font-display text-2xl text-white">Conch API</h1>
          <p className="text-sm text-slate-400 mt-1">
            The full CRUD surface behind your memory — store, search, recall, export, and chat. Every request below
            runs live against production — try it right from the browser.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-500">Base URL</span>
          <code className="text-coral-300 bg-white/5 border border-white/8 rounded-lg px-2.5 py-1 font-mono">{BASE_URL}</code>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 pt-1">
          <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3.5">
            <p className="text-xs font-semibold text-white flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-teal-400" /> Dashboard session</p>
            <p className="text-xs text-slate-400 mt-1">
              Signed-in requests from conchportal.com carry a Clerk session cookie automatically — no header needed.
              Full access to your own data.
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3.5">
            <p className="text-xs font-semibold text-white flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-coral-400" /> API key</p>
            <p className="text-xs text-slate-400 mt-1">
              For external apps: <code className="text-coral-300">Authorization: Bearer cnch_...</code>. Create one under{" "}
              <Link href="/settings/api-keys" className="text-coral-300 underline underline-offset-2 inline-flex items-center gap-0.5">
                Settings → API Keys <ExternalLink className="w-3 h-3" />
              </Link>.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 text-left border-b border-white/8">
                <th className="font-medium py-1.5 pr-4">Scope</th>
                <th className="font-medium py-1.5">Unlocks</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5"><td className="py-1.5 pr-4 font-mono text-coral-300">FULL</td><td className="py-1.5">Everything a session can do, including chat.</td></tr>
              <tr className="border-b border-white/5"><td className="py-1.5 pr-4 font-mono text-coral-300">MEMORY_READ</td><td className="py-1.5">Read-only: list/get memories, search, list agents &amp; conversations.</td></tr>
              <tr className="border-b border-white/5"><td className="py-1.5 pr-4 font-mono text-coral-300">MEMORY_WRITE</td><td className="py-1.5">Everything MEMORY_READ can, plus create/update/delete across memory, agents, and conversations.</td></tr>
              <tr><td className="py-1.5 pr-4 font-mono text-coral-300">CHAT</td><td className="py-1.5">POST /api/chat only.</td></tr>
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        <nav className="lg:sticky lg:top-6 space-y-4 overflow-x-auto lg:overflow-visible">
          <div className="flex lg:flex-col gap-4 lg:gap-4 min-w-max lg:min-w-0">
            {GROUPS.map((group) => (
              <div key={group} className="lg:w-full shrink-0">
                <p className="px-1 pb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{group}</p>
                <div className="flex lg:flex-col gap-1">
                  {ENDPOINTS.filter((e) => e.group === group).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setActiveId(e.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left whitespace-nowrap transition-colors",
                        e.id === activeId ? "bg-coral-600/15 text-coral-300" : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className={cn("font-mono font-semibold text-[10px] px-1.5 py-0.5 rounded border", METHOD_STYLES[e.method])}>
                        {e.method}
                      </span>
                      {e.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Detail */}
        <div className="space-y-5 min-w-0">
          <GlassCard className="p-5 md:p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("font-mono font-semibold text-xs px-2 py-1 rounded-lg border", METHOD_STYLES[active.method])}>
                {active.method}
              </span>
              <code className="text-sm font-mono text-white">{active.path}</code>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{active.title}</h2>
              <p className="text-sm text-slate-400 mt-1">{active.description}</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
              <span>Scope: <span className="text-slate-300">{AUTH_LABELS[active.auth]}</span></span>
              {active.rateLimit && <span>Rate limit: <span className="text-slate-300">{active.rateLimit}</span></span>}
            </div>

            {active.fields.length > 0 && (
              <div className="overflow-x-auto pt-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 text-left border-b border-white/8">
                      <th className="font-medium py-1.5 pr-4">Field</th>
                      <th className="font-medium py-1.5 pr-4">In</th>
                      <th className="font-medium py-1.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {active.fields.map((f) => (
                      <tr key={f.name} className="border-b border-white/5 align-top">
                        <td className="py-1.5 pr-4 font-mono text-coral-300 whitespace-nowrap">
                          {f.name}{f.required && <span className="text-red-400">*</span>}
                        </td>
                        <td className="py-1.5 pr-4 text-slate-500 whitespace-nowrap">{f.in}</td>
                        <td className="py-1.5">{f.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1.5">Response</p>
              <pre className="text-xs font-mono text-slate-400 bg-black/30 border border-white/8 rounded-xl p-3.5 overflow-x-auto whitespace-pre-wrap">
                {active.responseShape}
              </pre>
            </div>
          </GlassCard>

          {/* Code samples */}
          <GlassCard className="p-5 md:p-6">
            <Tabs defaultValue="curl">
              <TabsList>
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
              </TabsList>
              <TabsContent value="curl" className="mt-3"><CodeBlock code={curlSample} /></TabsContent>
              <TabsContent value="js" className="mt-3"><CodeBlock code={jsSample} /></TabsContent>
            </Tabs>
          </GlassCard>

          {/* Try it */}
          <GlassCard className="p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-semibold text-white">Try it</h3>
              <div className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode("session")}
                  className={cn("px-3 py-1 rounded-lg text-xs transition-colors", authMode === "session" ? "bg-coral-600/20 text-coral-300" : "text-slate-400 hover:text-white")}
                >
                  Session
                </button>
                <button
                  type="button"
                  disabled={active.auth === "session"}
                  onClick={() => setAuthMode("apiKey")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs transition-colors",
                    active.auth === "session" ? "text-slate-600 cursor-not-allowed" : authMode === "apiKey" ? "bg-coral-600/20 text-coral-300" : "text-slate-400 hover:text-white"
                  )}
                >
                  API key
                </button>
              </div>
            </div>

            {active.auth === "session" && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                This endpoint only accepts your dashboard session — sign in and it&apos;ll use your browser cookie automatically.
              </p>
            )}

            {active.auth !== "session" && authMode === "apiKey" && (
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">API key</label>
                <Input
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder="cnch_..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-base md:text-xs font-mono"
                />
              </div>
            )}

            {active.fields.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {active.fields.map((f) => (
                  <div key={f.name} className={cn(f.kind === "textarea" && "sm:col-span-2")}>
                    <label className="text-xs text-slate-400 mb-1.5 block">
                      {f.name}{f.required && <span className="text-red-400"> *</span>}
                    </label>
                    <FieldInput
                      field={f}
                      value={fieldValues[f.name] ?? ""}
                      onChange={(v) => setFieldValues((prev) => ({ ...prev, [f.name]: v }))}
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={sending || missingRequired || needsKey}
              className="gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {sending ? (active.streaming ? "Streaming…" : "Sending…") : `Send ${active.method}`}
            </Button>

            {/* Response */}
            {(response || isStreaming) && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {response && (
                    <span className={cn("font-mono font-semibold text-xs px-2 py-1 rounded-lg border", statusStyle(response.status))}>
                      {response.status === 0 ? "ERR" : response.status}
                    </span>
                  )}
                  {isStreaming && (
                    <span className="flex items-center gap-1.5 text-xs text-teal-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> streaming
                    </span>
                  )}
                  {response && <span className="text-xs text-slate-500">{Math.round(response.latencyMs)}ms</span>}
                  {response?.conversationId && (
                    <span className="text-xs text-slate-500 font-mono">conversation: {response.conversationId}</span>
                  )}
                </div>

                {active.streaming ? (
                  <pre className="text-xs font-mono text-slate-200 bg-black/40 border border-white/8 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap min-h-[3rem]">
                    {streamedText || (isStreaming ? "" : "(empty response)")}
                  </pre>
                ) : (
                  <pre className="text-xs font-mono text-slate-200 bg-black/40 border border-white/8 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
                    {typeof response?.body === "string" ? response.body : JSON.stringify(response?.body, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
