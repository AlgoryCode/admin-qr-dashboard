export type ProjectStatus = "active" | "paused" | "archived";

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  domain: string;
  framework: string;
  region: string;
  createdAt: string;
}

export interface AlgoryStats {
  totalUsers: number;
  usersChange: number;
  activeSubscriptions: number;
  subscriptionsChange: number;
  totalQrScans: number;
  qrScansChange: number;
  monthlyRevenue: number;
  revenueChange: number;
}

export interface UsageDataPoint {
  date: string;
  qrScans: number;
  activeUsers: number;
}

export interface PackagePurchase {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageName: string;
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed" | "refunded";
  createdAt: string;
}

export interface AlgoryUser {
  id: string;
  name: string;
  email: string;
  package: string;
  qrCount: number;
  scanCount: number;
  usagePercent: number;
  status: "active" | "inactive" | "suspended";
  joinedAt: string;
  lastActiveAt: string;
}

export interface PackageProduct {
  id: string;
  name: string;
  type: "package" | "product";
  description: string;
  price: number;
  currency: string;
  billingPeriod: "monthly" | "yearly" | "one-time";
  qrLimit: number | null;
  scanLimit: number | null;
  subscriberCount: number;
  status: "active" | "draft" | "archived";
}

export interface ReportMetric {
  label: string;
  value: string;
  change: number;
}

export interface AlgoryProjectDetail {
  project: Project;
  stats: AlgoryStats;
  usage: UsageDataPoint[];
  purchases: PackagePurchase[];
  users: AlgoryUser[];
  packages: PackageProduct[];
  reportMetrics: ReportMetric[];
}
