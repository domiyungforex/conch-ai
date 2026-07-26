"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useResourceCrud } from "@/hooks/useResourceCrud";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "datetime";
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
}

export interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface ResourcePanelProps<T extends { $id: string }> {
  basePath: string | null;
  title: string;
  description?: string;
  emptyLabel: string;
  fields: FieldConfig[];
  columns: ColumnConfig<T>[];
  readOnly?: boolean;
}

function buildPayload(fields: FieldConfig[], form: Record<string, string>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = form[field.key];
    if (raw === undefined || raw === "") continue;
    if (field.type === "number") payload[field.key] = Number(raw);
    else if (field.type === "datetime") payload[field.key] = new Date(raw).toISOString();
    else payload[field.key] = raw;
  }
  return payload;
}

export function ResourcePanel<T extends { $id: string }>({
  basePath,
  title,
  description,
  emptyLabel,
  fields,
  columns,
  readOnly = false,
}: ResourcePanelProps<T>) {
  const { list, create, remove } = useResourceCrud<T>(basePath);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleCreate = () => {
    create.mutate(buildPayload(fields, form), {
      onSuccess: () => {
        setForm({});
        setShowForm(false);
      },
    });
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {!readOnly && (
          <Button size="sm" variant="secondary" className="gap-1.5 h-8 text-xs" onClick={() => setShowForm((s) => !s)}>
            <Plus className="w-3.5 h-3.5" />
            {showForm ? "Cancel" : "Add"}
          </Button>
        )}
      </div>
      {description && <p className="text-xs text-slate-400 mb-4">{description}</p>}

      {showForm && !readOnly && (
        <div className="mb-4 p-4 rounded-xl border border-white/8 bg-white/5 space-y-3">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="text-xs text-slate-400 mb-1 block">{field.label}</label>
              {field.type === "textarea" ? (
                <Textarea
                  value={form[field.key] ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="text-sm"
                />
              ) : field.type === "select" ? (
                <Select value={form[field.key] ?? field.defaultValue} onValueChange={(v) => setField(field.key, v)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : "text"}
                  value={form[field.key] ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-9 text-sm"
                />
              )}
            </div>
          ))}
          <Button size="sm" className="gap-1.5 h-8 text-xs" disabled={create.isPending} onClick={handleCreate}>
            {create.isPending && <LoadingSpinner size="sm" />}
            Save
          </Button>
        </div>
      )}

      {list.isLoading ? (
        <div className="h-16 animate-pulse bg-white/5 rounded-xl" />
      ) : list.isError ? (
        <p className="text-sm text-red-400">Couldn&apos;t load.</p>
      ) : !list.data?.length ? (
        <p className="text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                {columns.map((col) => (
                  <th key={col.key} className="px-2 py-2 font-medium">{col.label}</th>
                ))}
                {!readOnly && <th className="px-2 py-2 w-8" />}
              </tr>
            </thead>
            <tbody>
              {list.data.map((item) => (
                <tr key={item.$id} className="border-t border-white/5">
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 py-2.5 text-slate-300 align-top">
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "—")}
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="px-2 py-2.5 align-top">
                      <button
                        onClick={() => remove.mutate(item.$id)}
                        disabled={remove.isPending}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
