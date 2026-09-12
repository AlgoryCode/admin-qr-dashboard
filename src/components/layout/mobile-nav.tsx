"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav, SidebarStatus } from "./sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground lg:hidden"
            aria-label="Menüyü aç"
          />
        }
      >
        <Menu className="size-5" />
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col bg-sidebar shadow-xl ring-1 ring-foreground/10 duration-200 outline-none data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-3">
            <div className="flex size-7 items-center justify-center rounded-md border border-border/60 bg-muted/50">
              <QrCode className="size-4 text-foreground/80" />
            </div>
            <DialogPrimitive.Title className="text-sm font-medium">
              Yönetim Paneli
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-9 text-muted-foreground"
                  aria-label="Menüyü kapat"
                />
              }
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>

          <div className="shrink-0 border-t border-border/60 p-3">
            <SidebarStatus />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
