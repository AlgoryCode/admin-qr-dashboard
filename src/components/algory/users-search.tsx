"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { listUsers, USERS_PAGE_SIZE } from "@/lib/api/users";
import { listAllTags, type TagCount } from "@/lib/api/members";
import { ApiError } from "@/lib/api/client";
import type { UserSummaryResponse } from "@/lib/api/types";
import { getAuthProviderLabel, getUserRoleLabel } from "@/lib/labels/tr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportButton } from "./export-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type ListParams = {
  page: number;
  query?: string;
  tag?: string;
};

export function UsersSearchPanel() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [listParams, setListParams] = useState<ListParams>({ page: 0 });
  const [users, setUsers] = useState<UserSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [knownTags, setKnownTags] = useState<TagCount[]>([]);

  useEffect(() => {
    let cancelled = false;
    listAllTags()
      .then((tags) => {
        if (!cancelled) setKnownTags(tags);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const activeQuery = listParams.query ?? "";
  const activeTag = listParams.tag ?? "";
  const isSearchMode = Boolean(activeQuery) || Boolean(activeTag);

  const fetchUsers = useCallback(async (params: ListParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listUsers(
        params.page,
        USERS_PAGE_SIZE,
        params.query,
        params.tag,
      );
      setUsers(result.content);
      setPage(result.page);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setHasNext(result.hasNext);
    } catch (err) {
      setUsers([]);
      setTotalElements(0);
      setTotalPages(0);
      setHasNext(false);

      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Kullanıcılar yüklenemedi.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(listParams);
  }, [listParams, fetchUsers]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    setListParams((p) => ({
      page: 0,
      query: trimmed || undefined,
      tag: p.tag,
    }));
  }

  function handleClearSearch() {
    setQuery("");
    setListParams({ page: 0 });
  }

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Kullanıcılar</CardTitle>
            <CardDescription>
              Kayıt tarihine göre yeniden eskiye · sayfa başına{" "}
              {USERS_PAGE_SIZE} kayıt
            </CardDescription>
          </div>
          <ExportButton kind="members" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-wrap gap-2 sm:max-w-md"
        >
          <div className="relative w-full sm:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Ad, e-posta veya ID ile filtrele..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Aranıyor
              </>
            ) : (
              <>
                <Search />
                Ara
              </>
            )}
          </Button>
          {isSearchMode && (
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={handleClearSearch}
            >
              Temizle
            </Button>
          )}
        </form>

        {knownTags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Etiket:</span>
            {knownTags.map((t) => {
              const active = activeTag === t.tag;
              return (
                <button
                  key={t.tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setListParams((p) => ({
                      page: 0,
                      query: p.query,
                      tag: active ? undefined : t.tag,
                    }))
                  }
                  className={
                    active
                      ? "rounded-md bg-foreground px-2 py-0.5 text-xs text-background"
                      : "rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                  }
                >
                  {t.tag}{" "}
                  <span className="tabular-nums opacity-70">{t.count}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? <Skeleton className="h-48 w-full" /> : null}

        {!isLoading && users.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">
            {isSearchMode
              ? `${activeQuery ? `"${activeQuery}"` : `"${activeTag}" etiketi`} için sonuç bulunamadı.`
              : "Henüz kullanıcı kaydı yok."}
          </p>
        )}

        {!isLoading && users.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">
              {isSearchMode
                ? `${activeQuery ? `"${activeQuery}"` : `"${activeTag}" etiketi`} için ${totalElements} sonuç`
                : `Toplam ${totalElements} kullanıcı`}
            </p>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Kayıt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/kullanicilar/${user.id}`)}
                  >
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {user.id}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.displayName ||
                        `${user.firstName} ${user.lastName ?? ""}`.trim()}
                      {user.tags && user.tags.length > 0 ? (
                        <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                          {user.tags.map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="h-4 px-1.5 text-[10px] font-normal"
                            >
                              {t}
                            </Badge>
                          ))}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getAuthProviderLabel(user.provider)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getUserRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Sayfa {page + 1}
                {totalPages > 0 ? ` / ${totalPages}` : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || isLoading}
                  onClick={() =>
                    setListParams((current) => ({
                      ...current,
                      page: Math.max(current.page - 1, 0),
                    }))
                  }
                >
                  Önceki
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasNext || isLoading}
                  onClick={() =>
                    setListParams((current) => ({
                      ...current,
                      page: current.page + 1,
                    }))
                  }
                >
                  Sonraki
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
