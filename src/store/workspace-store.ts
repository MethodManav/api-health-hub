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

/** All data that is scoped to a single workspace. */
export type HistoryFilter = { status: string; codeQuery: string };

export type WorkspaceData = {
  folders: Folder[];
  apis: ApiEndpoint[];
  environments: Environment[];
  activeEnvironmentId: string | null;
  /** Per-API saved History tab filters. */
  historyFilters: Record<string, HistoryFilter>;
};

type WorkspaceState = {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  /** Per-workspace data, keyed by workspace id. */
  data: Record<string, WorkspaceData>;

  setWorkspace: (id: string) => void;
  addWorkspace: (name: string, color?: string) => void;

  // Computed views over the active workspace (read-only convenience accessors).
  // These are kept in sync via selectors below.
  folders: Folder[];
  apis: ApiEndpoint[];
  environments: Environment[];
  activeEnvironmentId: string | null;

  addFolder: (name: string, parentId?: string | null) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;

  addApi: (input: { name: string; method: HttpMethod; endpoint: string; folderId: string | null }) => ApiEndpoint;
  updateApi: (id: string, patch: Partial<ApiEndpoint>) => void;
  deleteApi: (id: string) => void;
  recordRun: (apiId: string, entry: Omit<RunHistoryEntry, "id" | "timestamp">) => void;
  clearHistory: (apiId: string) => void;
  setHistoryFilter: (apiId: string, filter: HistoryFilter) => void;

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

const buildDefaultEnvironments = (): Environment[] => [
  {
    id: `env-prod-${Math.random().toString(36).slice(2, 7)}`,
    name: "Production",
    color: "oklch(0.82 0.18 175)",
    variables: [
      { key: "baseUrl", value: "https://jsonplaceholder.typicode.com" },
      { key: "apiVersion", value: "v1" },
      { key: "token", value: "prod-xyz-secret", secret: true },
    ],
  },
  {
    id: `env-dev-${Math.random().toString(36).slice(2, 7)}`,
    name: "Development",
    color: "oklch(0.78 0.16 75)",
    variables: [
      { key: "baseUrl", value: "https://jsonplaceholder.typicode.com" },
      { key: "apiVersion", value: "v1" },
      { key: "token", value: "dev-abc-token", secret: true },
    ],
  },
];

const emptyWorkspaceData = (): WorkspaceData => {
  const envs = buildDefaultEnvironments();
  return {
    folders: [],
    apis: [],
    environments: envs,
    activeEnvironmentId: envs[0]?.id ?? null,
    historyFilters: {},
  };
};

const buildInitialData = (): Record<string, WorkspaceData> => {
  const data: Record<string, WorkspaceData> = {};
  for (const ws of initialWorkspaces) data[ws.id] = emptyWorkspaceData();
  // Seed the first workspace with the demo folders/apis so the app isn't empty.
  const first = initialWorkspaces[0];
  data[first.id] = {
    ...data[first.id],
    folders: initialFolders,
    apis: initialApis,
  };
  return data;
};

/** Helper: produce next state with a patched workspace data slice. */
const patchWorkspace = (
  state: { data: Record<string, WorkspaceData>; currentWorkspaceId: string },
  fn: (d: WorkspaceData) => WorkspaceData,
) => {
  const wsId = state.currentWorkspaceId;
  const current = state.data[wsId] ?? emptyWorkspaceData();
  const next = fn(current);
  return { data: { ...state.data, [wsId]: next } };
};

/** Project the active workspace data onto top-level convenience fields. */
const project = (data: Record<string, WorkspaceData>, wsId: string) => {
  const d = data[wsId] ?? emptyWorkspaceData();
  return {
    folders: d.folders,
    apis: d.apis,
    environments: d.environments,
    activeEnvironmentId: d.activeEnvironmentId,
  };
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => {
      const initialData = buildInitialData();
      const initialWsId = initialWorkspaces[0].id;
      return {
        workspaces: initialWorkspaces,
        currentWorkspaceId: initialWsId,
        data: initialData,
        ...project(initialData, initialWsId),

        setWorkspace: (id) => {
          const data = get().data;
          if (!data[id]) data[id] = emptyWorkspaceData();
          set({ currentWorkspaceId: id, data: { ...data }, ...project(data, id) });
        },
        addWorkspace: (name, color) => {
          const id = `ws-${Date.now()}`;
          const ws = { id, name, color: color ?? palette[get().workspaces.length % palette.length] };
          const data = { ...get().data, [id]: emptyWorkspaceData() };
          set({
            workspaces: [...get().workspaces, ws],
            currentWorkspaceId: id,
            data,
            ...project(data, id),
          });
        },

        addFolder: (name, parentId = null) => {
          const folder: Folder = { id: `f-${Date.now()}`, name, parentId };
          const next = patchWorkspace(get(), (d) => ({ ...d, folders: [...d.folders, folder] }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
          return folder;
        },
        renameFolder: (id, name) => {
          const next = patchWorkspace(get(), (d) => ({
            ...d,
            folders: d.folders.map((f) => (f.id === id ? { ...f, name } : f)),
          }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
        },
        deleteFolder: (id) => {
          const next = patchWorkspace(get(), (d) => ({
            ...d,
            folders: d.folders.filter((f) => f.id !== id),
            apis: d.apis.map((a) => (a.folderId === id ? { ...a, folderId: null } : a)),
          }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
        },

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
          const next = patchWorkspace(get(), (d) => ({ ...d, apis: [...d.apis, api] }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
          return api;
        },
        updateApi: (id, patch) => {
          const next = patchWorkspace(get(), (d) => ({
            ...d,
            apis: d.apis.map((a) => (a.id === id ? { ...a, ...patch } : a)),
          }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
        },
        deleteApi: (id) => {
          const next = patchWorkspace(get(), (d) => ({ ...d, apis: d.apis.filter((a) => a.id !== id) }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
        },
        recordRun: (apiId, entry) => {
          const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const newEntry: RunHistoryEntry = { ...entry, id, timestamp: Date.now() };
          const next = patchWorkspace(get(), (d) => ({
            ...d,
            apis: d.apis.map((a) =>
              a.id === apiId
                ? { ...a, history: [newEntry, ...(a.history ?? [])].slice(0, MAX_HISTORY) }
                : a,
            ),
          }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
        },
        clearHistory: (apiId) => {
          const next = patchWorkspace(get(), (d) => ({
            ...d,
            apis: d.apis.map((a) => (a.id === apiId ? { ...a, history: [] } : a)),
          }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
        },
        setHistoryFilter: (apiId, filter) => {
          const next = patchWorkspace(get(), (d) => ({
            ...d,
            historyFilters: { ...(d.historyFilters ?? {}), [apiId]: filter },
          }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
        },

        setActiveEnvironment: (id) => {
          const next = patchWorkspace(get(), (d) => ({ ...d, activeEnvironmentId: id }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
        },
        addEnvironment: (name) => {
          const env: Environment = {
            id: `env-${Date.now()}`,
            name,
            color: palette[(get().environments.length) % palette.length],
            variables: [{ key: "baseUrl", value: "https://api.example.com" }],
          };
          const next = patchWorkspace(get(), (d) => ({
            ...d,
            environments: [...d.environments, env],
            activeEnvironmentId: env.id,
          }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
          return env;
        },
        renameEnvironment: (id, name) => {
          const next = patchWorkspace(get(), (d) => ({
            ...d,
            environments: d.environments.map((e) => (e.id === id ? { ...e, name } : e)),
          }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
        },
        deleteEnvironment: (id) => {
          const next = patchWorkspace(get(), (d) => ({
            ...d,
            environments: d.environments.filter((e) => e.id !== id),
            activeEnvironmentId: d.activeEnvironmentId === id ? null : d.activeEnvironmentId,
          }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
        },
        setEnvironmentVariables: (id, vars) => {
          const next = patchWorkspace(get(), (d) => ({
            ...d,
            environments: d.environments.map((e) => (e.id === id ? { ...e, variables: vars } : e)),
          }));
          set({ ...next, ...project(next.data, get().currentWorkspaceId) });
        },

        user: { name: "Alex Chen", email: "alex@devpulse.io" },
        setUser: (user) => set({ user }),
      };
    },
    {
      name: "devpulse-workspace",
      version: 5,
      // Persist only canonical state; rehydrate projections in onRehydrateStorage.
      partialize: (s) =>
        ({
          workspaces: s.workspaces,
          currentWorkspaceId: s.currentWorkspaceId,
          data: s.data,
        }) as unknown as WorkspaceState,
      // Migrate older versions where folders/apis/environments lived at the top level.
      migrate: (persisted: any, version) => {
        if (!persisted) return persisted;
        if (version < 5) {
          const wsId = persisted.currentWorkspaceId ?? initialWorkspaces[0].id;
          const data: Record<string, WorkspaceData> = {};
          for (const ws of (persisted.workspaces ?? initialWorkspaces) as Workspace[]) {
            data[ws.id] = emptyWorkspaceData();
          }
          data[wsId] = {
            folders: persisted.folders ?? [],
            apis: persisted.apis ?? [],
            environments: persisted.environments ?? buildDefaultEnvironments(),
            activeEnvironmentId:
              persisted.activeEnvironmentId ??
              (persisted.environments?.[0]?.id ?? null),
            historyFilters: {},
          };
          return {
            workspaces: persisted.workspaces ?? initialWorkspaces,
            currentWorkspaceId: wsId,
            data,
          };
        }
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Re-project active workspace into top-level convenience fields after rehydrate.
        const proj = project(state.data, state.currentWorkspaceId);
        Object.assign(state, proj);
      },
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
