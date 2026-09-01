"use client";

import { LineChart, ExternalLink } from "lucide-react";

interface Props {
  symbol: string;
}

// A link to the real tradingview.com chart for this symbol, opened in a new tab —
// not an embedded widget. An embedded chart was tried first but was too cramped on
// both small and large screens (confirmed by the user on both); this gives the full,
// proper-sized, real TradingView experience instead.
export function TradingViewChart({ symbol }: Props) {
  const url = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="my-3 flex items-center gap-3 rounded-xl chat-border chat-card px-4 py-3 hover:bg-card-hover transition-colors not-prose no-underline"
    >
      <div className="w-9 h-9 rounded-lg bg-linear-to-br from-coral-600 to-gold-600 flex items-center justify-center shrink-0">
        <LineChart className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium chat-text-primary">Open {symbol} on TradingView</p>
        <p className="text-xs chat-text-muted">Full chart, all their tools, opens in a new tab</p>
      </div>
      <ExternalLink className="w-4 h-4 chat-text-muted shrink-0" />
    </a>
  );
}
