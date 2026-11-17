"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import {
  listTemplates,
  previewTemplate,
  resetTemplate,
  saveTemplate,
  type EmailTemplate,
} from "@/lib/api/content";
import { useAuth } from "@/context/auth-context";
import { canWrite } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function EmailTemplatesPanel() {
  const [rows, setRows] = useState<EmailTemplate[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listTemplates()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Şablonlar alınamadı.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }
  if (!rows) return <Skeleton className="h-64 w-full" />;
  const current = rows.find((r) => r.key === selected) ?? rows[0];

  return (
    <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
      <div className="flex gap-1 overflow-x-auto md:flex-col">
        {rows.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSelected(t.key)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-left text-sm",
              t.key === current?.key
                ? "bg-muted font-medium"
                : "text-muted-foreground hover:bg-muted/50",
            )}
          >
            <div>{t.name}</div>
            <div className="text-xs font-normal text-muted-foreground">
              {!t.enabled
                ? "Kapalı"
                : t.customized
                  ? "Düzenlendi"
                  : "Varsayılan"}
            </div>
          </button>
        ))}
      </div>
      {current ? (
        <TemplateEditor
          key={current.key + (current.updatedAt ?? "")}
          template={current}
          onSaved={(saved) =>
            setRows(
              (list) =>
                list?.map((r) => (r.key === saved.key ? saved : r)) ?? null,
            )
          }
        />
      ) : null}
    </div>
  );
}

function TemplateEditor({
  template,
  onSaved,
}: {
  template: EmailTemplate;
  onSaved: (t: EmailTemplate) => void;
}) {
  const { user } = useAuth();
  const editable = canWrite(user?.adminRole, "content");
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [enabled, setEnabled] = useState(template.enabled);
  const [preview, setPreview] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [busy, setBusy] = useState<"save" | "reset" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    subject !== template.subject ||
    body !== template.body ||
    enabled !== template.enabled;

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      previewTemplate(template.key, { subject, body, enabled })
        .then((p) => {
          if (!cancelled) setPreview(p);
        })
        .catch(() => undefined);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [template.key, subject, body, enabled]);

  async function run(kind: "save" | "reset") {
    setBusy(kind);
    setError(null);
    try {
      onSaved(
        kind === "save"
          ? await saveTemplate(template.key, { subject, body, enabled })
          : await resetTemplate(template.key),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{template.name}</h3>
          {template.customized ? (
            <Badge variant="outline">Düzenlendi</Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{template.description}</p>
      </div>
      <div className="flex flex-wrap gap-1 text-xs">
        <span className="text-muted-foreground">Kullanılabilir alanlar:</span>
        {template.variables.map((v) => (
          <button
            key={v}
            type="button"
            disabled={!editable}
            className="rounded bg-muted px-1.5 py-0.5 font-mono hover:bg-muted/70"
            title="Metnin sonuna ekle"
            onClick={() => setBody((b) => `${b}{{${v}}}`)}
          >
            {`{{${v}}}`}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-subject">Konu</Label>
            <Input
              id="tpl-subject"
              disabled={!editable}
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-body">Metin</Label>
            <Textarea
              id="tpl-body"
              disabled={!editable}
              rows={12}
              className="font-mono text-xs"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={enabled}
              disabled={!editable}
              onCheckedChange={setEnabled}
            />
            Bu e-posta gönderilsin
          </label>
        </div>
        <div className="space-y-1.5">
          <Label>Önizleme (örnek verilerle)</Label>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
            <div className="border-b border-border/60 pb-2 font-medium">
              {preview?.subject ?? "…"}
            </div>
            <p className="pt-2 whitespace-pre-line text-muted-foreground">
              {preview?.body ?? ""}
            </p>
          </div>
        </div>
      </div>
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {editable ? (
        <div className="flex gap-2">
          <Button disabled={!dirty || busy != null} onClick={() => run("save")}>
            {busy === "save" ? <Loader2 className="animate-spin" /> : null}
            Kaydet
          </Button>
          {template.customized ? (
            <Button
              variant="outline"
              disabled={busy != null}
              onClick={() => run("reset")}
            >
              {busy === "reset" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RotateCcw />
              )}
              Varsayılana dön
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
