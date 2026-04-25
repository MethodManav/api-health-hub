import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — DevPulse" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 600);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Left: form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
            </div>
            <span className="font-bold text-lg tracking-tight">DevPulse</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 mb-8">
            {mode === "login" ? "Sign in to monitor your APIs" : "Start monitoring in 30 seconds"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Name</label>
                <input required className="w-full rounded-md bg-input border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" required defaultValue="alex@devpulse.io" className="w-full rounded-md bg-input border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" required defaultValue="demopass" className="w-full rounded-md bg-input border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Loading…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-md border border-border bg-card py-2 text-xs font-medium hover:bg-accent">GitHub</button>
            <button className="rounded-md border border-border bg-card py-2 text-xs font-medium hover:bg-accent">Google</button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8">
            {mode === "login" ? "New to DevPulse? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary hover:underline font-medium">
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* Right: visual */}
      <div className="hidden lg:flex relative overflow-hidden bg-card border-l border-border items-center justify-center grid-bg">
        <div className="absolute inset-0 bg-gradient-glow" />
        <div className="relative max-w-md p-8">
          <div className="rounded-xl border border-border bg-card/80 backdrop-blur p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
              <span className="text-[10px] font-mono tracking-widest text-success">SYSTEM HEALTHY</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              {[
                { m: "GET", n: "/users/me", t: "89ms", c: "text-success" },
                { m: "POST", n: "/auth/login", t: "124ms", c: "text-success" },
                { m: "PUT", n: "/users/me", t: "412ms", c: "text-warning" },
                { m: "GET", n: "/billing/invoices", t: "203ms", c: "text-success" },
              ].map((r) => (
                <div key={r.n} className="flex items-center gap-3 p-2 rounded bg-background/40">
                  <span className="text-method-get font-bold w-12">{r.m}</span>
                  <span className="flex-1 truncate">{r.n}</span>
                  <span className={r.c}>{r.t}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Real-time monitoring. Built for developers.
          </p>
        </div>
      </div>
    </div>
  );
}
