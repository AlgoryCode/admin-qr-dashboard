"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Mail, Send } from "lucide-react";
import {
  listTicketMessages,
  postTicketMessage,
  type TicketMessage,
} from "@/lib/api/platform-feedback";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function when(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Replies (e-mailed to the member) and internal notes on one ticket. */
export function TicketThread({
  ticketId,
  editable,
  onReplied,
}: {
  ticketId: number;
  editable: boolean;
  onReplied: () => void;
}) {
  const [messages, setMessages] = useState<{
    for: number;
    items: TicketMessage[];
  } | null>(null);
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listTicketMessages(ticketId)
      .then((items) => {
        if (!cancelled) setMessages({ for: ticketId, items });
      })
      .catch(() => {
        if (!cancelled) setMessages({ for: ticketId, items: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const items = messages?.for === ticketId ? messages.items : null;

  async function send() {
    setSending(true);
    setError(null);
    try {
      const saved = await postTicketMessage(ticketId, text.trim(), internal);
      setMessages({ for: ticketId, items: [...(items ?? []), saved] });
      setText("");
      if (!internal) onReplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Yazışma
      </p>
      {items == null ? null : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz yanıt yok.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => (
            <li
              key={m.id}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                m.internal
                  ? "border-dashed border-amber-500/40 bg-amber-500/5"
                  : "border-border/60 bg-muted/20",
              )}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {m.authorName ?? "—"}
                </span>
                <span>{when(m.createdAt)}</span>
                {m.internal ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                    <Lock className="size-3" /> İç not
                  </span>
                ) : m.emailed ? (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="size-3" /> E-postayla gönderildi
                  </span>
                ) : (
                  <span className="text-destructive">
                    E-posta gönderilemedi
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
      {editable ? (
        <div className="space-y-2">
          <Textarea
            rows={3}
            maxLength={8000}
            value={text}
            placeholder={
              internal
                ? "Sadece yöneticilerin göreceği not…"
                : "Üyeye yanıt (e-postayla gider)…"
            }
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={internal} onCheckedChange={setInternal} />
              İç not (üyeye gitmez)
            </label>
            <Button size="sm" disabled={sending || !text.trim()} onClick={send}>
              {sending ? <Loader2 className="animate-spin" /> : <Send />}
              {internal ? "Not ekle" : "Yanıtla"}
            </Button>
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
