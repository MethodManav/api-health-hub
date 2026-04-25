import { cn } from "@/lib/utils";

const colors = {
  healthy: "bg-success",
  degraded: "bg-warning",
  down: "bg-destructive",
};

export function StatusDot({ status, className }: { status: "healthy" | "degraded" | "down"; className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)}>
      <span className={cn("absolute inset-0 rounded-full opacity-60 animate-pulse-dot", colors[status])} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", colors[status])} />
    </span>
  );
}
