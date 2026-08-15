"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Copy, Check, Download, Play, X, ExternalLink, Loader2 } from "lucide-react";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";

const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((m) => m.Prism),
  { ssr: false, loading: () => null }
);

const EXT_MAP: Record<string, string> = {
  javascript: "js", js: "js", typescript: "ts", ts: "ts",
  jsx: "jsx", tsx: "tsx", python: "py", py: "py",
  html: "html", htm: "html", css: "css", json: "json",
  bash: "sh", shell: "sh", sh: "sh", sql: "sql",
  yaml: "yml", yml: "yml", markdown: "md", md: "md",
  go: "go", rust: "rs", rs: "rs", java: "java",
  c: "c", cpp: "cpp", "c++": "cpp", ruby: "rb", rb: "rb",
  php: "php", swift: "swift", kotlin: "kt", kt: "kt",
};

type PreviewKind = "render" | "console" | "python" | null;

function getPreviewKind(lang: string): PreviewKind {
  if (lang === "html" || lang === "htm" || lang === "jsx" || lang === "tsx") return "render";
  if (lang === "js" || lang === "javascript" || lang === "ts" || lang === "typescript") return "console";
  if (lang === "py" || lang === "python") return "python";
  return null;
}

function buildRenderPreview(lang: string, code: string): string {
  if (lang === "html" || lang === "htm") return code;

  const defaultFn = code.match(/export\s+default\s+function\s+(\w+)/);
  const defaultRef = code.match(/export\s+default\s+(\w+)\s*;?\s*$/m);
  const componentName = defaultFn?.[1] ?? defaultRef?.[1];
  const hasRender = /ReactDOM\.(createRoot|render)/.test(code);

  let body = code
    .replace(/^\s*import\s+.*?;?\s*$/gm, "")
    .replace(/export\s+default\s+function\s+(\w+)/, "function $1")
    .replace(/export\s+default\s+(\w+)\s*;?\s*$/m, "");

  // Stripped imports mean hooks referenced bare (useState, useEffect, ...) would be
  // undefined — React is only available as the UMD global here, not a module binding.
  body = `const { useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer, useLayoutEffect } = React;\n${body}`;

  if (!hasRender && componentName) {
    body += `\nReactDOM.createRoot(document.getElementById("root")).render(<${componentName} />);`;
  }

  // Babel Standalone's unpinned "latest" build splits into dynamically-imported chunks
  // that throw "Cannot use import statement outside a module" under a plain <script> tag —
  // pinned to a known-good pre-split version.
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{font-family:system-ui,sans-serif;margin:0;padding:16px;color:#111}</style>
</head><body>
<div id="root"></div>
<script>
window.onerror = function (msg) {
  document.getElementById("root").innerHTML =
    "<pre style=\\"color:#dc2626;white-space:pre-wrap;font-family:monospace;font-size:12px\\">" + msg + "</pre>";
};
</script>
<script type="text/babel" data-presets="react">
${body}
</script>
</body></html>`;
}

function buildConsolePreview(lang: string, code: string): string {
  const isTs = lang === "ts" || lang === "typescript";
  const body = code.replace(/^\s*import\s+.*?;?\s*$/gm, "").replace(/^\s*export\s+/gm, "");

  const scriptTag = isTs
    ? `<script type="text/babel" data-presets="typescript">\n${body}\n</script>`
    : `<script>\n${body}\n</script>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
${isTs ? '<script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"></script>' : ""}
<style>
body{font-family:ui-monospace,Menlo,monospace;margin:0;padding:12px;background:#181209;color:#c9d1d9;font-size:12.5px;white-space:pre-wrap;word-break:break-word}
.err{color:#f87171}
.empty{color:#6b7280;font-style:italic}
</style>
</head><body>
<div id="out"></div>
<script>
var out = document.getElementById("out");
var hasOutput = false;
function fmt(a) {
  if (typeof a === "string") return a;
  try { return JSON.stringify(a, null, 2); } catch (e) { return String(a); }
}
function write(text, cls) {
  hasOutput = true;
  var line = document.createElement("div");
  if (cls) line.className = cls;
  line.textContent = text;
  out.appendChild(line);
}
console.log = function () { write(Array.prototype.map.call(arguments, fmt).join(" ")); };
console.error = function () { write(Array.prototype.map.call(arguments, fmt).join(" "), "err"); };
console.warn = function () {
  var msg = Array.prototype.map.call(arguments, fmt).join(" ");
  if (msg.indexOf("in-browser Babel transformer") !== -1) return;
  write(msg, "err");
};
window.onerror = function (msg) { write(String(msg), "err"); return true; };
window.addEventListener("load", function () {
  setTimeout(function () {
    if (!hasOutput) write("(no console output)", "empty");
  }, 100);
});
</script>
${scriptTag}
</body></html>`;
}

interface PyResult {
  stdout: string;
  stderr: string;
  returnCode: number | null;
}

interface Props {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: Props) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pyLoading, setPyLoading] = useState(false);
  const [pyResult, setPyResult] = useState<PyResult | null>(null);
  const [pyError, setPyError] = useState<string | null>(null);

  const lang = language.toLowerCase();
  const kind = getPreviewKind(lang);
  const previewSrc = useMemo(() => {
    if (kind === "render") return buildRenderPreview(lang, code);
    if (kind === "console") return buildConsolePreview(lang, code);
    return "";
  }, [kind, lang, code]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const ext = EXT_MAP[lang] ?? "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conch-snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([previewSrc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const runPython = async () => {
    setPyLoading(true);
    setPyError(null);
    try {
      const res = await fetch("/api/code/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Execution failed");
      setPyResult(data);
    } catch (err) {
      setPyError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setPyLoading(false);
    }
  };

  const handleTogglePython = () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    setShowPreview(true);
    if (!pyResult && !pyLoading) runPython();
  };

  const buttonLabel = kind === "render" ? "Preview" : "Run";

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#181209] not-prose">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
        <span className="text-xs font-mono text-slate-400">{language || "text"}</span>
        <div className="flex items-center gap-1">
          {kind && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1 text-slate-400 hover:text-white"
              onClick={kind === "python" ? handleTogglePython : () => setShowPreview((v) => !v)}
            >
              {showPreview ? <X className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {showPreview ? `Hide ${buttonLabel.toLowerCase()}` : buttonLabel}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={handleDownload} title="Download">
            <Download className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={handleCopy} title="Copy">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {showPreview && kind === "render" && (
        <div className="border-b border-white/10 bg-[#ffffff]">
          <div className="flex items-center justify-end px-2 py-1 bg-slate-100">
            <button onClick={handleOpenNewTab} className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Open in new tab
            </button>
          </div>
          <iframe srcDoc={previewSrc} sandbox="allow-scripts" className="w-full h-80 border-0" title="Code preview" />
        </div>
      )}

      {showPreview && kind === "console" && (
        <div className="border-b border-white/10">
          <iframe srcDoc={previewSrc} sandbox="allow-scripts" className="w-full h-48 border-0" title="Console output" />
        </div>
      )}

      {showPreview && kind === "python" && (
        <div className="border-b border-white/10 bg-[#181209] px-3 py-2 font-mono text-xs">
          {pyLoading ? (
            <div className="flex items-center gap-2 text-slate-400 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…
            </div>
          ) : pyError ? (
            <p className="text-red-400 whitespace-pre-wrap">{pyError}</p>
          ) : pyResult ? (
            <div className="space-y-1">
              {pyResult.stdout && <pre className="whitespace-pre-wrap text-slate-300">{pyResult.stdout}</pre>}
              {pyResult.stderr && <pre className="whitespace-pre-wrap text-red-400">{pyResult.stderr}</pre>}
              {!pyResult.stdout && !pyResult.stderr && <p className="text-slate-500 italic">(no output)</p>}
              <button onClick={runPython} className="text-[11px] text-slate-500 hover:text-slate-300 mt-1">
                Run again
              </button>
            </div>
          ) : null}
        </div>
      )}

      <SyntaxHighlighter
        language={lang}
        style={oneDark}
        customStyle={{ margin: 0, padding: "12px 14px", background: "transparent", fontSize: "12.5px" }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
