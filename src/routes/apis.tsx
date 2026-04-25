import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { apis } from "@/lib/mock-data";
import { MethodBadge } from "@/components/method-badge";
import { StatusDot } from "@/components/status-dot";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/apis")({
  head: () => ({ meta: [{ title: "APIs — DevPulse" }] }),
  component: ApisLayout,
});

function ApisLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

export function ApisIndex() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">API Collections</h1>
        <p className="text-muted-foreground text-sm mt-1">Select an endpoint from the sidebar or browse all below.</p>
      </header>

      <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-accent/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Method</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Endpoint</th>
              <th className="text-right px-4 py-3 font-medium">Latency</th>
              <th className="text-right px-4 py-3 font-medium">Uptime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {apis.map((a) => (
              <tr key={a.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3"><StatusDot status={a.status} /></td>
                <td className="px-4 py-3"><MethodBadge method={a.method} /></td>
                <td className="px-4 py-3 font-medium">
                  <Link to="/apis/$apiId" params={{ apiId: a.id }} className="hover:text-primary">
                    {a.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-md">{a.endpoint}</td>
                <td className="px-4 py-3 font-mono text-right">{a.latency}ms</td>
                <td className="px-4 py-3 font-mono text-right text-success">{a.uptime}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
