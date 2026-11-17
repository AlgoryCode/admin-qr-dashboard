import type { CollectionStatus } from "@/lib/api/types";

export const COLLECTION_STATUS_ORDER: CollectionStatus[] = [
  "AWAITING_PAYMENT",
  "REMINDED",
  "UNPAID",
  "FORMAL_NOTICE",
  "PAYMENT_PLAN",
  "LEGAL_FOLLOW_UP",
  "PAID",
  "WRITTEN_OFF",
  "CANCELLED",
];

export const COLLECTION_STATUS_META: Record<
  CollectionStatus,
  { label: string; hint: string; closed: boolean; className: string }
> = {
  AWAITING_PAYMENT: {
    label: "Ödeme bekleniyor",
    hint: "Borç yeni; yenileme ya da üyenin kendi ödemesi bekleniyor.",
    closed: false,
    className: "border-amber-500/50 text-amber-700 dark:text-amber-400",
  },
  REMINDED: {
    label: "Hatırlatma yapıldı",
    hint: "Üye arandı ya da e-posta / SMS ile hatırlatıldı.",
    closed: false,
    className: "border-amber-500/50 text-amber-700 dark:text-amber-400",
  },
  UNPAID: {
    label: "Ödeme yapmadı",
    hint: "Süre geçti, ödeme gelmedi.",
    closed: false,
    className: "border-destructive/50 text-destructive",
  },
  FORMAL_NOTICE: {
    label: "İhtarname gönderildi",
    hint: "Resmi ihtar gönderildi.",
    closed: false,
    className: "border-destructive/50 text-destructive",
  },
  PAYMENT_PLAN: {
    label: "Ödeme planında",
    hint: "Borç için ödeme planı / yapılandırma yapıldı.",
    closed: false,
    className: "border-sky-500/50 text-sky-700 dark:text-sky-400",
  },
  LEGAL_FOLLOW_UP: {
    label: "Hukuki takipte",
    hint: "Dosya avukata / icra takibine devredildi.",
    closed: false,
    className: "border-destructive bg-destructive/10 text-destructive",
  },
  PAID: {
    label: "Ödendi",
    hint: "Borç tahsil edildi; dosya kapanır.",
    closed: true,
    className: "border-emerald-500/50 text-emerald-700 dark:text-emerald-400",
  },
  WRITTEN_OFF: {
    label: "Tahsil edilemez",
    hint: "Borçtan vazgeçildi; dosya kapanır.",
    closed: true,
    className: "text-muted-foreground",
  },
  CANCELLED: {
    label: "İptal",
    hint: "Yanlış açıldı ya da borç silindi; dosya kapanır.",
    closed: true,
    className: "text-muted-foreground",
  },
};
