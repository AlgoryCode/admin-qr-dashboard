import { apiRequest } from "./client";

export interface SiteVisitItem {
  id: number;
  path: string;
  referrer: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  device: string | null;
  deviceType: string | null;
  countryCode: string | null;
  countryName: string | null;
  regionName: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface SiteVisitPageResponse {
  content: SiteVisitItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface SiteAnalyticsSummary {
  totalVisits: number;
  uniqueCountries: number;
  devices: NamedCount[];
  countries: NamedCount[];
  daily: DailyCount[];
}

export const DEFAULT_PAGE_SIZE = 20;

export function listSiteVisits(page = 0, size = DEFAULT_PAGE_SIZE, days?: number) {
  const search = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (days != null) search.set("days", String(days));

  return apiRequest<SiteVisitPageResponse>(`/admin/site-visits?${search.toString()}`);
}

export function getSiteAnalyticsSummary(days?: number) {
  const search = new URLSearchParams();
  if (days != null) search.set("days", String(days));
  const query = search.toString();

  return apiRequest<SiteAnalyticsSummary>(
    `/admin/site-visits/summary${query ? `?${query}` : ""}`,
  );
}
