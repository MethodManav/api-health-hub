import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, FolderTree, FlaskConical, Settings, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { folders, apis } from "@/lib/mock-data";
import { MethodBadge } from "./method-badge";
import { StatusDot } from "./status-dot";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { workspaces, currentWorkspaceId, setWorkspace } = useWorkspaceStore();
  const [wsOpen, setWsOpen] = useState(false);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(folders.map((f) => f.id)));
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = workspaces.find((w) => w.id === currentWorkspaceId)!;

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: Activity },
    { to: "/apis", label: "APIs", icon: FolderTree },
    { to: "/tests", label: "Tests", icon: FlaskConical },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
          <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
        </div>
        <div>
          <div className="font-bold tracking-tight">DevPulse</div>
          <div className="text-[10px] text-muted-foreground -mt-0.5">API HEALTH MONITOR</div>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="relative px-3 pt-3">
        <button
          onClick={() => setWsOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-left hover:bg-sidebar-accent transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: current.color }} />
            <span className="text-sm font-medium">{current.name}</span>
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", wsOpen && "rotate-180")} />
        </button>
        {wsOpen && (
          <div className="absolute left-3 right-3 top-full mt-1 z-20 rounded-md border border-sidebar-border bg-popover shadow-card overflow-hidden">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => { setWorkspace(ws.id); setWsOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: ws.color }} />
                {ws.name}
              </button>
            ))}
            <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left border-t border-border text-primary">
              <Plus className="h-3.5 w-3.5" /> New Workspace
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="px-3 pt-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.to || (item.to === "/apis" && pathname.startsWith("/apis"));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Folder Tree */}
      <div className="mt-6 flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground">COLLECTIONS</span>
          <button className="text-muted-foreground hover:text-primary">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-0.5">
          {folders.map((folder) => {
            const isOpen = openFolders.has(folder.id);
            const folderApis = apis.filter((a) => a.folderId === folder.id);
            return (
              <div key={folder.id}>
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm hover:bg-sidebar-accent text-left"
                >
                  <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", !isOpen && "-rotate-90")} />
                  <span className="font-medium">{folder.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{folderApis.length}</span>
                </button>
                {isOpen && (
                  <div className="ml-3 border-l border-sidebar-border pl-2 space-y-0.5 mt-0.5">
                    {folderApis.map((api) => (
                      <Link
                        key={api.id}
                        to="/apis/$apiId"
                        params={{ apiId: api.id }}
                        className={cn(
                          "flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-sidebar-accent group",
                          pathname === `/apis/${api.id}` && "bg-sidebar-accent",
                        )}
                      >
                        <MethodBadge method={api.method} className="text-[9px] min-w-[38px] py-0" />
                        <span className="truncate flex-1">{api.name}</span>
                        <StatusDot status={api.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
            AC
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Alex Chen</div>
            <div className="text-[11px] text-muted-foreground truncate">alex@devpulse.io</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
