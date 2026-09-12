"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isNavItemActive, mainNav, secondaryNav, type NavItem } from "./nav-config";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem) => {
    const isActive = isNavItemActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex min-h-10 items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
          isActive
            ? "bg-accent text-foreground font-medium"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <item.icon className="size-4 shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <nav className="flex flex-col gap-1">
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Ana Menü
        </p>
        {mainNav.map(renderNavItem)}
      </nav>

      <nav className="mt-4 flex flex-col gap-1 border-t border-border/60 pt-4">
        {secondaryNav.map(renderNavItem)}
      </nav>
    </>
  );
}

export function SidebarStatus() {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium">Platform çalışıyor</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Tüm projeler · Merkezi yönetim
      </p>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border/60 bg-sidebar lg:flex">
      <ScrollArea className="flex-1 px-3 py-4">
        <SidebarNav />
      </ScrollArea>

      <div className="border-t border-border/60 p-3">
        <SidebarStatus />
      </div>
    </aside>
  );
}
