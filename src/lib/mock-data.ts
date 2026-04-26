export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type KeyValueRow = { id: string; key: string; value: string };

export type RunHistoryEntry = {
  id: string;
  timestamp: number;
  method: HttpMethod;
  url: string;
  status: number; // 0 = network error
  statusText: string;
  time: number; // ms
  size: number; // bytes
  ok: boolean;
  error?: string;
};

export type ApiEndpoint = {
  id: string;
  name: string;
  endpoint: string;
  method: HttpMethod;
  folderId: string | null;
  status: "healthy" | "degraded" | "down";
  latency: number;
  uptime: number;
  params?: KeyValueRow[];
  headers?: KeyValueRow[];
  body?: string;
  bodySchema?: string; // JSON Schema text
  history?: RunHistoryEntry[];
};

export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
};

export type Workspace = {
  id: string;
  name: string;
  color: string;
};

export const workspaces: Workspace[] = [
  { id: "ws-1", name: "Production", color: "oklch(0.82 0.18 175)" },
  { id: "ws-2", name: "Staging", color: "oklch(0.78 0.16 75)" },
  { id: "ws-3", name: "Personal", color: "oklch(0.7 0.18 300)" },
];

export const folders: Folder[] = [
  { id: "f-1", name: "Auth APIs", parentId: null },
  { id: "f-2", name: "User APIs", parentId: null },
  { id: "f-3", name: "Billing APIs", parentId: null },
];

export const apis: ApiEndpoint[] = [
  { id: "a-1", name: "Login", endpoint: "https://api.devpulse.io/auth/login", method: "POST", folderId: "f-1", status: "healthy", latency: 124, uptime: 99.98 },
  { id: "a-2", name: "Signup", endpoint: "https://api.devpulse.io/auth/signup", method: "POST", folderId: "f-1", status: "healthy", latency: 187, uptime: 99.95 },
  { id: "a-3", name: "Refresh Token", endpoint: "https://api.devpulse.io/auth/refresh", method: "POST", folderId: "f-1", status: "healthy", latency: 67, uptime: 100 },
  { id: "a-4", name: "Get Profile", endpoint: "https://api.devpulse.io/users/me", method: "GET", folderId: "f-2", status: "healthy", latency: 89, uptime: 99.99 },
  { id: "a-5", name: "Update Profile", endpoint: "https://api.devpulse.io/users/me", method: "PUT", folderId: "f-2", status: "degraded", latency: 412, uptime: 98.21 },
  { id: "a-6", name: "Delete Account", endpoint: "https://api.devpulse.io/users/me", method: "DELETE", folderId: "f-2", status: "healthy", latency: 156, uptime: 99.87 },
  { id: "a-7", name: "Create Subscription", endpoint: "https://api.devpulse.io/billing/subscribe", method: "POST", folderId: "f-3", status: "down", latency: 0, uptime: 87.42 },
  { id: "a-8", name: "List Invoices", endpoint: "https://api.devpulse.io/billing/invoices", method: "GET", folderId: "f-3", status: "healthy", latency: 203, uptime: 99.76 },
];

export const latencyHistory = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  latency: 80 + Math.round(Math.sin(i / 3) * 40 + Math.random() * 60),
  errors: Math.max(0, Math.round(Math.sin(i / 4) * 3 + Math.random() * 4)),
}));

export const incidents = [
  { id: "i-1", api: "Create Subscription", severity: "critical" as const, message: "503 Service Unavailable", time: "2 min ago" },
  { id: "i-2", api: "Update Profile", severity: "warning" as const, message: "Latency spike: 412ms (avg 180ms)", time: "14 min ago" },
  { id: "i-3", api: "List Invoices", severity: "info" as const, message: "Recovered after 3m downtime", time: "1 hour ago" },
];
