"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import worldTopology from "world-atlas/countries-110m.json";

interface CountryStat {
  code: string;
  name: string;
  numericId: string | null;
  count: number;
}

interface UserStats {
  total: number;
  countries: CountryStat[];
  updatedAt: string;
}

async function fetchStats(): Promise<UserStats> {
  const res = await fetch("/api/stats/users");
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

function flagEmoji(alpha2: string): string {
  if (!/^[A-Za-z]{2}$/.test(alpha2)) return "";
  return alpha2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export function WorldUserMap() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["stats", "users"],
    queryFn: fetchStats,
    // Polled rather than pushed over a socket — this page has no signed-in
    // session to authorize an Appwrite Realtime subscription (see
    // AppwriteRealtimeProvider's comment on why Realtime needs a live Auth
    // session here), and at this scale a short poll is indistinguishable
    // from push for a human watching the number.
    refetchInterval: 8000,
  });
  const [hovered, setHovered] = useState<CountryStat | null>(null);

  const byNumericId = useMemo(() => {
    const map = new Map<string, CountryStat>();
    for (const c of data?.countries ?? []) {
      if (c.numericId) map.set(c.numericId, c);
    }
    return map;
  }, [data]);

  const maxCount = useMemo(
    () => Math.max(1, ...(data?.countries ?? []).map((c) => c.count)),
    [data]
  );

  const ranked = (data?.countries ?? []).filter((c) => c.count > 0);
  const knownTotal = ranked.reduce((sum, c) => sum + c.count, 0);
  const unknownCount = (data?.total ?? 0) - knownTotal;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="flex flex-col items-center text-center gap-3 mb-12">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-teal-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
          </span>
          Live
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-normal text-white text-balance">
          Memories being made, around the world
        </h1>
        <p className="text-slate-400 max-w-xl text-balance">
          Every account on this map is a real person who signed up — each one
          beginning a memory that stays theirs. This counts live as new people join.
        </p>
        <div className="mt-4 font-serif text-5xl md:text-6xl text-white tabular-nums">
          {isLoading ? "—" : (data?.total ?? 0).toLocaleString()}
        </div>
        <div className="text-sm text-slate-500">
          {isLoading ? "Loading…" : isError ? "Couldn't load live data." : "people building their memory with Conch"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={{ scale: 148 }}
            width={800}
            height={420}
            style={{ width: "100%", height: "auto" }}
          >
            <Geographies geography={worldTopology}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const stat = byNumericId.get(geo.id as string);
                  const intensity = stat ? Math.sqrt(stat.count / maxCount) : 0;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => stat && setHovered(stat)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        default: {
                          fill: stat ? `rgba(224, 122, 99, ${0.25 + intensity * 0.65})` : "rgba(242, 232, 224, 0.06)",
                          stroke: "rgba(10, 22, 19, 0.8)",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: stat ? "rgba(224, 122, 99, 0.95)" : "rgba(242, 232, 224, 0.1)",
                          stroke: "rgba(10, 22, 19, 0.8)",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        pressed: {
                          fill: "rgba(224, 122, 99, 0.95)",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {hovered && (
            <div className="absolute bottom-4 left-4 rounded-lg bg-[#04060d] border border-white/10 px-3 py-2 text-sm shadow-lg pointer-events-none">
              <span className="mr-1.5">{flagEmoji(hovered.code)}</span>
              <span className="text-white font-medium">{hovered.name}</span>
              <span className="text-slate-400 ml-1.5">
                {hovered.count} {hovered.count === 1 ? "user" : "users"}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-medium text-white mb-4">By country</h2>
          {ranked.length === 0 && !isLoading ? (
            <p className="text-sm text-slate-500">No signups yet — check back soon.</p>
          ) : (
            <ul className="space-y-3">
              {ranked.map((c) => (
                <li key={c.code} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-300 min-w-0">
                    <span>{flagEmoji(c.code)}</span>
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="text-white font-medium tabular-nums shrink-0 ml-3">{c.count}</span>
                </li>
              ))}
              {unknownCount > 0 && (
                <li className="flex items-center justify-between text-sm pt-3 border-t border-white/10">
                  <span className="text-slate-500">Unlocated</span>
                  <span className="text-slate-500 tabular-nums">{unknownCount}</span>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
