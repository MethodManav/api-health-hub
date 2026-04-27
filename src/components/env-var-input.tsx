import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn } from "@/lib/utils";
import { Variable } from "lucide-react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  value: string;
  onChange: (next: string) => void;
  /** When true, only suggest variables defined in the active environment. */
  activeOnly?: boolean;
};

const ACTIVE_ONLY_KEY = "envvar.activeOnly";

/**
 * Input that shows Postman-style env-var suggestions when the user types `{{`.
 * By default, suggestions are pulled from all environments in the workspace
 * (Postman behavior). A toggle in the popup (persisted in localStorage) lets
 * users restrict suggestions to the active environment only. Selecting one
 * inserts `{{key}}`.
 */
export function EnvVarInput({ value, onChange, className, activeOnly: activeOnlyProp, ...rest }: Props) {
  const environments = useWorkspaceStore((s) => s.environments);
  const activeEnvId = useWorkspaceStore((s) => s.activeEnvironmentId);

  const [activeOnlyState, setActiveOnlyState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ACTIVE_ONLY_KEY) === "1";
  });
  const activeOnly = activeOnlyProp ?? activeOnlyState;

  const setActiveOnly = (v: boolean) => {
    setActiveOnlyState(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_ONLY_KEY, v ? "1" : "0");
    }
  };

  const allVars = useMemo(() => {
    const map = new Map<string, { key: string; value: string; envName: string; isActive: boolean }>();
    const sources = activeOnly
      ? environments.filter((e) => e.id === activeEnvId)
      : environments;
    for (const env of sources) {
      for (const v of env.variables) {
        if (!v.key) continue;
        // Prefer active env entry on duplicates
        if (!map.has(v.key) || env.id === activeEnvId) {
          map.set(v.key, {
            key: v.key,
            value: v.secret ? "••••••" : v.value,
            envName: env.name,
            isActive: env.id === activeEnvId,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.isActive === b.isActive ? a.key.localeCompare(b.key) : a.isActive ? -1 : 1,
    );
  }, [environments, activeEnvId, activeOnly]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [query, setQuery] = useState("");
  const [tokenStart, setTokenStart] = useState<number | null>(null);

  // Detect if caret is currently inside an unclosed `{{...` token.
  const detectToken = (val: string, caret: number) => {
    const before = val.slice(0, caret);
    const open = before.lastIndexOf("{{");
    if (open === -1) return null;
    // Make sure no closing `}}` between open and caret
    const afterOpen = before.slice(open + 2);
    if (afterOpen.includes("}}")) return null;
    // Token chars only (\w-)
    if (!/^[\w-]*$/.test(afterOpen)) return null;
    return { start: open, query: afterOpen };
  };

  const refresh = () => {
    const el = inputRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const tok = detectToken(value, caret);
    if (tok) {
      setOpen(true);
      setQuery(tok.query);
      setTokenStart(tok.start);
      setHighlight(0);
    } else {
      setOpen(false);
      setTokenStart(null);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return allVars.filter((v) => v.key.toLowerCase().includes(q)).slice(0, 8);
  }, [allVars, query]);

  const insert = (key: string) => {
    const el = inputRef.current;
    if (!el || tokenStart === null) return;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, tokenStart);
    const after = value.slice(caret);
    const insertion = `{{${key}}}`;
    const next = before + insertion + after;
    onChange(next);
    setOpen(false);
    requestAnimationFrame(() => {
      const pos = (before + insertion).length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insert(filtered[highlight].key);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onKeyUp={refresh}
        onClick={refresh}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className={className}
        {...rest}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border flex items-center gap-1">
            <Variable className="h-3 w-3" /> Environment variables
          </div>
          {filtered.map((v, i) => (
            <button
              key={v.key}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insert(v.key);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "w-full text-left px-2 py-1.5 text-xs font-mono flex items-center justify-between gap-3",
                i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              )}
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-primary">{`{{${v.key}}}`}</span>
                {!v.isActive && (
                  <span className="text-[9px] uppercase text-muted-foreground">{v.envName}</span>
                )}
              </span>
              <span className="text-muted-foreground truncate max-w-[50%]">{v.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
