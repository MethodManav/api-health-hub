import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — DevPulse" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Workspace Settings</h1>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">General</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Workspace name</label>
                <input defaultValue="Production" className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Polling interval</label>
                <select className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm">
                  <option>30 seconds</option>
                  <option>1 minute</option>
                  <option>5 minutes</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Notifications</h2>
            <div className="space-y-3 text-sm">
              {["Email on incidents", "Slack alerts", "Weekly digest"].map((label) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <button className="rounded-md bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
            Save changes
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
