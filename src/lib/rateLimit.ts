const rateMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    rateMap.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse(resetAt: number) {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    }
  );
}
