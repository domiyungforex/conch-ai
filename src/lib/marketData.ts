// Real-time-ish price + technical analysis via Twelve Data (twelvedata.com) — covers
// forex, gold/commodities (XAU/USD), crypto, and stocks on a single free-tier API key,
// unlike stock-only providers. Indicators (SMA/EMA/RSI) are computed here from raw OHLCV
// rather than Twelve Data's paid indicator endpoints, keeping this on the free tier.
import { checkRateLimit } from "./rateLimit";

const TD_BASE = "https://api.twelvedata.com";
const CACHE_TTL_MS = 60_000;

interface TDCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
}

interface TDTimeSeriesResponse {
  values?: TDCandle[];
  status?: string;
  message?: string;
}

export interface MarketAnalysis {
  symbol: string;
  interval: string;
  lastPrice: number;
  change: number | null;
  changePercent: number | null;
  recentHigh: number;
  recentLow: number;
  sma20: number | null;
  sma50: number | null;
  ema20: number | null;
  rsi14: number | null;
  trend: "up" | "down" | "flat";
  candleCount: number;
  asOf: string;
}

const cache = new Map<string, { data: MarketAnalysis; expiresAt: number }>();

function sma(closesMostRecentFirst: number[], period: number): number | null {
  if (closesMostRecentFirst.length < period) return null;
  const slice = closesMostRecentFirst.slice(0, period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(closesMostRecentFirst: number[], period: number): number | null {
  if (closesMostRecentFirst.length < period) return null;
  const chron = [...closesMostRecentFirst].reverse();
  const k = 2 / (period + 1);
  let value = chron.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < chron.length; i++) {
    value = chron[i] * k + value * (1 - k);
  }
  return value;
}

function rsi(closesMostRecentFirst: number[], period = 14): number | null {
  if (closesMostRecentFirst.length < period + 1) return null;
  const chron = [...closesMostRecentFirst].reverse();
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = chron[i] - chron[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < chron.length; i++) {
    const diff = chron[i] - chron[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export async function getMarketAnalysis(apiKey: string, symbol: string, interval: string): Promise<MarketAnalysis> {
  const cacheKey = `${symbol}:${interval}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  // Twelve Data's free tier is 8 requests/minute for the WHOLE app (one shared API key),
  // not per-user — guard it with a conservative shared limit so concurrent users can't
  // blow through the quota and take the tool down for everyone.
  const guard = checkRateLimit("marketdata:global", 6, 60_000);
  if (!guard.success) {
    throw new Error("Market data is temporarily rate-limited — try again in a moment.");
  }

  const url = `${TD_BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&outputsize=60&apikey=${apiKey}`;
  const res = await fetch(url);
  const data: TDTimeSeriesResponse = await res.json();

  if (data.status === "error" || !data.values || data.values.length === 0) {
    throw new Error(data.message ?? `No data returned for "${symbol}" — check the symbol format.`);
  }

  // Twelve Data returns candles most-recent-first.
  const closes = data.values.map((v) => parseFloat(v.close));
  const highs = data.values.map((v) => parseFloat(v.high));
  const lows = data.values.map((v) => parseFloat(v.low));

  const lastPrice = closes[0];
  const priorClose = closes.length > 1 ? closes[1] : null;
  const change = priorClose !== null ? lastPrice - priorClose : null;
  const changePercent = priorClose ? ((change as number) / priorClose) * 100 : null;

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);

  let trend: "up" | "down" | "flat" = "flat";
  if (sma20 !== null && sma50 !== null && sma20 !== sma50) {
    trend = sma20 > sma50 ? "up" : "down";
  }

  const result: MarketAnalysis = {
    symbol,
    interval,
    lastPrice,
    change,
    changePercent,
    recentHigh: Math.max(...highs.slice(0, 20)),
    recentLow: Math.min(...lows.slice(0, 20)),
    sma20,
    sma50,
    ema20: ema(closes, 20),
    rsi14: rsi(closes, 14),
    trend,
    candleCount: data.values.length,
    asOf: data.values[0].datetime,
  };

  cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}
