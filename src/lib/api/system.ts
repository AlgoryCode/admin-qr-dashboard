import { apiRequest } from "./client";

export type HealthStatus = "UP" | "WARN" | "DOWN";

export type SystemHealth = {
  overall: HealthStatus;
  checkedAt: string;
  checks: {
    name: string;
    status: HealthStatus;
    detail: string;
    latencyMs: number | null;
  }[];
  jobs: {
    name: string;
    lastStartedAt: string | null;
    lockedUntil: string | null;
    lockedBy: string | null;
    running: boolean;
  }[];
  backlogs: {
    key: string;
    label: string;
    count: number;
    severity: "bad" | "warn" | "info";
  }[];
  runtime: Record<string, string | number>;
};

export type AiUsage = {
  days: number;
  assistantTracked: boolean;
  smartReportsTracked: boolean;
  assistantQuestions: number;
  assistantFailed: number;
  assistantAvgMs: number | null;
  smartReports: number;
  smartReportsFailed: number;
  estimatedCost: number;
  costCurrency: string;
  assistantUnitCost: number;
  smartReportUnitCost: number;
  series: { day: string; assistant: number; smartReports: number }[];
  assistantOutcomes: { key: string; count: number }[];
  assistantTopics: { key: string; count: number }[];
  smartReportStatuses: { key: string; count: number }[];
  smartReportErrors: { key: string; count: number }[];
  topMerchants: {
    merchantId: number;
    name: string | null;
    assistant: number;
    smartReports: number;
  }[];
};

export const getSystemHealth = () =>
  apiRequest<SystemHealth>("/admin/system/health");
export const getAiUsage = (days: number) =>
  apiRequest<AiUsage>(`/admin/system/ai-usage?days=${days}`);
