"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALGORYQR_PROJECT_ID, getAllProjects, getProjectDetail } from "@/lib/mock-data";
import type { AlgoryProjectDetail, Project } from "@/lib/types";

interface ProjectContextValue {
  projects: Project[];
  selectedProject: Project;
  projectDetail: AlgoryProjectDetail;
  selectProject: (projectId: string) => void;
  isLoading: boolean;
  isAlgoryQR: boolean;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const projects = useMemo(() => getAllProjects(), []);
  const [selectedId, setSelectedId] = useState(ALGORYQR_PROJECT_ID);
  const [isLoading, setIsLoading] = useState(false);

  const selectProject = useCallback((projectId: string) => {
    setIsLoading(true);
    setSelectedId(projectId);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedId) ?? projects[0];
  const projectDetail = getProjectDetail(selectedProject.id)!;

  const value = useMemo(
    () => ({
      projects,
      selectedProject,
      projectDetail,
      selectProject,
      isLoading,
      isAlgoryQR: selectedProject.id === ALGORYQR_PROJECT_ID,
    }),
    [projects, selectedProject, projectDetail, selectProject, isLoading]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
