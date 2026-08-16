import { ProjectBanner } from "@/components/dashboard/project-banner";
import { UserDetailPanel } from "@/components/algory/user-detail";

export default async function KullaniciDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = Number(id);

  return (
    <div className="space-y-6">
      <ProjectBanner />
      {Number.isFinite(userId) && userId > 0 ? (
        <UserDetailPanel userId={userId} />
      ) : (
        <p className="text-sm text-destructive">Geçersiz kullanıcı ID.</p>
      )}
    </div>
  );
}
