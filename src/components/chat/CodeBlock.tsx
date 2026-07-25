"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Copy, Check, Download, Play, X, ExternalLink } from "lucide-react";
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

const PREVIEWABLE = new Set(["html", "htm", "jsx", "tsx"]);

function buildHtmlPreview(lang: string, code: string): string {
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

interface Props {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: Props) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const lang = language.toLowerCase();
  const canPreview = PREVIEWABLE.has(lang);
  const previewSrc = useMemo(() => (canPreview ? buildHtmlPreview(lang, code) : ""), [canPreview, lang, code]);

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

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] not-prose">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
        <span className="text-xs font-mono text-slate-400">{language || "text"}</span>
        <div className="flex items-center gap-1">
          {canPreview && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1 text-slate-400 hover:text-white"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? <X className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {showPreview ? "Hide preview" : "Preview"}
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

      {showPreview && canPreview && (
        <div className="border-b border-white/10 bg-white">
          <div className="flex items-center justify-end px-2 py-1 bg-slate-100">
            <button onClick={handleOpenNewTab} className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Open in new tab
            </button>
          </div>
          <iframe srcDoc={previewSrc} sandbox="allow-scripts" className="w-full h-80 border-0" title="Code preview" />
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
