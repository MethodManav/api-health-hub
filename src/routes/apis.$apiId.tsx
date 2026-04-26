import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkspaceStore, interpolateEnv, extractVarRefs } from "@/store/workspace-store";
import type { HttpMethod, KeyValueRow } from "@/lib/mock-data";
import { MethodBadge } from "@/components/method-badge";
import { StatusDot } from "@/components/status-dot";
import { EnvSwitcher } from "@/components/env-switcher";
import { JsonEditor } from "@/components/json-editor";
import { buildCurl } from "@/lib/curl";
import {
  Send,
  Plus,
  Trash2,
  AlertTriangle,
  Save,
  GripVertical,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


let __rowSeq = 0;
const newRow = (key = "", value = ""): KeyValueRow => ({
  id: `r-${Date.now().toString(36)}-${(++__rowSeq).toString(36)}`,
  key,
  value,
});
const ensureTrailingEmpty = (rows: KeyValueRow[]): KeyValueRow[] => {
  if (rows.length === 0 || rows[rows.length - 1].key !== "" || rows[rows.length - 1].value !== "") {
    return [...rows, newRow()];
  }
  return rows;
};
const stripEmpty = (rows: KeyValueRow[]) =>
  rows.filter((r) => r.key.trim() !== "" || r.value.trim() !== "");

export const Route = createFileRoute("/apis/$apiId")({
  component: ApiEditor,
  notFoundComponent: () => <div className="p-8">API not found</div>,
});

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const TABS = ["Params", "Headers", "Body", "Auth"] as const;

function ApiEditor() {
  const { apiId } = Route.useParams();
  const api = useWorkspaceStore((s) => s.apis.find((a) => a.id === apiId));

  if (!api) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold">Endpoint not found</h2>
        <p className="text-sm text-muted-foreground mt-1">It may have been deleted.</p>
      </div>
    );
  }

  return <ApiEditorInner key={api.id} apiId={api.id} />;
}

type ResponseState = {
  status: number;
  statusText: string;
  time: number;
  size: number;
  headers: Record<string, string>;
  body: string;
  error?: string;
};

