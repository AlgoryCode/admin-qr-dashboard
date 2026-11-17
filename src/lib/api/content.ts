import { apiRequest } from "./client";

export type Tone = "INFO" | "SUCCESS" | "WARNING";
export type Audience = "ALL" | "PAYING" | "FREE";

export type Announcement = {
  id: number;
  title: string;
  body: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  tone: Tone;
  audience: Audience;
  startsAt: string;
  endsAt: string | null;
  dismissible: boolean;
  active: boolean;
  live: boolean;
  createdBy: string | null;
  createdAt: string;
};

export type AnnouncementRequest = Omit<
  Announcement,
  "id" | "live" | "createdBy" | "createdAt"
>;

export type FaqEntry = {
  id: number;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
  updatedBy: string | null;
  updatedAt: string;
};

export type FaqRequest = Pick<
  FaqEntry,
  "category" | "question" | "answer" | "sortOrder" | "published"
>;

export type EmailTemplate = {
  key: string;
  name: string;
  description: string;
  variables: string[];
  subject: string;
  body: string;
  enabled: boolean;
  customized: boolean;
  defaultSubject: string;
  defaultBody: string;
  updatedBy: string | null;
  updatedAt: string | null;
};

const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const listAnnouncements = () =>
  apiRequest<Announcement[]>("/admin/announcements");
export const saveAnnouncement = (
  id: number | null,
  body: AnnouncementRequest,
) =>
  apiRequest<Announcement>(
    id == null ? "/admin/announcements" : `/admin/announcements/${id}`,
    json(id == null ? "POST" : "PUT", body),
  );
export const deleteAnnouncement = (id: number) =>
  apiRequest<void>(`/admin/announcements/${id}`, { method: "DELETE" });

export const listFaq = () => apiRequest<FaqEntry[]>("/admin/faq");
export const saveFaq = (id: number | null, body: FaqRequest) =>
  apiRequest<FaqEntry>(
    id == null ? "/admin/faq" : `/admin/faq/${id}`,
    json(id == null ? "POST" : "PUT", body),
  );
export const deleteFaq = (id: number) =>
  apiRequest<void>(`/admin/faq/${id}`, { method: "DELETE" });

export const listTemplates = () =>
  apiRequest<EmailTemplate[]>("/admin/email-templates");
export const saveTemplate = (
  key: string,
  body: { subject: string; body: string; enabled: boolean },
) =>
  apiRequest<EmailTemplate>(`/admin/email-templates/${key}`, json("PUT", body));
export const resetTemplate = (key: string) =>
  apiRequest<EmailTemplate>(`/admin/email-templates/${key}/reset`, {
    method: "POST",
  });
export const previewTemplate = (
  key: string,
  body: { subject: string; body: string; enabled: boolean },
) =>
  apiRequest<{ subject: string; body: string }>(
    `/admin/email-templates/${key}/preview`,
    json("POST", body),
  );
