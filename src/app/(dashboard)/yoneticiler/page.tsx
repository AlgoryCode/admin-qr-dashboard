import { AdminAccountsPanel } from "@/components/algory/admin-accounts-panel";
import { SuperAdminOnly } from "@/components/algory/super-admin-only";

export default function YoneticilerPage() {
  return (
    <SuperAdminOnly>
      <AdminAccountsPanel />
    </SuperAdminOnly>
  );
}
