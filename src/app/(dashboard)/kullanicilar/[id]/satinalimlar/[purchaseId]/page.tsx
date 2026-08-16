import { ProjectBanner } from "@/components/dashboard/project-banner";
import { PurchaseDetailPanel } from "@/components/algory/purchase-detail-panel";

export default async function SatinalimDetayPage({
  params,
}: {
  params: Promise<{ id: string; purchaseId: string }>;
}) {
  const { id, purchaseId } = await params;
  const userId = Number(id);
  const purchaseIdNum = Number(purchaseId);

  return (
    <div className="space-y-8">
      <ProjectBanner />
      {Number.isFinite(userId) &&
      userId > 0 &&
      Number.isFinite(purchaseIdNum) &&
      purchaseIdNum > 0 ? (
        <PurchaseDetailPanel userId={userId} purchaseId={purchaseIdNum} />
      ) : (
        <p className="text-sm text-destructive">Geçersiz kullanıcı veya satın alım ID.</p>
      )}
    </div>
  );
}
