import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  workspaces as initialWorkspaces,
  folders as initialFolders,
  apis as initialApis,
  type Workspace,
  type Folder,
  type ApiEndpoint,
  type HttpMethod,
} from "@/lib/mock-data";

type WorkspaceState = {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  setWorkspace: (id: string) => void;
  addWorkspace: (name: string, color?: string) => void;

  folders: Folder[];
  apis: ApiEndpoint[];

  addFolder: (name: string, parentId?: string | null) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;

  addApi: (input: { name: string; method: HttpMethod; endpoint: string; folderId: string | null }) => ApiEndpoint;
  updateApi: (id: string, patch: Partial<ApiEndpoint>) => void;
  deleteApi: (id: string) => void;

  user: { name: string; email: string } | null;
  setUser: (u: { name: string; email: string } | null) => void;
};

const palette = [
  "oklch(0.82 0.18 175)",
  "oklch(0.78 0.16 75)",
  "oklch(0.7 0.18 300)",
  "oklch(0.7 0.15 240)",
  "oklch(0.74 0.18 155)",
];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: initialWorkspaces,
      currentWorkspaceId: initialWorkspaces[0].id,
      setWorkspace: (id) => set({ currentWorkspaceId: id }),
      addWorkspace: (name, color) => {
        const id = `ws-${Date.now()}`;
        const ws = { id, name, color: color ?? palette[get().workspaces.length % palette.length] };
        set({ workspaces: [...get().workspaces, ws], currentWorkspaceId: id });
      },

      folders: initialFolders,
      apis: initialApis,

      addFolder: (name, parentId = null) => {
        const folder = { id: `f-${Date.now()}`, name, parentId };
        set({ folders: [...get().folders, folder] });
        return folder;
      },
      renameFolder: (id, name) =>
        set({ folders: get().folders.map((f) => (f.id === id ? { ...f, name } : f)) }),
      deleteFolder: (id) =>
        set({
          folders: get().folders.filter((f) => f.id !== id),
          // orphan APIs go to root
          apis: get().apis.map((a) => (a.folderId === id ? { ...a, folderId: null } : a)),
        }),

      addApi: ({ name, method, endpoint, folderId }) => {
        const api: ApiEndpoint = {
          id: `a-${Date.now()}`,
          name,
          method,
          endpoint,
          folderId,
          status: "healthy",
          latency: Math.round(80 + Math.random() * 120),
          uptime: 99.9,
        };
        set({ apis: [...get().apis, api] });
        return api;
      },
      updateApi: (id, patch) =>
        set({ apis: get().apis.map((a) => (a.id === id ? { ...a, ...patch } : a)) }),
      deleteApi: (id) => set({ apis: get().apis.filter((a) => a.id !== id) }),

      user: { name: "Alex Chen", email: "alex@devpulse.io" },
      setUser: (user) => set({ user }),
    }),
    {
      name: "devpulse-workspace",
      partialize: (s) => ({
        workspaces: s.workspaces,
        currentWorkspaceId: s.currentWorkspaceId,
        folders: s.folders,
        apis: s.apis,
      }),
    },
  ),
);
