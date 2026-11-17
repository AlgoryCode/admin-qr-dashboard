import { AuditLogPanel } from "@/components/algory/audit-log-panel";
import { SuperAdminOnly } from "@/components/algory/super-admin-only";

export default function IslemGecmisiPage() {
  return (
    <SuperAdminOnly>
      <AuditLogPanel />
    </SuperAdminOnly>
  );
}
