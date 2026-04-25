import { create } from "zustand";
import { workspaces, type Workspace } from "@/lib/mock-data";

type WorkspaceState = {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  setWorkspace: (id: string) => void;
  user: { name: string; email: string } | null;
  setUser: (u: { name: string; email: string } | null) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces,
  currentWorkspaceId: workspaces[0].id,
  setWorkspace: (id) => set({ currentWorkspaceId: id }),
  user: { name: "Alex Chen", email: "alex@devpulse.io" },
  setUser: (user) => set({ user }),
}));
