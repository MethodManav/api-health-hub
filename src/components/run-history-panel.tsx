import { useEffect, useMemo, useState } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { RunHistoryEntry } from "@/lib/mock-data";
import { Clock, Trash2, Inbox, Filter, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const fmtTime = (ts: number) => {
  const d = new Date(ts);
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.max(1, Math.round(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return d.toLocaleString();
};

const statusClass = (s: number, error?: string) =>
  error || s === 0
    ? "bg-destructive/15 text-destructive"
    : s < 300
      ? "bg-success/15 text-success"
      : s < 400
        ? "bg-info/15 text-info"
        : "bg-destructive/15 text-destructive";

type StatusFilter = "all" | "success" | "redirect" | "client" | "server" | "error";

const STATUS_FILTERS: { id: StatusFilter; label: string; hint: string }[] = [
  { id: "all", label: "All", hint: "Show every run" },
  { id: "success", label: "2xx", hint: "Successful (200–299)" },
  { id: "redirect", label: "3xx", hint: "Redirects (300–399)" },
  { id: "client", label: "4xx", hint: "Client errors (400–499)" },
  { id: "server", label: "5xx", hint: "Server errors (500–599)" },
  { id: "error", label: "ERR", hint: "Network errors" },
];

const matchesFilter = (h: RunHistoryEntry, f: StatusFilter, codeQuery: string) => {
  if (codeQuery.trim()) {
    const wanted = codeQuery
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (wanted.length && !wanted.includes(String(h.status))) return false;
  }
  switch (f) {
    case "all":
      return true;
    case "success":
      return h.status >= 200 && h.status < 300;
    case "redirect":
      return h.status >= 300 && h.status < 400;
    case "client":
      return h.status >= 400 && h.status < 500;
    case "server":
      return h.status >= 500 && h.status < 600;
    case "error":
      return h.status === 0 || !!h.error;
  }
};

export function RunHistoryPanel({ apiId }: { apiId: string }) {
  const history = useWorkspaceStore((s) => s.apis.find((a) => a.id === apiId)?.history ?? []);
  const clear = useWorkspaceStore((s) => s.clearHistory);
  const wsId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const savedFilter = useWorkspaceStore(
    (s) => s.data[s.currentWorkspaceId]?.historyFilters?.[apiId],
  );
  const setHistoryFilter = useWorkspaceStore((s) => s.setHistoryFilter);

  const [filter, setFilter] = useState<StatusFilter>((savedFilter?.status as StatusFilter) ?? "all");
  const [codeQuery, setCodeQuery] = useState(savedFilter?.codeQuery ?? "");

  // Reload saved filter when workspace or API changes
  useEffect(() => {
    setFilter((savedFilter?.status as StatusFilter) ?? "all");
    setCodeQuery(savedFilter?.codeQuery ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiId, wsId]);

  // Persist filter changes (debounced for code query)
  useEffect(() => {
    const t = setTimeout(() => {
      setHistoryFilter(apiId, { status: filter, codeQuery });
    }, 200);
    return () => clearTimeout(t);
  }, [apiId, filter, codeQuery, setHistoryFilter]);

  const filtered = useMemo(
    () => history.filter((h) => matchesFilter(h, filter, codeQuery)),
    [history, filter, codeQuery],
  );

  // Counts per filter for badges
  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: history.length, success: 0, redirect: 0, client: 0, server: 0, error: 0 };
    for (const h of history) {
      if (h.status === 0 || h.error) c.error++;
      else if (h.status < 300) c.success++;
      else if (h.status < 400) c.redirect++;
      else if (h.status < 500) c.client++;
      else if (h.status < 600) c.server++;
    }
    return c;
  }, [history]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3 w-3" /> Last {Math.min(history.length, 25)} runs
        </div>
        <div className="flex items-center gap-3">
          {(codeQuery || filter !== "all" || savedFilter) && (
            <button
              onClick={() => {
                setCodeQuery("");
                setFilter("all");
                setHistoryFilter(apiId, { status: "all", codeQuery: "" });
              }}
              title="Clear saved status pill and status-code query for this API"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Reset filters
            </button>
          )}
          {history.length > 0 && (
            <button
              onClick={() => clear(apiId)}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="rounded-md border border-border bg-card/30 p-2 space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <Filter className="h-3 w-3 text-muted-foreground mr-1" />
            {STATUS_FILTERS.map((f) => {
              const active = filter === f.id;
              const count = counts[f.id];
              const disabled = count === 0 && f.id !== "all";
              return (
                <button
                  key={f.id}
                  title={f.hint}
                  disabled={disabled}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono border transition-colors",
                    active
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/40",
                    disabled && "opacity-40 cursor-not-allowed",
                  )}
                >
                  {f.label}
                  <span className="text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={codeQuery}
              onChange={(e) => setCodeQuery(e.target.value)}
              placeholder="Filter by status code (e.g. 200, 404 503)"
              className="flex-1 rounded bg-input border border-border px-2 py-1 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {(codeQuery || filter !== "all") && (
              <button
                onClick={() => {
                  setCodeQuery("");
                  setFilter("all");
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Inbox className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-xs">No runs yet — hit Run to log a request.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border border-dashed border-border rounded-md">
          <Filter className="h-6 w-6 mb-2 opacity-50" />
          <p className="text-xs">No runs match the current filter.</p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-card/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-3 py-1.5 font-medium">When</th>
                <th className="text-left px-3 py-1.5 font-medium">Method</th>
                <th className="text-left px-3 py-1.5 font-medium">Status</th>
                <th className="text-right px-3 py-1.5 font-medium">Time</th>
                <th className="text-right px-3 py-1.5 font-medium">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((h) => (
                <HistoryRow key={h.id} entry={h} />
              ))}
            </tbody>
          </table>
          {filtered.length !== history.length && (
            <div className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground bg-card/40 border-t border-border">
              Showing {filtered.length} of {history.length} runs
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ entry }: { entry: RunHistoryEntry }) {
  return (
    <tr className="hover:bg-accent/30">
      <td className="px-3 py-1.5 text-muted-foreground" title={new Date(entry.timestamp).toLocaleString()}>
        {fmtTime(entry.timestamp)}
      </td>
      <td className="px-3 py-1.5 text-foreground/90">{entry.method}</td>
      <td className="px-3 py-1.5">
        <span className={cn("px-1.5 py-0.5 rounded", statusClass(entry.status, entry.error))}>
          {entry.status === 0 ? "ERR" : entry.status} {entry.statusText}
        </span>
      </td>
      <td className="px-3 py-1.5 text-right text-muted-foreground">{entry.time}ms</td>
      <td className="px-3 py-1.5 text-right text-muted-foreground">
        {entry.size < 1024 ? `${entry.size} B` : `${(entry.size / 1024).toFixed(1)} KB`}
      </td>
    </tr>
  );
}
