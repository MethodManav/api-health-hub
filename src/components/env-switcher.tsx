import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Globe, Settings2 } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn } from "@/lib/utils";

export function EnvSwitcher({ className }: { className?: string }) {
  const { environments, activeEnvironmentId, setActiveEnvironment } = useWorkspaceStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const active = environments.find((e) => e.id === activeEnvironmentId);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
      >
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        {active ? (
          <>
            <span className="h-2 w-2 rounded-full" style={{ background: active.color }} />
            <span>{active.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">No environment</span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-56 rounded-md border border-border bg-popover shadow-card overflow-hidden">
          <button
            onClick={() => { setActiveEnvironment(null); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left"
          >
            <span className="h-2 w-2 rounded-full bg-muted" />
            <span className="text-muted-foreground">No environment</span>
          </button>
          <div className="border-t border-border" />
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => { setActiveEnvironment(env.id); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: env.color }} />
              <span className="flex-1 truncate">{env.name}</span>
              {activeEnvironmentId === env.id && <span className="text-primary">✓</span>}
            </button>
          ))}
          <div className="border-t border-border" />
          <Link
            to="/environments"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left text-primary"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Manage environments
          </Link>
        </div>
      )}
    </div>
  );
}