function ApiEditorInner({ apiId }: { apiId: string }) {
  const api = useWorkspaceStore((s) => s.apis.find((a) => a.id === apiId)!);
  const updateApi = useWorkspaceStore((s) => s.updateApi);
  const environments = useWorkspaceStore((s) => s.environments);
  const activeEnvironmentId = useWorkspaceStore((s) => s.activeEnvironmentId);
  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
  const envVars = activeEnv?.variables ?? [];

  const [method, setMethod] = useState<HttpMethod>(api.method);
  const [url, setUrl] = useState(api.endpoint);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Headers");
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseTab, setResponseTab] = useState<"body" | "headers">("body");
  const [params, setParams] = useState<KeyValueRow[]>(() =>
    ensureTrailingEmpty(api.params ?? []),
  );
  const [headers, setHeaders] = useState<KeyValueRow[]>(() =>
    ensureTrailingEmpty(api.headers ?? [newRow("Accept", "application/json")]),
  );
  const [body, setBody] = useState(api.body ?? `{\n  "key": "value"\n}`);

  // Persist params/headers/body to store (debounced) so changes survive navigation.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      updateApi(apiId, {
        params: stripEmpty(params),
        headers: stripEmpty(headers),
        body,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [params, headers, body, apiId, updateApi]);

  // Detect referenced env vars
  const referencedVars = useMemo(() => {
    const refs = new Set<string>();
    [url, ...headers.flatMap((h) => [h.key, h.value]), body].forEach((s) =>
      extractVarRefs(s).forEach((r) => refs.add(r))
    );
    return Array.from(refs);
  }, [url, headers, body]);

  const missingVars = referencedVars.filter((v) => !envVars.find((x) => x.key === v));

  const resolvedUrl = interpolateEnv(url, envVars);
  const resolvedPreviewWithParams = (() => {
    const filtered = params.filter((p) => p.key);
    if (!filtered.length) return resolvedUrl;
    const qs = filtered.map((p) => `${encodeURIComponent(interpolateEnv(p.key, envVars))}=${encodeURIComponent(interpolateEnv(p.value, envVars))}`).join("&");
    return resolvedUrl + (resolvedUrl.includes("?") ? "&" : "?") + qs;
  })();

  const handleSave = () => {
    updateApi(api.id, { method, endpoint: url });
  };

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    setResponseTab("body");
    const start = performance.now();

    try {
      const finalUrl = resolvedPreviewWithParams;
      const headerObj: Record<string, string> = {};
      headers.forEach((h) => {
        const k = interpolateEnv(h.key, envVars).trim();
        if (k) headerObj[k] = interpolateEnv(h.value, envVars);
      });

      const init: RequestInit = {
        method,
        headers: headerObj,
      };
      if (method !== "GET" && method !== "DELETE" && body.trim()) {
        init.body = interpolateEnv(body, envVars);
      }

      const res = await fetch(finalUrl, init);
      const text = await res.text();
      const elapsed = Math.round(performance.now() - start);

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { responseHeaders[k] = v; });

      let formatted = text;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* leave as-is */
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: elapsed,
        size: new Blob([text]).size,
        headers: responseHeaders,
        body: formatted,
      });

      // update endpoint live stats
      updateApi(api.id, {
        latency: elapsed,
        status: res.ok ? "healthy" : res.status >= 500 ? "down" : "degraded",
      });
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setResponse({
        status: 0,
        statusText: "Network Error",
        time: elapsed,
        size: 0,
        headers: {},
        body: "",
        error: err instanceof Error ? err.message : String(err),
      });
      updateApi(api.id, { status: "down" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/40 px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <StatusDot status={api.status} />
          <h1 className="text-lg font-semibold">{api.name}</h1>
          <span className="text-xs font-mono text-muted-foreground">
            uptime {api.uptime}% · avg {api.latency}ms
          </span>
          <div className="ml-auto">
            <EnvSwitcher />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="rounded-md bg-input border border-border px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="relative flex-1">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="{{baseUrl}}/users/me"
              className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-accent"
            title="Save endpoint"
          >
            <Save className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading ? "Sending…" : "Run"}
          </button>
        </div>

        {/* Resolved URL preview & warnings */}
        {(referencedVars.length > 0 || missingVars.length > 0) && (
          <div className="mt-2.5 flex items-start gap-2 text-[11px] font-mono">
            {missingVars.length > 0 ? (
              <div className="flex items-center gap-1.5 text-warning">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Unresolved: {missingVars.map((v) => `{{${v}}}`).join(", ")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-success">→</span>
                <span className="truncate">{resolvedPreviewWithParams}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Request panel */}
        <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
          <div className="flex border-b border-border px-4">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {activeTab === "Params" && (
              <KeyValueList
                rows={params}
                onChange={setParams}
                placeholderKey="key"
                placeholderValue="value"
              />
            )}
            {activeTab === "Headers" && (
              <KeyValueList
                rows={headers}
                onChange={setHeaders}
                placeholderKey="Header"
                placeholderValue="Value"
              />
            )}
            {activeTab === "Body" && (
              <div>
                <div className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">JSON</div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  spellCheck={false}
                  className="w-full h-[400px] rounded-md bg-input border border-border p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            )}
            {activeTab === "Auth" && (
              <div className="space-y-3 max-w-md">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">Auth Type</label>
                <select className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm">
                  <option>Bearer Token</option>
                  <option>Basic Auth</option>
                  <option>API Key</option>
                  <option>None</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Tip: use <code className="font-mono text-primary">{`{{token}}`}</code> in headers and define it in your environment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Response panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Response</span>
              {response && (
                <>
                  <button
                    onClick={() => setResponseTab("body")}
                    className={cn("text-xs px-2 py-0.5 rounded", responseTab === "body" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
                  >Body</button>
                  <button
                    onClick={() => setResponseTab("headers")}
                    className={cn("text-xs px-2 py-0.5 rounded", responseTab === "headers" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
                  >Headers ({Object.keys(response.headers).length})</button>
                </>
              )}
            </div>
            {response && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className={cn(
                  "px-2 py-0.5 rounded",
                  response.error ? "bg-destructive/15 text-destructive" :
                  response.status < 300 ? "bg-success/15 text-success" :
                  response.status < 400 ? "bg-info/15 text-info" :
                  "bg-destructive/15 text-destructive",
                )}>
                  {response.status || "ERR"} {response.statusText}
                </span>
                <span className="text-muted-foreground">{response.time}ms</span>
                <span className="text-muted-foreground">{formatBytes(response.size)}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {!response && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <div className="h-12 w-12 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-3">
                  <Send className="h-5 w-5" />
                </div>
                <p className="text-sm">Hit <span className="font-mono text-primary">Run</span> to send the request</p>
                {!activeEnv && (
                  <p className="text-xs text-muted-foreground mt-2">No active environment — variables won't be resolved.</p>
                )}
              </div>
            )}
            {loading && (
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </div>
            )}
            {response && response.error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
                <div className="flex items-center gap-2 text-destructive font-semibold mb-1">
                  <AlertTriangle className="h-4 w-4" /> Request failed
                </div>
                <p className="text-xs font-mono text-destructive/80">{response.error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This may be due to CORS, an invalid URL, or a network issue.
                </p>
              </div>
            )}
            {response && !response.error && responseTab === "body" && (
              <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/90">{response.body || <span className="text-muted-foreground italic">Empty body</span>}</pre>
            )}
            {response && !response.error && responseTab === "headers" && (
              <table className="w-full text-xs font-mono">
                <tbody className="divide-y divide-border">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <tr key={k}>
                      <td className="py-1.5 pr-4 text-primary align-top whitespace-nowrap">{k}</td>
                      <td className="py-1.5 text-foreground/80 break-all">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyValueList({
  rows,
  onChange,
  placeholderKey,
  placeholderValue,
}: {
  rows: KeyValueRow[];
  onChange: (next: KeyValueRow[]) => void;
  placeholderKey: string;
  placeholderValue: string;
}) {
  const update = (id: string, patch: Partial<Pick<KeyValueRow, "key" | "value">>) => {
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    onChange(ensureTrailingEmpty(next));
  };
  const remove = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    onChange(ensureTrailingEmpty(next));
  };
  const add = () => onChange([...rows, newRow()]);

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="flex gap-2">
          <input
            value={r.key}
            onChange={(e) => update(r.id, { key: e.target.value })}
            placeholder={placeholderKey}
            className="flex-1 rounded-md bg-input border border-border px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            value={r.value}
            onChange={(e) => update(r.id, { value: e.target.value })}
            placeholder={placeholderValue}
            className="flex-[2] rounded-md bg-input border border-border px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={() => remove(r.id)}
            className="text-muted-foreground hover:text-destructive p-1.5"
            title="Remove row"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:opacity-80 mt-2"
      >
        <Plus className="h-3.5 w-3.5" /> Add row
      </button>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
