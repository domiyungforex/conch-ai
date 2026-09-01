"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toaster";
import type { ContextObjectDoc, DecisionDoc, ConstraintDoc, AppwriteDoc } from "@/lib/db";

type ContextObject = AppwriteDoc<ContextObjectDoc>;
type Decision = AppwriteDoc<DecisionDoc>;
type Constraint = AppwriteDoc<ConstraintDoc>;

// ── Context Objects ────────────────────────────────────────────────────────

async function fetchContextObjects(type?: string): Promise<ContextObject[]> {
  const params = new URLSearchParams();
  if (type && type !== "ALL") params.set("type", type);
  params.set("limit", "100");
  const res = await fetch(`/api/context?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to fetch context");
  }
  const data = await res.json();
  return Array.isArray(data.contexts) ? data.contexts : [];
}

async function createContextObject(data: {
  type: string;
  content: string;
  importance?: number;
  confidence?: number;
  tags?: string[];
}): Promise<ContextObject> {
  const res = await fetch("/api/context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to create context");
  }
  const body = await res.json();
  return body.context ?? body;
}

async function deleteContextObject(id: string): Promise<void> {
  const res = await fetch("/api/context", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contextId: id, lifecycle: "deleted" }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to delete context");
  }
}

export function useContextObjects(type?: string) {
  const qc = useQueryClient();
  const key = ["contextObjects", type ?? "ALL"];

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchContextObjects(type),
    staleTime: 30_000,
    retry: 2,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["contextObjects"] });

  const create = useMutation({
    mutationFn: createContextObject,
    onSuccess: () => {
      invalidate();
      toast({ title: "Context stored" });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to store context", description: err.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: deleteContextObject,
    onSuccess: () => {
      invalidate();
      toast({ title: "Context deleted" });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to delete context", description: err.message, variant: "destructive" }),
  });

  return { ...query, create, remove };
}

// ── Decisions ──────────────────────────────────────────────────────────────

async function fetchDecisions(): Promise<Decision[]> {
  const res = await fetch("/api/context/decisions?limit=50");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to fetch decisions");
  }
  const data = await res.json();
  return Array.isArray(data.decisions) ? data.decisions : [];
}

async function createDecision(data: {
  what: string;
  why: string;
  alternatives?: string;
  constraints?: string;
  assumptions?: string;
  confidence?: number;
  tags?: string[];
}): Promise<Decision> {
  const res = await fetch("/api/context/decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to create decision");
  }
  const body = await res.json();
  return body.decision ?? body;
}

export function useDecisions() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["decisions"],
    queryFn: fetchDecisions,
    staleTime: 30_000,
    retry: 2,
  });

  const create = useMutation({
    mutationFn: createDecision,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      qc.invalidateQueries({ queryKey: ["contextObjects"] });
      toast({ title: "Decision recorded" });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to record decision", description: err.message, variant: "destructive" }),
  });

  return { ...query, create };
}

// ── Constraints ────────────────────────────────────────────────────────────

async function fetchConstraints(): Promise<Constraint[]> {
  const res = await fetch("/api/context/constraints?limit=50");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to fetch constraints");
  }
  const data = await res.json();
  return Array.isArray(data.constraints) ? data.constraints : [];
}

async function createConstraint(data: {
  content: string;
  category: string;
  severity?: "hard" | "soft";
  tags?: string[];
}): Promise<Constraint> {
  const res = await fetch("/api/context/constraints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to create constraint");
  }
  const body = await res.json();
  return body.constraint ?? body;
}

export function useConstraints() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["constraints"],
    queryFn: fetchConstraints,
    staleTime: 30_000,
    retry: 2,
  });

  const create = useMutation({
    mutationFn: createConstraint,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["constraints"] });
      qc.invalidateQueries({ queryKey: ["contextObjects"] });
      toast({ title: "Constraint added" });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to add constraint", description: err.message, variant: "destructive" }),
  });

  return { ...query, create };
}
