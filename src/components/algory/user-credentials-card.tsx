"use client";

import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import {
  resetUserPassword,
  sendUserEmailVerification,
} from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import type { UserDetailResponse } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserCredentialsCardProps = {
  user: UserDetailResponse;
  onUserUpdated: (user: UserDetailResponse) => void;
};

export function UserCredentialsCard({ user, onUserUpdated }: UserCredentialsCardProps) {
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [passwordEmailed, setPasswordEmailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (user.provider !== "BASIC") {
    return null;
  }

  const verified = user.emailVerified === true;

  async function handleResendVerification() {
    setError(null);
    setSuccess(null);
    setIsSendingVerification(true);
    try {
      await sendUserEmailVerification(user.id);
      onUserUpdated({ ...user, emailVerified: false });
      setSuccess("Doğrulama maili gönderildi.");
    } catch (err) {
      setError(toMessage(err, "Doğrulama maili gönderilemedi."));
    } finally {
      setIsSendingVerification(false);
    }
  }

  async function handleResetPassword() {
    setError(null);
    setSuccess(null);
    setIsResettingPassword(true);
    try {
      const result = await resetUserPassword(user.id);
      setTemporaryPassword(result.temporaryPassword);
      setPasswordEmailed(result.emailed);
      setCopied(false);
      setConfirmResetOpen(false);
      setPasswordDialogOpen(true);
    } catch (err) {
      setError(toMessage(err, "Geçici şifre oluşturulamadı."));
    } finally {
      setIsResettingPassword(false);
    }
  }

  async function handleCopy() {
    if (!temporaryPassword) return;
    await navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
  }

  function handlePasswordDialogChange(open: boolean) {
    setPasswordDialogOpen(open);
    if (!open) {
      setTemporaryPassword(null);
      setPasswordEmailed(false);
      setCopied(false);
    }
  }

  return (
    <>
      <Card className="border-border/60 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Hesap güvenliği</CardTitle>
          <CardDescription className="text-xs">
            E-posta doğrulama ve geçici şifre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">E-posta</span>
            <Badge variant={verified ? "secondary" : "outline"}>
              {verified ? "Onaylı" : "Onaylanmamış"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {!verified ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSendingVerification}
                onClick={handleResendVerification}
              >
                {isSendingVerification ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Gönderiliyor
                  </>
                ) : (
                  "Doğrulama maili gönder"
                )}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isResettingPassword}
              onClick={() => setConfirmResetOpen(true)}
            >
              Geçici şifre oluştur
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Geçici şifre oluştur</DialogTitle>
            <DialogDescription>
              Mevcut oturumlar iptal edilir. Onaylı e-postaya şifre maili gider; onaylanmamışsa yalnızca burada görünür.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isResettingPassword}
              onClick={() => setConfirmResetOpen(false)}
            >
              Vazgeç
            </Button>
            <Button type="button" disabled={isResettingPassword} onClick={handleResetPassword}>
              {isResettingPassword ? (
                <>
                  <Loader2 className="animate-spin" />
                  Oluşturuluyor
                </>
              ) : (
                "Oluştur"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={handlePasswordDialogChange}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Geçici şifre</DialogTitle>
            <DialogDescription>
              {passwordEmailed
                ? "Şifre üyenin e-postasına gönderildi. Bu pencere kapanınca şifre burada görünmez."
                : "E-posta onaylanmadığı için mail gönderilmedi. Bu pencere kapanınca şifre burada görünmez."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm tracking-wide">
              {temporaryPassword}
            </code>
            <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
              <Copy />
              {copied ? "Kopyalandı" : "Kopyala"}
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => handlePasswordDialogChange(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function toMessage(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}
