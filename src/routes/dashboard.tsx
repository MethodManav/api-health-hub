import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusDot } from "@/components/status-dot";
import { MethodBadge } from "@/components/method-badge";
import { apis, latencyHistory, incidents } from "@/lib/mock-data";
import { Activity, Zap, AlertTriangle, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — DevPulse" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const total = apis.length;
  const healthy = apis.filter((a) => a.status === "healthy").length;
  const avgLatency = Math.round(apis.reduce((s, a) => s + a.latency, 0) / total);
  const avgUptime = (apis.reduce((s, a) => s + a.uptime, 0) / total).toFixed(2);

  const stats = [
    { label: "Total APIs", value: total, icon: Activity, accent: "text-primary" },
    { label: "Healthy", value: `${healthy}/${total}`, icon: TrendingUp, accent: "text-success" },
    { label: "Avg Latency", value: `${avgLatency}ms`, icon: Zap, accent: "text-info" },
    { label: "Uptime", value: `${avgUptime}%`, icon: AlertTriangle, accent: "text-warning" },
  ];

  return (
    <DashboardLayout>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative px-8 py-8 max-w-[1400px] mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest text-primary">● LIVE</span>
              <span className="text-[10px] font-mono text-muted-foreground">— monitoring 8 endpoints</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Production Overview</h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time health & performance across all your APIs.</p>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-card p-5 shadow-card hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
                    <div className="text-2xl font-bold mt-2 font-mono">{s.value}</div>
                  </div>
                  <s.icon className={`h-5 w-5 ${s.accent}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Latency chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Latency (last 24h)</h3>
                  <p className="text-xs text-muted-foreground">Average response time across all endpoints</p>
                </div>
                <span className="text-xs font-mono text-primary">ms</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latencyHistory}>
                    <defs>
                      <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.82 0.18 175)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="oklch(0.82 0.18 175)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="oklch(0.65 0.02 250)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.65 0.02 250)" fontSize={11} tickLine={false} axisLine={false} width={30} />
                    <Tooltip contentStyle={{ background: "oklch(0.21 0.02 250)", border: "1px solid oklch(0.28 0.02 250)", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="latency" stroke="oklch(0.82 0.18 175)" strokeWidth={2} fill="url(#latGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Errors</h3>
                <span className="text-xs font-mono text-destructive">/ hour</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latencyHistory}>
                    <XAxis dataKey="time" stroke="oklch(0.65 0.02 250)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.65 0.02 250)" fontSize={11} tickLine={false} axisLine={false} width={20} />
                    <Tooltip contentStyle={{ background: "oklch(0.21 0.02 250)", border: "1px solid oklch(0.28 0.02 250)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="errors" stroke="oklch(0.65 0.22 25)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Incidents + Endpoints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-semibold">Recent Incidents</h3>
              </div>
              <div className="divide-y divide-border">
                {incidents.map((i) => (
                  <div key={i.id} className="flex items-start gap-3 p-4 hover:bg-accent/30 transition-colors">
                    <div className={`mt-1 h-2 w-2 rounded-full ${i.severity === "critical" ? "bg-destructive" : i.severity === "warning" ? "bg-warning" : "bg-info"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{i.api}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{i.message}</div>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{i.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-semibold">Endpoint Status</h3>
              </div>
              <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                {apis.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 px-4 hover:bg-accent/30 transition-colors">
                    <StatusDot status={a.status} />
                    <MethodBadge method={a.method} />
                    <span className="text-sm font-medium flex-1 truncate">{a.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">{a.latency}ms</span>
                    <span className="text-xs font-mono text-success w-14 text-right">{a.uptime}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Redirect index → dashboard handled in index.tsx
export { redirect };
