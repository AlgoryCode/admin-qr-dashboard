import {
  BarChart3,
  History,
  Activity,
  ShieldCheck,
  CreditCard,
  Globe,
  Megaphone,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Ticket,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown only to super admins. */
  adminOnly?: boolean;
};

export const mainNav: NavItem[] = [
  { href: "/", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/kullanicilar", label: "Kullanıcılar", icon: Users },
  { href: "/odemeler", label: "Ödemeler", icon: CreditCard },
  { href: "/gelir", label: "Gelir", icon: TrendingUp },
  { href: "/paketler", label: "Paket ve Ürünler", icon: Package },
  { href: "/kuponlar", label: "Kuponlar", icon: Ticket },
  {
    href: "/musteri-geri-bildirimleri",
    label: "Destek Talepleri",
    icon: MessageSquare,
  },
  { href: "/icerik", label: "İçerik", icon: Megaphone },
  { href: "/raporlar", label: "Raporlar", icon: BarChart3 },
  { href: "/site-analitik", label: "Site Analitiği", icon: Globe },
];

export const secondaryNav: NavItem[] = [
  {
    href: "/yoneticiler",
    label: "Yöneticiler",
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    href: "/islem-gecmisi",
    label: "İşlem Geçmişi",
    icon: History,
    adminOnly: true,
  },
  {
    href: "/sistem",
    label: "Sistem",
    icon: Activity,
    adminOnly: true,
  },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveNavLabel(pathname: string) {
  const match = [...mainNav, ...secondaryNav].find((item) =>
    isNavItemActive(pathname, item.href),
  );
  return match?.label ?? "Yönetim Paneli";
}
