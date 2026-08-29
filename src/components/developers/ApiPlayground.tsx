"use client";

import { useState, useMemo } from "react";
import {
  Play,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  Terminal,
  Code2,
  AlertCircle,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ENDPOINTS, type EndpointSpec, type FieldSpec } from "@/lib/apiDocsSpec";

const BASE_URL = "https://conchportal.com";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  POST: "bg-coral-500/15 text-coral-300 border-coral-500/30",
  PATCH: "bg-gold-500/15 text-gold-300 border-gold-500/30",
  DELETE: "bg-red-500/15 text-red-300 border-red-500/30",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

type FieldValues = Record<string, string>;

function collectFieldValue(
  field: FieldSpec,
  raw: string | undefined,
  forSample: boolean
): unknown {
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
        return trimmed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      default:
        return trimmed;
    }
  }
  if (forSample) {
    if (field.placeholder)
      return field.kind === "tags"
        ? field.placeholder
            .split(",")
            .map((s) => s.trim())
        : field.placeholder;
    if (field.default !== undefined) return field.default;
  }
  return undefined;
}

function buildPath(
  endpoint: EndpointSpec,
  values: FieldValues,
  forSample: boolean
): string {
  let p = endpoint.path;
  for (const f of endpoint.fields.filter((f) => f.in === "path")) {
    const v = collectFieldValue(f, values[f.name], forSample);
    p = p.replace(
      `{${f.name}}`,
      v !== undefined ? String(v) : `{${f.name}}`
    );
  }
  return p;
}

