"use client";

import { useEffect, useState } from "react";
import {
  UserPlus, FolderPlus, FileCheck, Settings, LayoutDashboard,
  Filter, RefreshCw, Download
} from "lucide-react";

interface Event {
  id: string;
  type: string;
  actorId: string | null;
  actorEmail: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

const eventTypeConfig: Record<string, { label: string; icon: typeof UserPlus; color: string }> = {
  waitlist_signup: { label: "Waitlist Signup", icon: UserPlus, color: "#7c3aed" },
  challenge_joined: { label: "Challenge Joined", icon: UserPlus, color: "#8b5cf6" },
  project_created: { label: "Project Created", icon: FolderPlus, color: "#a78bfa" },
  project_submitted: { label: "Project Submitted", icon: FileCheck, color: "#c084fc" },
  settings_updated: { label: "Settings Updated", icon: Settings, color: "#5b21b6" },
};

function getEventConfig(type: string) {
  return eventTypeConfig[type] || {
    label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: LayoutDashboard,
    color: "#666",
  };
}

function EventRow({ event }: { event: Event }) {
  const config = getEventConfig(event.type);
  const Icon = config.icon;

  const dataEntries = event.data
    ? Object.entries(event.data).filter(([, v]) => v !== null && v !== undefined)
    : [];

  return (
    <div className="flex items-start gap-4 py-4 px-5 border-b border-[var(--conch-border)] hover:bg-white/[0.02] transition-colors">
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${config.color}18` }}
      >
        <Icon className="w-4 h-4" style={{ color: config.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${config.color}15`, color: config.color }}
          >
            {config.label}
          </span>
        </div>

        {event.actorEmail && (
          <p className="text-sm text-[var(--conch-text)] truncate">
            {event.actorEmail}
          </p>
        )}

        {dataEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {dataEntries.map(([key, value]) => (
              <span
                key={key}
                className="text-[10px] px-2 py-0.5 rounded border border-[var(--conch-border)] text-[var(--conch-text-dim)]"
              >
                {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}:{" "}
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="text-right shrink-0">
        <p className="text-xs text-[var(--conch-text-dim)]">
          {new Date(event.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
        <p className="text-[10px] text-[var(--conch-text-dim)]">
          {new Date(event.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchEvents = () => {
    setLoading(true);
    fetch("/api/challenge/admin/events")
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = filter === "all"
    ? events
    : events.filter((e) => e.type === filter);

  const uniqueTypes = ["all", ...new Set(events.map((e) => e.type))];

  const typeCounts = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--conch-text)]">Activity Log</h1>
          <p className="text-sm text-[var(--conch-text-muted)] mt-1">
            {events.length} events recorded
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvents}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-[var(--conch-border)] text-[var(--conch-text-muted)] hover:border-[var(--conch-border-hover)] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              const csv = [
                "Type,Actor,Data,Created",
                ...events.map((e) =>
                  [
                    e.type,
                    e.actorEmail || "",
                    JSON.stringify(e.data || {}),
                    new Date(e.createdAt).toISOString(),
                  ]
                    .map((c) => `"${c}"`)
                    .join(",")
                ),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "challenge-events.csv";
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-[var(--conch-border)] text-[var(--conch-text-muted)] hover:border-[var(--conch-border-hover)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Type summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {Object.entries(typeCounts).map(([type, count]) => {
          const config = getEventConfig(type);
          return (
            <button
              key={type}
              onClick={() => setFilter(filter === type ? "all" : type)}
              className={`conch-glass rounded-xl p-3 text-left transition-all ${
                filter === type ? "ring-1 ring-[var(--conch-purple)]" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[var(--conch-text-dim)] uppercase tracking-wider">
                  {config.label}
                </span>
              </div>
              <p className="text-xl font-bold text-[var(--conch-text)]">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-[var(--conch-text-dim)] shrink-0" />
        {uniqueTypes.map((type) => {
          const config = getEventConfig(type);
          const isActive = filter === type;
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all"
              style={{
                borderColor: isActive ? config.color : "var(--conch-border)",
                background: isActive ? `${config.color}15` : "transparent",
                color: isActive ? config.color : "var(--conch-text-muted)",
              }}
            >
              {type === "all" ? "All" : config.label}
            </button>
          );
        })}
      </div>

      {/* Events list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--conch-purple)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="conch-glass rounded-xl p-12 text-center">
          <p className="text-[var(--conch-text-muted)]">No events found.</p>
        </div>
      ) : (
        <div className="conch-glass rounded-xl overflow-hidden">
          {filteredEvents.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
