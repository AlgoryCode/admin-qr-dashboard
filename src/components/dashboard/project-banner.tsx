"use client";

import { ExternalLink, MapPin, QrCode, Server } from "lucide-react";
import { useProject } from "@/context/project-context";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  active: { label: "Aktif", variant: "default" as const },
  paused: { label: "Duraklatıldı", variant: "secondary" as const },
  archived: { label: "Arşivlendi", variant: "outline" as const },
};

export function ProjectBanner() {
  const { projectDetail, isLoading } = useProject();
  const { project } = projectDetail;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
    );
  }

  const status = statusConfig[project.status];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/50">
            <QrCode className="size-5 text-foreground/80" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        </div>
        <Badge variant={status.variant} className="font-normal">
          {status.label}
        </Badge>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">{project.description}</p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ExternalLink className="size-3.5" />
          <a
            href={`https://${project.domain}`}
            className="hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {project.domain}
          </a>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Server className="size-3.5" />
          {project.framework}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {project.region}
        </span>
      </div>
    </div>
  );
}
