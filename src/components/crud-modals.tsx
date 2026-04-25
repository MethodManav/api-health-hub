import { useState, type FormEvent } from "react";
import { Modal } from "./modal";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { HttpMethod } from "@/lib/mock-data";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export function FolderModal({
  open,
  onClose,
  folderId,
}: {
  open: boolean;
  onClose: () => void;
  folderId?: string | null; // if provided & exists -> rename
}) {
  const { folders, addFolder, renameFolder } = useWorkspaceStore();
  const editing = folderId ? folders.find((f) => f.id === folderId) : null;
  const [name, setName] = useState(editing?.name ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) renameFolder(editing.id, name.trim());
    else addFolder(name.trim());
    setName("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Rename Folder" : "New Folder"}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            Folder name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Auth APIs"
            className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            {editing ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ApiModal({
  open,
  onClose,
  defaultFolderId = null,
  apiId,
}: {
  open: boolean;
  onClose: () => void;
  defaultFolderId?: string | null;
  apiId?: string | null;
}) {
  const { folders, apis, addApi, updateApi } = useWorkspaceStore();
  const editing = apiId ? apis.find((a) => a.id === apiId) : null;

  const [name, setName] = useState(editing?.name ?? "");
  const [method, setMethod] = useState<HttpMethod>(editing?.method ?? "GET");
  const [endpoint, setEndpoint] = useState(editing?.endpoint ?? "https://api.example.com/");
  const [folderId, setFolderId] = useState<string | null>(editing?.folderId ?? defaultFolderId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !endpoint.trim()) return;
    if (editing) updateApi(editing.id, { name: name.trim(), method, endpoint: endpoint.trim(), folderId });
    else addApi({ name: name.trim(), method, endpoint: endpoint.trim(), folderId });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Endpoint" : "New Endpoint"}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Login API"
            className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-2">
          <div className="w-28">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Endpoint URL</label>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Folder</label>
          <select
            value={folderId ?? ""}
            onChange={(e) => setFolderId(e.target.value || null)}
            className="w-full rounded-md bg-input border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">— No folder —</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
            {editing ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex justify-end gap-2 pt-5">
        <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}
