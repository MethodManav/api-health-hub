import { useWorkspaceStore } from "@/store/workspace-store";
import type { RunHistoryEntry } from "@/lib/mock-data";
import { Clock, Trash2, Inbox } from "lucide-react";
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

export function RunHistoryPanel({ apiId }: { apiId: string }) {
  const history = useWorkspaceStore((s) => s.apis.find((a) => a.id === apiId)?.history ?? []);
  const clear = useWorkspaceStore((s) => s.clearHistory);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3 w-3" /> Last {Math.min(history.length, 25)} runs
        </div>
        {history.length > 0 && (
          <button
            onClick={() => clear(apiId)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Inbox className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-xs">No runs yet — hit Run to log a request.</p>
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
              {history.map((h) => (
                <HistoryRow key={h.id} entry={h} />
              ))}
            </tbody>
          </table>
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
