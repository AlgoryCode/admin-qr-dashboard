"use client";

import { Check, ChevronsUpDown, FolderKanban, Plus } from "lucide-react";
import { useProject } from "@/context/project-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const statusLabels = {
  active: "Aktif",
  paused: "Duraklatıldı",
  archived: "Arşivlendi",
} as const;

export function ProjectSelector() {
  const { projects, selectedProject, selectProject } = useProject();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-9 gap-2 border-border/60 bg-background/50 px-3 font-normal hover:bg-accent/50"
          />
        }
      >
        <div className="flex size-5 items-center justify-center rounded bg-foreground/10">
          <FolderKanban className="size-3 text-foreground/70" />
        </div>
        <span className="max-w-[160px] truncate text-sm font-medium">
          {selectedProject.name}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Projeler
        </DropdownMenuLabel>
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => selectProject(project.id)}
            className="flex cursor-pointer items-center gap-3 py-2.5"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/50">
              <FolderKanban className="size-4 text-muted-foreground" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{project.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {project.domain}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {project.status !== "active" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {statusLabels[project.status]}
                </Badge>
              )}
              {selectedProject.id === project.id && (
                <Check className="size-4 text-foreground" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer gap-2 text-muted-foreground">
          <Plus className="size-4" />
          <span className="text-sm">Yeni Proje Oluştur</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
