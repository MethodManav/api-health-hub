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
  type RunHistoryEntry,
} from "@/lib/mock-data";

const MAX_HISTORY = 25;

export type EnvVariable = { key: string; value: string; secret?: boolean };
export type Environment = {
  id: string;
  name: string;
  color: string;
  variables: EnvVariable[];
};

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
  recordRun: (apiId: string, entry: Omit<RunHistoryEntry, "id" | "timestamp">) => void;
  clearHistory: (apiId: string) => void;

  // Environments
  environments: Environment[];
  activeEnvironmentId: string | null;
  setActiveEnvironment: (id: string | null) => void;
  addEnvironment: (name: string) => Environment;
  renameEnvironment: (id: string, name: string) => void;
  deleteEnvironment: (id: string) => void;
  setEnvironmentVariables: (id: string, vars: EnvVariable[]) => void;

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

const defaultEnvironments: Environment[] = [
  {
    id: "env-prod",
    name: "Production",
    color: "oklch(0.82 0.18 175)",
    variables: [
      { key: "baseUrl", value: "https://jsonplaceholder.typicode.com" },
      { key: "apiVersion", value: "v1" },
      { key: "token", value: "prod-xyz-secret", secret: true },
    ],
  },
  {
    id: "env-dev",
    name: "Development",
    color: "oklch(0.78 0.16 75)",
    variables: [
      { key: "baseUrl", value: "https://jsonplaceholder.typicode.com" },
      { key: "apiVersion", value: "v1" },
      { key: "token", value: "dev-abc-token", secret: true },
    ],
  },
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
      recordRun: (apiId, entry) => {
        const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const next: RunHistoryEntry = { ...entry, id, timestamp: Date.now() };
        set({
          apis: get().apis.map((a) =>
            a.id === apiId
              ? { ...a, history: [next, ...(a.history ?? [])].slice(0, MAX_HISTORY) }
              : a,
          ),
        });
      },
      clearHistory: (apiId) =>
        set({ apis: get().apis.map((a) => (a.id === apiId ? { ...a, history: [] } : a)) }),

      environments: defaultEnvironments,
      activeEnvironmentId: "env-prod",
      setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),
      addEnvironment: (name) => {
        const env: Environment = {
          id: `env-${Date.now()}`,
          name,
          color: palette[get().environments.length % palette.length],
          variables: [{ key: "baseUrl", value: "https://api.example.com" }],
        };
        set({ environments: [...get().environments, env], activeEnvironmentId: env.id });
        return env;
      },
      renameEnvironment: (id, name) =>
        set({ environments: get().environments.map((e) => (e.id === id ? { ...e, name } : e)) }),
      deleteEnvironment: (id) =>
        set({
          environments: get().environments.filter((e) => e.id !== id),
          activeEnvironmentId: get().activeEnvironmentId === id ? null : get().activeEnvironmentId,
        }),
      setEnvironmentVariables: (id, vars) =>
        set({ environments: get().environments.map((e) => (e.id === id ? { ...e, variables: vars } : e)) }),

      user: { name: "Alex Chen", email: "alex@devpulse.io" },
      setUser: (user) => set({ user }),
    }),
    {
      name: "devpulse-workspace",
      version: 3,
      partialize: (s) => ({
        workspaces: s.workspaces,
        currentWorkspaceId: s.currentWorkspaceId,
        folders: s.folders,
        apis: s.apis,
        environments: s.environments,
        activeEnvironmentId: s.activeEnvironmentId,
      }),
    },
  ),
);

/** Replace {{var}} placeholders with active environment values. */
export function interpolateEnv(input: string, vars: EnvVariable[]): string {
  return input.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_, k) => {
    const v = vars.find((x) => x.key === k);
    return v ? v.value : `{{${k}}}`;
  });
}

/** Returns array of variable references found in a string. */
export function extractVarRefs(input: string): string[] {
  const out: string[] = [];
  const re = /\{\{\s*([\w-]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(input))) out.push(m[1]);
  return out;
}
