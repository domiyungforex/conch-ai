"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toaster";
import type { ProjectDoc, AppwriteDoc } from "@/lib/db";

type Project = AppwriteDoc<ProjectDoc>;

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to fetch projects");
  }
  const data = await res.json();
  return Array.isArray(data.projects) ? data.projects : [];
}

async function createProject(data: {
  name: string;
  description?: string;
  tags?: string[];
}): Promise<Project> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to create project");
  }
  const body = await res.json();
  return body.project ?? body;
}

export function useProjects() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 30_000,
    retry: 2,
  });

  const create = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Project created" });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to create project", description: err.message, variant: "destructive" }),
  });

  return { ...query, create };
}
