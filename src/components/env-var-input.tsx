import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn } from "@/lib/utils";
import { Variable, Eye, EyeOff, Check as CheckIcon } from "lucide-react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  value: string;
  onChange: (next: string) => void;
  /** When provided, controls the "active env only" mode externally (e.g. persisted per API). */
  activeOnly?: boolean;
  /** Called when the user toggles the in-popup "active env only" checkbox. */
  onActiveOnlyChange?: (next: boolean) => void;
};

const ACTIVE_ONLY_KEY = "envvar.activeOnly";

/**
 * Input that shows Postman-style env-var suggestions when the user types `{{`.
 * By default, suggestions are pulled from all environments in the workspace
 * (Postman behavior). A toggle in the popup lets users restrict suggestions
 * to the active environment only — controlled externally when `activeOnly`
 * is provided, otherwise persisted in localStorage as a global default.
 * Selecting an entry inserts `{{key}}`.
 */
export function EnvVarInput({
  value,
  onChange,
  className,
  activeOnly: activeOnlyProp,
  onActiveOnlyChange,
  ...rest
}: Props) {
  const environments = useWorkspaceStore((s) => s.environments);
  const activeEnvId = useWorkspaceStore((s) => s.activeEnvironmentId);
  const setEnvironmentVariables = useWorkspaceStore((s) => s.setEnvironmentVariables);

  const [activeOnlyState, setActiveOnlyState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ACTIVE_ONLY_KEY) === "1";
  });
  const activeOnly = activeOnlyProp ?? activeOnlyState;

  const setActiveOnly = (v: boolean) => {
    if (onActiveOnlyChange) onActiveOnlyChange(v);
    if (activeOnlyProp === undefined) {
      setActiveOnlyState(v);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ACTIVE_ONLY_KEY, v ? "1" : "0");
      }
    }
  };

  const allVars = useMemo(() => {
    const map = new Map<
      string,
      { key: string; value: string; rawValue: string; envId: string; envName: string; isActive: boolean; secret: boolean }
    >();
    const sources = activeOnly
      ? environments.filter((e) => e.id === activeEnvId)
      : environments;
    for (const env of sources) {
      for (const v of env.variables) {
        if (!v.key) continue;
        if (!map.has(v.key) || env.id === activeEnvId) {
          map.set(v.key, {
            key: v.key,
            value: v.secret ? "••••••" : v.value,
            rawValue: v.value,
            envId: env.id,
            envName: env.name,
            isActive: env.id === activeEnvId,
            secret: !!v.secret,
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
  /** When the caret is inside a closed `{{key}}` token, switch to edit mode. */
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<string>("");
  const [revealSecret, setRevealSecret] = useState(false);

  // Detect either an open suggestion token (`{{par|`) or a closed reference
  // token (`{{key|}}` or `{{|key}}`) the caret is currently inside.
  const detectToken = (
    val: string,
    caret: number,
  ):
    | { mode: "suggest"; start: number; query: string }
    | { mode: "edit"; start: number; end: number; key: string }
    | null => {
    // 1) Closed token containing caret? Scan all `{{...}}` matches.
    const re = /\{\{\s*([\w-]+)\s*\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(val))) {
      const start = m.index;
      const end = m.index + m[0].length;
      if (caret >= start && caret <= end) {
        return { mode: "edit", start, end, key: m[1] };
      }
    }
    // 2) Otherwise, an unclosed `{{...` before the caret → suggestion mode.
    const before = val.slice(0, caret);
    const open = before.lastIndexOf("{{");
    if (open === -1) return null;
    const afterOpen = before.slice(open + 2);
    if (afterOpen.includes("}}")) return null;
    if (!/^[\w-]*$/.test(afterOpen)) return null;
    return { mode: "suggest", start: open, query: afterOpen };
  };

  const refresh = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof document !== "undefined" && document.activeElement !== el) {
      setOpen(false);
      return;
    }
    const caret = el.selectionStart ?? value.length;
    const tok = detectToken(value, caret);
    if (!tok) {
      setOpen(false);
      setTokenStart(null);
      setEditKey(null);
      return;
    }
    if (tok.mode === "suggest") {
      setOpen(true);
      setQuery(tok.query);
      setTokenStart(tok.start);
      setHighlight(0);
      setEditKey(null);
    } else {
      const found = allVars.find((v) => v.key === tok.key);
      setOpen(true);
      setEditKey(tok.key);
      setEditDraft(found?.rawValue ?? "");
      setRevealSecret(false);
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

  const editVar = editKey ? allVars.find((v) => v.key === editKey) : null;

  const saveEdit = () => {
    if (!editVar) return;
    const env = environments.find((e) => e.id === editVar.envId);
    if (!env) return;
    const nextVars = env.variables.map((v) =>
      v.key === editVar.key ? { ...v, value: editDraft } : v,
    );
    setEnvironmentVariables(env.id, nextVars);
    setOpen(false);
    setEditKey(null);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setEditKey(null);
      return;
    }
    // In edit mode the popup is informational; let normal typing continue.
    if (editKey) return;
    if (filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insert(filtered[highlight].key);
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
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border flex items-center justify-between gap-2">
            <span className="flex items-center gap-1">
              <Variable className="h-3 w-3" /> Env vars
              {activeOnly && <span className="text-primary normal-case">· active only</span>}
            </span>
            <label
              className="flex items-center gap-1 normal-case tracking-normal cursor-pointer hover:text-foreground"
              onMouseDown={(e) => e.preventDefault()}
            >
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="h-3 w-3 accent-primary cursor-pointer"
              />
              Active env only
            </label>
          </div>
          {filtered.length === 0 && (
            <div className="px-2 py-3 text-[11px] font-mono text-muted-foreground text-center">
              {activeOnly
                ? "No matching variables in the active environment."
                : "No matching variables."}
            </div>
          )}
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