function buildQueryString(
  endpoint: EndpointSpec,
  values: FieldValues,
  forSample: boolean
): string {
  const params = new URLSearchParams();
  for (const f of endpoint.fields.filter((f) => f.in === "query")) {
    const v = collectFieldValue(f, values[f.name], forSample);
    if (v !== undefined && v !== "") params.set(f.name, String(v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function buildBody(
  endpoint: EndpointSpec,
  values: FieldValues,
  forSample: boolean
): Record<string, unknown> | undefined {
  const fields = endpoint.fields.filter((f) => f.in === "body");
  if (fields.length === 0) return undefined;
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    const v = collectFieldValue(f, values[f.name], forSample);
    if (v !== undefined) body[f.name] = v;
  }
  return Object.keys(body).length ? body : undefined;
}

function buildCurl(
  endpoint: EndpointSpec,
  values: FieldValues,
  apiKey: string
): string {
  const url = `${BASE_URL}${buildPath(endpoint, values, true)}${buildQueryString(endpoint, values, true)}`;
  const body = buildBody(endpoint, values, true);
  const key = apiKey.trim() || "cnch_your_api_key";
  const lines = [`curl -X ${endpoint.method} "${url}" \\`];
  lines.push(`  -H "Authorization: Bearer ${key}" \\`);
  if (body) {
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${JSON.stringify(body, null, 2)}'`);
  } else {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, "");
  }
  return lines.join("\n");
}

function buildJs(
  endpoint: EndpointSpec,
  values: FieldValues,
  apiKey: string
): string {
  const url = `${BASE_URL}${buildPath(endpoint, values, true)}${buildQueryString(endpoint, values, true)}`;
  const body = buildBody(endpoint, values, true);
  const key = apiKey.trim() || "cnch_your_api_key";
  const lines: string[] = [];
  lines.push(`const res = await fetch("${url}", {`);
  lines.push(`  method: "${endpoint.method}",`);
  lines.push(`  headers: {`);
  lines.push(`    "Authorization": "Bearer ${key}",`);
  if (body) lines.push(`    "Content-Type": "application/json",`);
  lines.push(`  },`);
  if (body) lines.push(`  body: JSON.stringify(${JSON.stringify(body, null, 2)}),`);
  lines.push(`});`);
  lines.push(``);
  lines.push(`const data = await res.json();`);
  lines.push(`console.log(data);`);
  return lines.join("\n");
}

function buildPython(
  endpoint: EndpointSpec,
  values: FieldValues,
  apiKey: string
): string {
  const path = buildPath(endpoint, values, true);
  const query = buildQueryString(endpoint, values, true);
  const body = buildBody(endpoint, values, true);
  const key = apiKey.trim() || "cnch_your_api_key";
  const lines: string[] = [];
  lines.push(`import requests`);
  lines.push(``);
  lines.push(`res = requests.${endpoint.method.toLowerCase()}(`);
  lines.push(`    "${BASE_URL}${path}${query}",`);
  lines.push(`    headers={"Authorization": f"Bearer ${key}"},`);
  if (body) {
    lines.push(`    json=${JSON.stringify(body, null, 4).replace(/\n/g, "\n    ")},`);
  }
  lines.push(`)`);
  lines.push(``);
  lines.push(`print(res.json())`);
  return lines.join("\n");
}

// ── Components ───────────────────────────────────────────────────────────────

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
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.kind === "enum") {
    return (
      <Select
        value={value || "__unset"}
        onValueChange={(v) => onChange(v === "__unset" ? "" : v)}
      >
        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-xs">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unset">
            {field.default !== undefined
              ? `(default: ${field.default})`
              : "(unset)"}
          </SelectItem>
          {field.enumValues?.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.kind === "boolean") {
    return (
      <Select
        value={value || "__unset"}
        onValueChange={(v) => onChange(v === "__unset" ? "" : v)}
      >
        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-xs">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unset">
            {field.default !== undefined
              ? `(default: ${String(field.default)})`
              : "(unset)"}
          </SelectItem>
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
        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm min-h-[70px]"
      />
    );
  }
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      type={field.kind === "number" ? "number" : "text"}
      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
    />
  );
}

// ── Endpoint Selector ────────────────────────────────────────────────────────

function EndpointSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["Memory", "Search"])
  );

  const toggleGroup = (g: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const groups = [...new Set(ENDPOINTS.map((e) => e.group))];

  return (
    <div className="space-y-1">
      {groups.map((group) => {
        const endpoints = ENDPOINTS.filter((e) => e.group === group);
        const expanded = expandedGroups.has(group);
        return (
          <div key={group}>
            <button
              onClick={() => toggleGroup(group)}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {group}
            </button>
            {expanded && (
              <div className="space-y-0.5 ml-1">
                {endpoints.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => onSelect(ep.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left w-full transition-colors",
                      ep.id === selectedId
                        ? "bg-coral-600/15 text-coral-300"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono font-semibold text-[10px] px-1.5 py-0.5 rounded border shrink-0",
                        METHOD_COLORS[ep.method]
                      )}
                    >
                      {ep.method}
                    </span>
                    <span className="truncate">{ep.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Response Display ─────────────────────────────────────────────────────────

function ResponseDisplay({
  status,
  latencyMs,
  body,
  streamedText,
  isStreaming,
}: {
  status: number;
  latencyMs: number;
  body: unknown;
  streamedText: string;
  isStreaming: boolean;
}) {
  const statusColor =
    status === 0
      ? "bg-red-500/15 text-red-300 border-red-500/30"
      : status < 300
        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
        : status < 500
          ? "bg-gold-500/15 text-gold-300 border-gold-500/30"
          : "bg-red-500/15 text-red-300 border-red-500/30";

  const displayText = streamedText || (body ? JSON.stringify(body, null, 2) : "(empty)");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={cn(
            "font-mono font-semibold text-xs px-2 py-1 rounded-lg border",
            statusColor
          )}
        >
          {status === 0 ? "ERR" : status}
        </span>
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-xs text-teal-300">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            streaming
          </span>
        )}
        <span className="text-xs text-slate-500">{Math.round(latencyMs)}ms</span>
      </div>
      <pre className="text-[11px] sm:text-xs font-mono text-slate-200 bg-black/40 border border-white/8 rounded-xl p-3 sm:p-4 overflow-x-auto whitespace-pre-wrap min-h-[3rem] max-h-[300px] overflow-y-auto">
        {displayText}
      </pre>
    </div>
  );
}

// ── Main Playground ──────────────────────────────────────────────────────────

export function ApiPlayground() {
  const [selectedId, setSelectedId] = useState<string>(ENDPOINTS[0].id);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [apiKey, setApiKey] = useState("");
  const [sending, setSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [response, setResponse] = useState<{
    status: number;
    latencyMs: number;
    body: unknown;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"params" | "curl" | "js" | "python">("params");
  const [showEndpointList, setShowEndpointList] = useState(false);

  const endpoint = useMemo(
    () => ENDPOINTS.find((e) => e.id === selectedId)!,
    [selectedId]
  );

  // Reset fields when endpoint changes
  const handleSelect = (id: string) => {
    setSelectedId(id);
    const ep = ENDPOINTS.find((e) => e.id === id)!;
    const initial: FieldValues = {};
    for (const f of ep.fields) {
      if (f.default !== undefined) initial[f.name] = String(f.default);
    }
    setFieldValues(initial);
    setResponse(null);
    setStreamedText("");
    setShowEndpointList(false);
  };

  const curlSample = useMemo(
    () => buildCurl(endpoint, fieldValues, apiKey),
    [endpoint, fieldValues, apiKey]
  );
  const jsSample = useMemo(
    () => buildJs(endpoint, fieldValues, apiKey),
    [endpoint, fieldValues, apiKey]
  );
  const pythonSample = useMemo(
    () => buildPython(endpoint, fieldValues, apiKey),
    [endpoint, fieldValues, apiKey]
  );

  const missingRequired = endpoint.fields.some(
    (f) => f.required && !fieldValues[f.name]?.trim()
  );
  const needsKey = !apiKey.trim();

  async function handleSend() {
    if (missingRequired || needsKey) return;

    setSending(true);
    setResponse(null);
    setStreamedText("");

    const path = buildPath(endpoint, fieldValues, false);
    const query = buildQueryString(endpoint, fieldValues, false);
    const body = buildBody(endpoint, fieldValues, false);
    const headers: Record<string, string> = {};
    if (body) headers["Content-Type"] = "application/json";
    if (apiKey.trim()) headers["Authorization"] = `Bearer ${apiKey.trim()}`;

    const start = performance.now();

    try {
      const res = await fetch(`${path}${query}`, {
        method: endpoint.method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (endpoint.streaming) {
        setIsStreaming(true);

        if (!res.ok || !res.body) {
          const errBody = await res.json().catch(() => ({}));
          setResponse({
            status: res.status,
            latencyMs: performance.now() - start,
            body: errBody,
          });
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

        setResponse({
          status: res.status,
          latencyMs: performance.now() - start,
          body: null,
        });
        setIsStreaming(false);
      } else {
        const text = await res.text();
        let parsed: unknown;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = text;
        }
        setResponse({
          status: res.status,
          latencyMs: performance.now() - start,
          body: parsed,
        });
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
    <div className="space-y-4">
      {/* API Key Input */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-coral-400" />
          <h3 className="text-sm font-semibold text-white">Your API Key</h3>
        </div>
        <Input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="cnch_... (required for all requests)"
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm font-mono"
        />
        <p className="text-[10px] text-slate-500 mt-2">
          Create a key at{" "}
          <a href="/settings/api-keys" className="text-coral-300 underline">
            Settings → API Keys
          </a>
          . Your key is never stored — it stays in your browser only.
        </p>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
        {/* Endpoint list (desktop sidebar, mobile toggle) */}
        <div className="lg:block">
          <button
            onClick={() => setShowEndpointList(!showEndpointList)}
            className="lg:hidden flex items-center gap-2 w-full p-3 bg-white/5 rounded-xl border border-white/8 text-sm text-white"
          >
            <Code2 className="w-4 h-4 text-coral-400" />
            <span className="truncate">
              <span
                className={cn(
                  "font-mono font-semibold text-[10px] px-1.5 py-0.5 rounded border mr-2",
                  METHOD_COLORS[endpoint.method]
                )}
              >
                {endpoint.method}
              </span>
              {endpoint.title}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 ml-auto transition-transform",
                showEndpointList && "rotate-180"
              )}
            />
          </button>

          <div
            className={cn(
              "mt-2 lg:mt-0 overflow-hidden transition-all",
              showEndpointList
                ? "max-h-[500px] overflow-y-auto"
                : "max-h-0 lg:max-h-none"
            )}
          >
            <GlassCard className="p-3 max-h-[400px] overflow-y-auto">
              <EndpointSelector selectedId={selectedId} onSelect={handleSelect} />
            </GlassCard>
          </div>
        </div>

        {/* Main panel */}
        <div className="space-y-4 min-w-0">
          {/* Endpoint header */}
          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={cn(
                  "font-mono font-semibold text-xs px-2 py-1 rounded-lg border",
                  METHOD_COLORS[endpoint.method]
                )}
              >
                {endpoint.method}
              </span>
              <code className="text-sm font-mono text-white">{endpoint.path}</code>
            </div>
            <p className="text-xs text-slate-400">{endpoint.description}</p>
            {endpoint.rateLimit && (
              <p className="text-[10px] text-slate-500 mt-1">
                Rate limit: {endpoint.rateLimit}
              </p>
            )}
          </GlassCard>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/8 overflow-x-auto">
            {(
              [
                { id: "params", label: "Parameters" },
                { id: "curl", label: "cURL" },
                { id: "js", label: "JavaScript" },
                { id: "python", label: "Python" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-coral-600/20 text-coral-300"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "params" && (
            <GlassCard className="p-4 space-y-4">
              {/* API Key reminder */}
              {!apiKey.trim() && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Enter your API key above to make requests.</span>
                </div>
              )}

              {/* Fields */}
              {endpoint.fields.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {endpoint.fields.map((f) => (
                    <div
                      key={f.name}
                      className={cn(f.kind === "textarea" && "sm:col-span-2")}
                    >
                      <label className="text-xs text-slate-400 mb-1.5 block">
                        {f.name}
                        {f.required && <span className="text-red-400"> *</span>}
                      </label>
                      <FieldInput
                        field={f}
                        value={fieldValues[f.name] ?? ""}
                        onChange={(v) =>
                          setFieldValues((prev) => ({ ...prev, [f.name]: v }))
                        }
                      />
                      <p className="text-[10px] text-slate-600 mt-1">
                        {f.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No parameters required. Just hit Send.
                </p>
              )}

              {/* Send button */}
              <Button
                onClick={handleSend}
                disabled={sending || missingRequired || needsKey}
                className="gap-2"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {sending
                  ? endpoint.streaming
                    ? "Streaming…"
                    : "Sending…"
                  : `Send ${endpoint.method}`}
              </Button>
            </GlassCard>
          )}

          {activeTab === "curl" && (
            <GlassCard className="p-4">
              <div className="relative">
                <pre className="text-[11px] sm:text-xs font-mono text-slate-300 bg-black/40 border border-white/8 rounded-xl p-3 sm:p-4 overflow-x-auto whitespace-pre-wrap">
                  {curlSample}
                </pre>
                <CopyButton value={curlSample} />
              </div>
            </GlassCard>
          )}

          {activeTab === "js" && (
            <GlassCard className="p-4">
              <div className="relative">
                <pre className="text-[11px] sm:text-xs font-mono text-slate-300 bg-black/40 border border-white/8 rounded-xl p-3 sm:p-4 overflow-x-auto whitespace-pre-wrap">
                  {jsSample}
                </pre>
                <CopyButton value={jsSample} />
              </div>
            </GlassCard>
          )}

          {activeTab === "python" && (
            <GlassCard className="p-4">
              <div className="relative">
                <pre className="text-[11px] sm:text-xs font-mono text-slate-300 bg-black/40 border border-white/8 rounded-xl p-3 sm:p-4 overflow-x-auto whitespace-pre-wrap">
                  {pythonSample}
                </pre>
                <CopyButton value={pythonSample} />
              </div>
            </GlassCard>
          )}

          {/* Response */}
          {(response || isStreaming) && (
            <GlassCard className="p-4">
              <p className="text-xs font-semibold text-white mb-3">Response</p>
              <ResponseDisplay
                status={response?.status ?? 0}
                latencyMs={response?.latencyMs ?? 0}
                body={response?.body}
                streamedText={streamedText}
                isStreaming={isStreaming}
              />
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
