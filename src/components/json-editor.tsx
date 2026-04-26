import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter, lintGutter } from "@codemirror/lint";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { AlertTriangle, CheckCircle2, Wand2 } from "lucide-react";

export function JsonEditor({
  value,
  onChange,
  height = "400px",
}: {
  value: string;
  onChange: (next: string) => void;
  height?: string;
}) {
  const extensions = useMemo(
    () => [
      json(),
      linter(jsonParseLinter()),
      lintGutter(),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { fontSize: "12px", backgroundColor: "transparent" },
        ".cm-gutters": { backgroundColor: "transparent", border: "none" },
        ".cm-content": { fontFamily: "var(--font-mono, ui-monospace, monospace)" },
      }),
    ],
    [],
  );

  const validation = useMemo(() => {
    if (!value.trim()) return { ok: true as const, message: "Empty body" };
    try {
      JSON.parse(value);
      return { ok: true as const, message: "Valid JSON" };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [value]);

  const format = () => {
    try {
      onChange(JSON.stringify(JSON.parse(value), null, 2));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">JSON</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={format}
            disabled={!validation.ok || !value.trim()}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
            title="Format JSON"
          >
            <Wand2 className="h-3 w-3" /> Format
          </button>
          <div
            className={
              "inline-flex items-center gap-1 text-[11px] font-mono " +
              (validation.ok ? "text-success" : "text-destructive")
            }
          >
            {validation.ok ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            <span className="truncate max-w-[260px]">{validation.message}</span>
          </div>
        </div>
      </div>
      <div className="rounded-md border border-border bg-input overflow-hidden">
        <CodeMirror
          value={value}
          height={height}
          theme={oneDark}
          extensions={extensions}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            autocompletion: true,
            bracketMatching: true,
            closeBrackets: true,
          }}
        />
      </div>
    </div>
  );
}
