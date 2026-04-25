import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FlaskConical, Plus } from "lucide-react";

export const Route = createFileRoute("/tests")({
  head: () => ({ meta: [{ title: "Tests — DevPulse" }] }),
  component: TestsPage,
});

const tests = [
  { id: "t-1", name: "Auth flow smoke test", lastRun: "5 min ago", status: "passed", duration: "1.2s" },
  { id: "t-2", name: "User CRUD integration", lastRun: "1 hour ago", status: "passed", duration: "3.4s" },
  { id: "t-3", name: "Billing webhook E2E", lastRun: "3 hour ago", status: "failed", duration: "8.1s" },
];

function TestsPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tests</h1>
          <p className="text-muted-foreground text-sm mt-1">Automated test suites for your API collections.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4" /> New Test
        </button>
      </header>

      <div className="rounded-lg border border-border bg-card shadow-card divide-y divide-border">
        {tests.map((t) => (
          <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.status === "passed" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              <FlaskConical className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-muted-foreground">Last run {t.lastRun} · {t.duration}</div>
            </div>
            <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider ${t.status === "passed" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              {t.status}
            </span>
            <button className="text-xs text-primary hover:underline">Run</button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
        Drag an API from the sidebar to create a new test.
      </div>
    </div>
  );
}
