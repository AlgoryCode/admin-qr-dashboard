import {
  BarChart3,
  CreditCard,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const mainNav: NavItem[] = [
  { href: "/", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/kullanicilar", label: "Kullanıcılar", icon: Users },
  { href: "/odemeler", label: "Ödemeler", icon: CreditCard },
  { href: "/paketler", label: "Paket ve Ürünler", icon: Package },
  { href: "/kuponlar", label: "Kuponlar", icon: Ticket },
  { href: "/musteri-geri-bildirimleri", label: "Müşteri Geri Bildirimleri", icon: MessageSquare },
  { href: "/raporlar", label: "Raporlar", icon: BarChart3 },
  { href: "/site-analitik", label: "Site Analitiği", icon: Globe },
];

export const secondaryNav: NavItem[] = [
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveNavLabel(pathname: string) {
  const match = [...mainNav, ...secondaryNav].find((item) =>
    isNavItemActive(pathname, item.href)
  );
  return match?.label ?? "Yönetim Paneli";
}
