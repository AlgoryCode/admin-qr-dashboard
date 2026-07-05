"use client";

import { Bell, LogOut, Search, Settings, User } from "lucide-react";
import Link from "next/link";
import { ProjectSelector } from "./project-selector";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { getUserDisplayName, getUserInitials } from "@/lib/auth/session";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      <ProjectSelector />

      <Separator orientation="vertical" className="hidden h-5 sm:block bg-border/60" />

      <div className="hidden flex-1 sm:block">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ara..."
            className="h-9 w-full rounded-md border border-border/60 bg-muted/30 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="size-9 text-muted-foreground">
          <Bell className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full p-0"
              />
            }
          >
            <Avatar className="size-8 border border-border/60">
              <AvatarFallback className="bg-muted text-xs font-medium">
                {user ? getUserInitials(user) : "AD"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">
                  {user ? getUserDisplayName(user) : "Admin"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.email ?? "admin@qr-service"}
                </span>
                {user?.roles?.includes("ROLE_ADMIN") && (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    ADMIN
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <Link href="/settings" className="flex w-full cursor-pointer items-center gap-2" />
              }
            >
              <Settings className="size-4" />
              Ayarlar
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2">
              <User className="size-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2"
              onClick={logout}
            >
              <LogOut className="size-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
