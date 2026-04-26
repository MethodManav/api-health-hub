import type { HttpMethod, KeyValueRow } from "./mock-data";

const shellEscape = (s: string) => `'${s.replace(/'/g, "'\\''")}'`;

export function buildCurl({
  method,
  url,
  headers,
  body,
}: {
  method: HttpMethod;
  url: string;
  headers: KeyValueRow[];
  body: string;
}): string {
  const parts: string[] = [`curl -X ${method}`];
  parts.push(shellEscape(url));
  for (const h of headers) {
    if (!h.key.trim()) continue;
    parts.push(`-H ${shellEscape(`${h.key}: ${h.value}`)}`);
  }
  const hasBody = method !== "GET" && method !== "DELETE" && body.trim().length > 0;
  if (hasBody) {
    parts.push(`--data ${shellEscape(body)}`);
  }
  return parts.join(" \\\n  ");
}
