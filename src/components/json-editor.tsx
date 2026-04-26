import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { AlertTriangle, CheckCircle2, Wand2 } from "lucide-react";
import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

type SchemaValidation =
  | { ok: true; message: string }
  | { ok: false; message: string; errors?: ErrorObject[] };

function formatAjvError(e: ErrorObject): string {
  const path = e.instancePath || "(root)";
  return `${path} ${e.message ?? ""}`.trim();
}

export function JsonEditor({
  value,
  onChange,
  schema,
  height = "360px",
}: {
  value: string;
  onChange: (next: string) => void;
  schema?: string; // optional JSON Schema text
  height?: string;
}) {
  // Compile schema (if any & valid)
  const compiledSchema = useMemo(() => {
    if (!schema || !schema.trim()) return { validate: null as null, error: null as string | null };
    try {
      const parsed = JSON.parse(schema);
      const validate = ajv.compile(parsed);
      return { validate, error: null };
    } catch (e) {
      return { validate: null, error: e instanceof Error ? e.message : "Invalid schema" };
    }
  }, [schema]);

  const extensions = useMemo(() => {
    const schemaLinter = linter((view): Diagnostic[] => {
      const text = view.state.doc.toString();
      if (!text.trim()) return [];
      if (!compiledSchema.validate) return [];
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return []; // parse linter handles syntax
      }
      const valid = compiledSchema.validate(parsed);
      if (valid) return [];
      const errs = compiledSchema.validate.errors ?? [];
      // Show all errors at top of doc; instancePath helps user locate field
      return errs.map<Diagnostic>((e) => ({
        from: 0,
        to: Math.min(text.length, 1),
        severity: "error",
        message: formatAjvError(e),
        source: "schema",
      }));
    });

    return [
      json(),
      linter(jsonParseLinter()),
      schemaLinter,
      lintGutter(),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { fontSize: "12px", backgroundColor: "transparent" },
        ".cm-gutters": { backgroundColor: "transparent", border: "none" },
        ".cm-content": { fontFamily: "var(--font-mono, ui-monospace, monospace)" },
      }),
    ];
  }, [compiledSchema]);

  const validation = useMemo<SchemaValidation>(() => {
    if (!value.trim()) return { ok: true, message: "Empty body" };
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Invalid JSON" };
    }
    if (!compiledSchema.validate) {
      return { ok: true, message: compiledSchema.error ? "Schema invalid — JSON OK" : "Valid JSON" };
    }
    const valid = compiledSchema.validate(parsed);
    if (valid) return { ok: true, message: "Valid against schema" };
    return {
      ok: false,
      message: `${compiledSchema.validate.errors?.length ?? 0} schema error(s)`,
      errors: compiledSchema.validate.errors ?? [],
    };
  }, [value, compiledSchema]);

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
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          JSON {schema?.trim() ? "· schema-validated" : ""}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={format}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
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
            {validation.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
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

      {compiledSchema.error && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] font-mono text-warning flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Schema is not valid JSON: {compiledSchema.error}</span>
        </div>
      )}

      {!validation.ok && "errors" in validation && validation.errors && validation.errors.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" /> Schema errors
          </div>
          <ul className="text-[11px] font-mono text-destructive/90 space-y-0.5">
            {validation.errors.slice(0, 12).map((e, i) => (
              <li key={i}>
                <span className="text-destructive">{e.instancePath || "(root)"}</span>{" "}
                <span className="text-destructive/70">{e.message}</span>
              </li>
            ))}
            {validation.errors.length > 12 && (
              <li className="text-destructive/60">…and {validation.errors.length - 12} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
