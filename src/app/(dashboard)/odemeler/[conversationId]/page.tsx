import { PaymentDetailPanel } from "@/components/algory/payment-detail-panel";

export default async function OdemeDetayPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return (
    <div className="space-y-8">
      <PaymentDetailPanel conversationId={decodeURIComponent(conversationId)} />
    </div>
  );
}
