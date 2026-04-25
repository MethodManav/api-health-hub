import type { HttpMethod } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const styles: Record<HttpMethod, string> = {
  GET: "text-method-get bg-method-get/10",
  POST: "text-method-post bg-method-post/10",
  PUT: "text-method-put bg-method-put/10",
  DELETE: "text-method-delete bg-method-delete/10",
  PATCH: "text-method-patch bg-method-patch/10",
};

export function MethodBadge({ method, className }: { method: HttpMethod; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide min-w-[44px]",
        styles[method],
        className,
      )}
    >
      {method}
    </span>
  );
}
