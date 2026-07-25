"use client";

import { useEffect, useRef } from "react";

interface Props {
  symbol: string;
}

// TradingView's own free embeddable widget — a real TradingView chart (their UI, their
// indicators), loaded via their documented script-injection pattern. This is the actual
// TradingView, unlike the SMC analysis elsewhere which reads Twelve Data candles — the
// two are separate: this is the visual, that's the numeric feed Claude reasons over.
export function TradingViewChart({ symbol }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol,
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);
  }, [symbol]);

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 not-prose">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
        <span className="text-xs font-mono text-slate-400">TradingView — {symbol}</span>
      </div>
      <div className="tradingview-widget-container w-full h-[280px] sm:h-[420px]" ref={containerRef} />
    </div>
  );
}
