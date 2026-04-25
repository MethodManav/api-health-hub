import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Activity, FolderTree, FlaskConical, Settings, ChevronDown, Plus, MoreVertical, Pencil, Trash2, FolderPlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { MethodBadge } from "./method-badge";
import { StatusDot } from "./status-dot";
import { FolderModal, ApiModal, ConfirmModal } from "./crud-modals";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const navigate = useNavigate();
  const { workspaces, currentWorkspaceId, setWorkspace, folders, apis, deleteFolder, deleteApi } = useWorkspaceStore();
  const [wsOpen, setWsOpen] = useState(false);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [folderModal, setFolderModal] = useState<{ open: boolean; id?: string | null }>({ open: false });
  const [apiModal, setApiModal] = useState<{ open: boolean; folderId?: string | null; id?: string | null }>({ open: false });
  const [confirm, setConfirm] = useState<{ open: boolean; type?: "folder" | "api"; id?: string; name?: string }>({ open: false });
  const [menu, setMenu] = useState<{ kind: "folder" | "api"; id: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Initialize all folders open once
  useEffect(() => {
    setOpenFolders((prev) => (prev.size === 0 ? new Set(folders.map((f) => f.id)) : prev));
  }, [folders]);

  // Close menus on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    };
    if (menu) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = workspaces.find((w) => w.id === currentWorkspaceId) ?? workspaces[0];

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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
    <>
      <aside className="flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
          </div>
          <div>
            <div className="font-bold tracking-tight">DevPulse</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">API HEALTH MONITOR</div>
          </div>
        </div>

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
            </div>
          )}
        </div>

        <nav className="px-3 pt-4 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.to || (item.to === "/apis" && pathname.startsWith("/apis"));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 flex-1 overflow-y-auto px-3 pb-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground">COLLECTIONS</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFolderModal({ open: true })}
                className="text-muted-foreground hover:text-primary p-1"
                title="New folder"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setApiModal({ open: true })}
                className="text-muted-foreground hover:text-primary p-1"
                title="New endpoint"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-0.5">
            {folders.map((folder) => {
              const isOpen = openFolders.has(folder.id);
              const folderApis = apis.filter((a) => a.folderId === folder.id);
              return (
                <div key={folder.id}>
                  <div className="group relative flex items-center rounded hover:bg-sidebar-accent">
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="flex flex-1 items-center gap-1.5 px-2 py-1.5 text-sm text-left"
                    >
                      <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", !isOpen && "-rotate-90")} />
                      <span className="font-medium truncate">{folder.name}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{folderApis.length}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenu(menu?.id === folder.id ? null : { kind: "folder", id: folder.id }); }}
                      className="opacity-0 group-hover:opacity-100 px-1.5 py-1 text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                    {menu?.kind === "folder" && menu.id === folder.id && (
                      <div ref={menuRef} className="absolute right-0 top-full mt-1 z-30 w-44 rounded-md border border-border bg-popover shadow-card overflow-hidden">
                        <button onClick={() => { setApiModal({ open: true, folderId: folder.id }); setMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left">
                          <Plus className="h-3.5 w-3.5" /> Add endpoint
                        </button>
                        <button onClick={() => { setFolderModal({ open: true, id: folder.id }); setMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left">
                          <Pencil className="h-3.5 w-3.5" /> Rename
                        </button>
                        <button onClick={() => { setConfirm({ open: true, type: "folder", id: folder.id, name: folder.name }); setMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> Delete folder
                        </button>
                      </div>
                    )}
                  </div>

                  {isOpen && (
                    <div className="ml-3 border-l border-sidebar-border pl-2 space-y-0.5 mt-0.5">
                      {folderApis.length === 0 && (
                        <button
                          onClick={() => setApiModal({ open: true, folderId: folder.id })}
                          className="block w-full text-left px-2 py-1 text-[11px] text-muted-foreground hover:text-primary"
                        >
                          + Add endpoint
                        </button>
                      )}
                      {folderApis.map((api) => (
                        <div key={api.id} className="group relative flex items-center rounded hover:bg-sidebar-accent">
                          <Link
                            to="/apis/$apiId"
                            params={{ apiId: api.id }}
                            className={cn(
                              "flex flex-1 items-center gap-2 px-2 py-1.5 text-xs min-w-0",
                              pathname === `/apis/${api.id}` && "bg-sidebar-accent text-primary",
                            )}
                          >
                            <MethodBadge method={api.method} className="text-[9px] min-w-[38px] py-0" />
                            <span className="truncate flex-1">{api.name}</span>
                            <StatusDot status={api.status} />
                          </Link>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenu(menu?.id === api.id ? null : { kind: "api", id: api.id }); }}
                            className="opacity-0 group-hover:opacity-100 px-1.5 py-1 text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                          {menu?.kind === "api" && menu.id === api.id && (
                            <div ref={menuRef} className="absolute right-0 top-full mt-1 z-30 w-40 rounded-md border border-border bg-popover shadow-card overflow-hidden">
                              <button onClick={() => { setApiModal({ open: true, id: api.id }); setMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button onClick={() => { setConfirm({ open: true, type: "api", id: api.id, name: api.name }); setMenu(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left text-destructive">
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Uncategorized */}
            {apis.filter((a) => !a.folderId).length > 0 && (
              <div className="pt-3">
                <div className="px-2 mb-1 text-[10px] font-semibold tracking-widest text-muted-foreground">UNCATEGORIZED</div>
                {apis.filter((a) => !a.folderId).map((api) => (
                  <Link
                    key={api.id}
                    to="/apis/$apiId"
                    params={{ apiId: api.id }}
                    className={cn(
                      "flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-sidebar-accent",
                      pathname === `/apis/${api.id}` && "bg-sidebar-accent text-primary",
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
        </div>

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

      <FolderModal
        open={folderModal.open}
        folderId={folderModal.id}
        onClose={() => setFolderModal({ open: false })}
      />
      <ApiModal
        open={apiModal.open}
        defaultFolderId={apiModal.folderId ?? null}
        apiId={apiModal.id}
        onClose={() => setApiModal({ open: false })}
      />
      <ConfirmModal
        open={confirm.open}
        title={confirm.type === "folder" ? "Delete folder?" : "Delete endpoint?"}
        message={
          confirm.type === "folder"
            ? `"${confirm.name}" will be removed. Endpoints inside it will become uncategorized.`
            : `"${confirm.name}" will be permanently deleted.`
        }
        onClose={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.type === "folder" && confirm.id) deleteFolder(confirm.id);
          if (confirm.type === "api" && confirm.id) {
            deleteApi(confirm.id);
            if (pathname === `/apis/${confirm.id}`) navigate({ to: "/apis" });
          }
        }}
      />
    </>
  );
}
