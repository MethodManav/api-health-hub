import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useWorkspaceStore } from "@/store/workspace-store";
import { MethodBadge } from "@/components/method-badge";
import { StatusDot } from "@/components/status-dot";
import { FolderModal, ApiModal, ConfirmModal } from "@/components/crud-modals";
import { Plus, FolderPlus, Pencil, Trash2, Search, Folder as FolderIcon } from "lucide-react";

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
  const { folders, apis, deleteFolder, deleteApi } = useWorkspaceStore();
  const [folderModal, setFolderModal] = useState<{ open: boolean; id?: string | null }>({ open: false });
  const [apiModal, setApiModal] = useState<{ open: boolean; folderId?: string | null; id?: string | null }>({ open: false });
  const [confirm, setConfirm] = useState<{ open: boolean; type?: "folder" | "api"; id?: string; name?: string }>({ open: false });
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  const filteredApis = apis.filter((a) => {
    const matchesQuery = !query || a.name.toLowerCase().includes(query.toLowerCase()) || a.endpoint.toLowerCase().includes(query.toLowerCase());
    const matchesMethod = methodFilter === "ALL" || a.method === methodFilter;
    return matchesQuery && matchesMethod;
  });

  const apisByFolder = (folderId: string | null) => filteredApis.filter((a) => a.folderId === folderId);
  const totalUncat = apisByFolder(null).length;

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {folders.length} folders · {apis.length} endpoints
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFolderModal({ open: true })}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <FolderPlus className="h-4 w-4" /> New Folder
          </button>
          <button
            onClick={() => setApiModal({ open: true })}
            className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            <Plus className="h-4 w-4" /> New Endpoint
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full rounded-md bg-input border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-md bg-input border border-border px-3 py-2 text-sm font-mono"
        >
          {["ALL", "GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Folder cards */}
      <div className="space-y-4">
        {folders.map((folder) => {
          const folderApis = apisByFolder(folder.id);
          return (
            <div key={folder.id} className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border bg-accent/20">
                <div className="flex items-center gap-2.5">
                  <FolderIcon className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{folder.name}</h3>
                  <span className="text-xs text-muted-foreground">{folderApis.length} endpoint{folderApis.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setApiModal({ open: true, folderId: folder.id })}
                    className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                  <button onClick={() => setFolderModal({ open: true, id: folder.id })} className="p-1.5 text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setConfirm({ open: true, type: "folder", id: folder.id, name: folder.name })} className="p-1.5 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {folderApis.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No endpoints. <button onClick={() => setApiModal({ open: true, folderId: folder.id })} className="text-primary hover:underline">Add one</button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {folderApis.map((a) => (
                      <tr key={a.id} className="hover:bg-accent/30 transition-colors group">
                        <td className="px-4 py-2.5 w-8"><StatusDot status={a.status} /></td>
                        <td className="px-2 py-2.5 w-20"><MethodBadge method={a.method} /></td>
                        <td className="px-2 py-2.5 font-medium">
                          <Link to="/apis/$apiId" params={{ apiId: a.id }} className="hover:text-primary">{a.name}</Link>
                        </td>
                        <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground truncate max-w-md">{a.endpoint}</td>
                        <td className="px-2 py-2.5 font-mono text-xs text-right w-20">{a.latency}ms</td>
                        <td className="px-2 py-2.5 font-mono text-xs text-right text-success w-16">{a.uptime}%</td>
                        <td className="px-2 py-2.5 w-20 text-right">
                          <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setApiModal({ open: true, id: a.id })} className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setConfirm({ open: true, type: "api", id: a.id, name: a.name })} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}

        {/* Uncategorized */}
        {totalUncat > 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card/50 overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm text-muted-foreground">Uncategorized</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {apisByFolder(null).map((a) => (
                  <tr key={a.id} className="hover:bg-accent/30 group">
                    <td className="px-4 py-2.5 w-8"><StatusDot status={a.status} /></td>
                    <td className="px-2 py-2.5 w-20"><MethodBadge method={a.method} /></td>
                    <td className="px-2 py-2.5 font-medium"><Link to="/apis/$apiId" params={{ apiId: a.id }} className="hover:text-primary">{a.name}</Link></td>
                    <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground truncate max-w-md">{a.endpoint}</td>
                    <td className="px-2 py-2.5 w-20 text-right">
                      <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100">
                        <button onClick={() => setApiModal({ open: true, id: a.id })} className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setConfirm({ open: true, type: "api", id: a.id, name: a.name })} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {folders.length === 0 && totalUncat === 0 && (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <FolderIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">No collections yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first folder to organize endpoints.</p>
            <button onClick={() => setFolderModal({ open: true })} className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
              <FolderPlus className="h-4 w-4" /> Create folder
            </button>
          </div>
        )}
      </div>

      <FolderModal open={folderModal.open} folderId={folderModal.id} onClose={() => setFolderModal({ open: false })} />
      <ApiModal open={apiModal.open} defaultFolderId={apiModal.folderId ?? null} apiId={apiModal.id} onClose={() => setApiModal({ open: false })} />
      <ConfirmModal
        open={confirm.open}
        title={confirm.type === "folder" ? "Delete folder?" : "Delete endpoint?"}
        message={confirm.type === "folder"
          ? `"${confirm.name}" will be removed. Endpoints inside become uncategorized.`
          : `"${confirm.name}" will be permanently deleted.`}
        onClose={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.type === "folder" && confirm.id) deleteFolder(confirm.id);
          if (confirm.type === "api" && confirm.id) deleteApi(confirm.id);
        }}
      />
    </div>
  );
}
