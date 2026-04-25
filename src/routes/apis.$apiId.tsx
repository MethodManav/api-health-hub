import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { apis, type HttpMethod } from "@/lib/mock-data";
import { MethodBadge } from "@/components/method-badge";
import { StatusDot } from "@/components/status-dot";
import { Send, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apis/$apiId")({
  loader: ({ params }) => {
    const api = apis.find((a) => a.id === params.apiId);
    if (!api) throw notFound();
    return api;
  },
  component: ApiEditor,
  notFoundComponent: () => <div className="p-8">API not found</div>,
});

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const TABS = ["Params", "Headers", "Body", "Auth"] as const;

function ApiEditor() {
  const api = Route.useLoaderData();
  const [method, setMethod] = useState<HttpMethod>(api.method);
  const [url, setUrl] = useState(api.endpoint);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Headers");
  const [response, setResponse] = useState<{ status: number; time: number; body: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState([
    { key: "Content-Type", value: "application/json" },
    { key: "Authorization", value: "Bearer ●●●●●●●●" },
  ]);
  const [body, setBody] = useState(`{\n  "email": "user@devpulse.io",\n  "password": "••••••••"\n}`);

  const handleSend = () => {
    setLoading(true);
    setResponse(null);
    setTimeout(() => {
      setResponse({
        status: api.status === "down" ? 503 : 200,
        time: api.latency || 87,
        body: api.status === "down"
          ? `{\n  "error": "Service Unavailable",\n  "code": "UPSTREAM_TIMEOUT"\n}`
          : `{\n  "id": "usr_8a3f2b",\n  "email": "user@devpulse.io",\n  "name": "Alex Chen",\n  "verified": true,\n  "createdAt": "2024-08-12T14:32:00Z"\n}`,
      });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/40 px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <StatusDot status={api.status} />
          <h1 className="text-lg font-semibold">{api.name}</h1>
          <span className="ml-auto text-xs font-mono text-muted-foreground">
            uptime {api.uptime}% · avg {api.latency}ms
          </span>
        </div>
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="rounded-md bg-input border border-border px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-md bg-input border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
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
                  activeTab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {activeTab === "Headers" && (
              <div className="space-y-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={h.key}
                      onChange={(e) => { const next = [...headers]; next[i].key = e.target.value; setHeaders(next); }}
                      placeholder="Header"
                      className="flex-1 rounded-md bg-input border border-border px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      value={h.value}
                      onChange={(e) => { const next = [...headers]; next[i].value = e.target.value; setHeaders(next); }}
                      placeholder="Value"
                      className="flex-[2] rounded-md bg-input border border-border px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button onClick={() => setHeaders(headers.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive p-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setHeaders([...headers, { key: "", value: "" }])}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:opacity-80 mt-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Add header
                </button>
              </div>
            )}
            {activeTab === "Body" && (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                spellCheck={false}
                className="w-full h-full min-h-[300px] rounded-md bg-input border border-border p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            )}
            {activeTab === "Params" && (
              <p className="text-sm text-muted-foreground">No query parameters configured.</p>
            )}
            {activeTab === "Auth" && (
              <div className="space-y-3 max-w-md">
                <label className="block text-xs font-medium text-muted-foreground">Auth Type</label>
                <select className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm">
                  <option>Bearer Token</option>
                  <option>Basic Auth</option>
                  <option>API Key</option>
                  <option>None</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Response panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Response</span>
            {response && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className={cn(
                  "px-2 py-0.5 rounded",
                  response.status < 300 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                )}>
                  {response.status} {response.status < 300 ? "OK" : "Error"}
                </span>
                <span className="text-muted-foreground">{response.time}ms</span>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {!response && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <div className="h-12 w-12 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-3">
                  <Send className="h-5 w-5" />
                </div>
                <p className="text-sm">Hit <span className="font-mono text-primary">Send</span> to test this endpoint</p>
              </div>
            )}
            {loading && (
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </div>
            )}
            {response && (
              <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/90">{response.body}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
