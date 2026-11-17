"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import {
  listReminders,
  REMINDER_KIND_LABEL,
  sendReminder,
  type ReminderRow,
} from "@/lib/api/finance";
import { Button } from "@/components/ui/button";

function when(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Payment reminder e-mails for one member: send one now, see what went out. */
export function ReminderBlock({
  merchantId,
  canSend,
  onSent,
}: {
  merchantId: number;
  canSend: boolean;
  onSent?: () => void;
}) {
  const [rows, setRows] = useState<{
    for: number;
    items: ReminderRow[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    listReminders(merchantId)
      .then((items) => {
        if (!cancelled) setRows({ for: merchantId, items });
      })
      .catch(() => {
        if (!cancelled) setRows({ for: merchantId, items: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [merchantId]);

  const items = rows?.for === merchantId ? rows.items : null;

  async function send() {
    setBusy(true);
    setMessage(null);
    try {
      const sent = await sendReminder(merchantId);
      setRows({ for: merchantId, items: [sent, ...(items ?? [])] });
      setMessage({
        ok: true,
        text: `Hatırlatma ${sent.email} adresine gönderildi.`,
      });
      onSent?.();
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : "Gönderilemedi.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">Ödeme hatırlatmaları</div>
          <div className="text-xs text-muted-foreground">
            Otomatik: vadeye 7 ve 1 gün kala, gecikmenin 7. gününde.
          </div>
        </div>
        {canSend ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={send}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Mail className="size-3.5" />
            )}
            Hatırlatma gönder
          </Button>
        ) : null}
      </div>
      {message ? (
        <p
          className={
            message.ok
              ? "text-xs text-emerald-700 dark:text-emerald-300"
              : "text-xs text-destructive"
          }
        >
          {message.text}
        </p>
      ) : null}
      {items == null ? null : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Henüz hatırlatma gönderilmedi.
        </p>
      ) : (
        <ul className="space-y-1 text-xs">
          {items.slice(0, 5).map((r) => (
            <li key={r.id} className="flex justify-between gap-2">
              <span>
                {REMINDER_KIND_LABEL[r.kind]}
                {r.sentBy !== "system" ? ` · ${r.sentBy}` : ""}
              </span>
              <span className="text-muted-foreground">{when(r.sentAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
