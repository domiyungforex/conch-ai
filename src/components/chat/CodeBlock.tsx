"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code]);

  return (
    <div className="my-2 rounded-xl overflow-hidden not-prose">
      <div className="flex items-center justify-between px-3 py-1.5 chat-code-header">
        <span className="text-[11px] font-mono chat-text-muted">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] chat-text-muted hover:text-foreground transition-colors px-1.5 py-0.5 rounded"
        >
          {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="chat-code-bg overflow-x-auto p-3 rounded-t-none">
        <code className="text-[13px] leading-relaxed font-mono chat-text-primary whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
