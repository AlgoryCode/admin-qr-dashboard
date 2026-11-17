"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadExport, type ExportKind } from "@/lib/api/finance";
import { Button } from "@/components/ui/button";

/** One-click CSV download (Excel-ready, semicolon separated). */
export function ExportButton({
  kind,
  label = "CSV indir",
  from,
  to,
}: {
  kind: ExportKind;
  label?: string;
  from?: string;
  to?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await downloadExport(kind, { from, to });
          } catch (err) {
            setError(err instanceof Error ? err.message : "İndirilemedi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Download className="size-3.5" />
        )}
        {label}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </span>
  );
}
