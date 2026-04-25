import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useWorkspaceStore, type EnvVariable } from "@/store/workspace-store";
import { Modal } from "@/components/modal";
import { Plus, Trash2, Eye, EyeOff, Globe, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/environments")({
  head: () => ({ meta: [{ title: "Environments — DevPulse" }] }),
  component: EnvironmentsPage,
});

function EnvironmentsPage() {
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
    addEnvironment,
    renameEnvironment,
    deleteEnvironment,
    setEnvironmentVariables,
  } = useWorkspaceStore();

  const [selectedId, setSelectedId] = useState<string | null>(environments[0]?.id ?? null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const selected = environments.find((e) => e.id === selectedId) ?? environments[0] ?? null;

  const updateVar = (idx: number, patch: Partial<EnvVariable>) => {
    if (!selected) return;
    const next = selected.variables.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    setEnvironmentVariables(selected.id, next);
  };

  const addVar = () => {
    if (!selected) return;
    setEnvironmentVariables(selected.id, [...selected.variables, { key: "", value: "" }]);
  };

  const removeVar = (idx: number) => {
    if (!selected) return;
    setEnvironmentVariables(selected.id, selected.variables.filter((_, i) => i !== idx));
  };

  const toggleReveal = (idx: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <DashboardLayout>
      <div className="flex h-screen">
        {/* Sidebar list */}
        <div className="w-64 border-r border-border bg-card/30 overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />Environments</h2>
            <button
              onClick={() => setCreateOpen(true)}
              className="text-muted-foreground hover:text-primary"
              title="New environment"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="p-2 space-y-0.5">
            {environments.map((env) => (
              <div
                key={env.id}
                onClick={() => setSelectedId(env.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2.5 py-2 cursor-pointer text-sm",
                  selectedId === env.id ? "bg-accent text-foreground" : "hover:bg-accent/50 text-muted-foreground",
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: env.color }} />
                {renaming === env.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => { renameEnvironment(env.id, renameValue || env.name); setRenaming(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { renameEnvironment(env.id, renameValue || env.name); setRenaming(null); } if (e.key === "Escape") setRenaming(null); }}
                    className="flex-1 bg-input border border-border rounded px-1.5 py-0.5 text-xs"
                  />
                ) : (
                  <span className="flex-1 truncate">{env.name}</span>
                )}
                {activeEnvironmentId === env.id && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
            ))}
            {environments.length === 0 && (
              <p className="text-xs text-muted-foreground p-3">No environments yet.</p>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-8 max-w-4xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ background: selected.color }} />
                    <h1 className="text-2xl font-bold tracking-tight">{selected.name}</h1>
                    <button
                      onClick={() => { setRenaming(selected.id); setRenameValue(selected.name); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Variables here are injected as <code className="font-mono text-primary">{`{{key}}`}</code> into URL, headers and body.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveEnvironment(activeEnvironmentId === selected.id ? null : selected.id)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium",
                      activeEnvironmentId === selected.id
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    {activeEnvironmentId === selected.id ? "Active ✓" : "Set as active"}
                  </button>
                  <button
                    onClick={() => {
                      deleteEnvironment(selected.id);
                      setSelectedId(environments[0]?.id ?? null);
                    }}
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 px-4 py-2.5 border-b border-border bg-accent/30 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                  <div>Variable</div>
                  <div>Value</div>
                  <div>Secret</div>
                  <div></div>
                </div>
                <div className="divide-y divide-border">
                  {selected.variables.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 px-4 py-2 items-center">
                      <input
                        value={v.key}
                        onChange={(e) => updateVar(idx, { key: e.target.value })}
                        placeholder="baseUrl"
                        className="bg-input border border-border rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type={v.secret && !revealed.has(idx) ? "password" : "text"}
                        value={v.value}
                        onChange={(e) => updateVar(idx, { value: e.target.value })}
                        placeholder="https://api.example.com"
                        className="bg-input border border-border rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={() => updateVar(idx, { secret: !v.secret })}
                        className={cn("p-1.5 rounded hover:bg-accent", v.secret ? "text-warning" : "text-muted-foreground")}
                        title="Toggle secret"
                      >
                        {v.secret ? (
                          <span onClick={(e) => { e.stopPropagation(); toggleReveal(idx); }}>
                            {revealed.has(idx) ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </span>
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button onClick={() => removeVar(idx)} className="p-1.5 text-muted-foreground hover:text-destructive rounded">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addVar}
                  className="w-full px-4 py-2.5 text-xs text-primary hover:bg-accent/30 border-t border-border flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add variable
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div>
                <Globe className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No environment selected</p>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="mt-3 text-primary hover:underline text-sm"
                >
                  Create one
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setNewName(""); }} title="New Environment">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            const env = addEnvironment(newName.trim());
            setSelectedId(env.id);
            setNewName("");
            setCreateOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Name</label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Staging"
              className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
            <button type="submit" className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">Create</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
