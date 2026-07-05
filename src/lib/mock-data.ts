import type {
  AlgoryProjectDetail,
  AlgoryStats,
  AlgoryUser,
  PackageProduct,
  PackagePurchase,
  Project,
  ReportMetric,
  UsageDataPoint,
} from "./types";

export const ALGORYQR_PROJECT_ID = "proj_algoryqr";

export const projects: Project[] = [
  {
    id: ALGORYQR_PROJECT_ID,
    name: "AlgoryQR",
    slug: "algoryqr",
    description: "Dinamik QR kod yönetim ve analitik platformu",
    status: "active",
    domain: "app.algoryqr.com",
    framework: "Next.js",
    region: "Istanbul (eu-west-1)",
    createdAt: "2024-02-10",
  },
  {
    id: "proj_demo",
    name: "Demo Proje",
    slug: "demo-proje",
    description: "Test ve geliştirme ortamı",
    status: "paused",
    domain: "demo.example.com",
    framework: "Next.js",
    region: "Frankfurt (eu-central-1)",
    createdAt: "2024-08-01",
  },
];

const algoryStats: AlgoryStats = {
  totalUsers: 4_832,
  usersChange: 18.2,
  activeSubscriptions: 1_247,
  subscriptionsChange: 12.5,
  totalQrScans: 2_840_000,
  qrScansChange: 24.8,
  monthlyRevenue: 184_500,
  revenueChange: 15.3,
};

function generateUsage(seed: number): UsageDataPoint[] {
  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  return days.map((date, i) => ({
    date,
    qrScans: Math.floor(seed * (0.8 + Math.sin(i + 1) * 0.25)),
    activeUsers: Math.floor(seed * 0.04 * (0.85 + Math.cos(i) * 0.15)),
  }));
}

const purchases: PackagePurchase[] = [
  {
    id: "pur_1",
    userId: "usr_1",
    userName: "Mehmet Yıldız",
    userEmail: "mehmet@firma.com",
    packageName: "Pro Paket",
    amount: 499,
    currency: "TRY",
    status: "completed",
    createdAt: "2026-07-04T21:30:00Z",
  },
  {
    id: "pur_2",
    userId: "usr_2",
    userName: "Ayşe Demir",
    userEmail: "ayse@restoran.com",
    packageName: "Starter Paket",
    amount: 149,
    currency: "TRY",
    status: "completed",
    createdAt: "2026-07-04T18:15:00Z",
  },
  {
    id: "pur_3",
    userId: "usr_3",
    userName: "Can Öztürk",
    userEmail: "can@eticaret.io",
    packageName: "Enterprise Paket",
    amount: 1499,
    currency: "TRY",
    status: "pending",
    createdAt: "2026-07-04T16:42:00Z",
  },
  {
    id: "pur_4",
    userId: "usr_4",
    userName: "Zeynep Kaya",
    userEmail: "zeynep@klinik.com",
    packageName: "Dinamik QR Eklentisi",
    amount: 79,
    currency: "TRY",
    status: "completed",
    createdAt: "2026-07-04T14:20:00Z",
  },
  {
    id: "pur_5",
    userId: "usr_5",
    userName: "Ali Vural",
    userEmail: "ali@magaza.net",
    packageName: "Pro Paket",
    amount: 499,
    currency: "TRY",
    status: "failed",
    createdAt: "2026-07-04T11:05:00Z",
  },
  {
    id: "pur_6",
    userId: "usr_6",
    userName: "Selin Arslan",
    userEmail: "selin@hotel.com",
    packageName: "Analytics Pro",
    amount: 199,
    currency: "TRY",
    status: "completed",
    createdAt: "2026-07-03T22:50:00Z",
  },
];

const users: AlgoryUser[] = [
  {
    id: "usr_1",
    name: "Mehmet Yıldız",
    email: "mehmet@firma.com",
    package: "Pro Paket",
    qrCount: 48,
    scanCount: 124_500,
    usagePercent: 72,
    status: "active",
    joinedAt: "2025-03-12",
    lastActiveAt: "2026-07-04T22:00:00Z",
  },
  {
    id: "usr_2",
    name: "Ayşe Demir",
    email: "ayse@restoran.com",
    package: "Starter Paket",
    qrCount: 12,
    scanCount: 18_200,
    usagePercent: 45,
    status: "active",
    joinedAt: "2025-08-20",
    lastActiveAt: "2026-07-04T19:30:00Z",
  },
  {
    id: "usr_3",
    name: "Can Öztürk",
    email: "can@eticaret.io",
    package: "Enterprise Paket",
    qrCount: 320,
    scanCount: 890_000,
    usagePercent: 91,
    status: "active",
    joinedAt: "2024-11-05",
    lastActiveAt: "2026-07-04T23:15:00Z",
  },
  {
    id: "usr_4",
    name: "Zeynep Kaya",
    email: "zeynep@klinik.com",
    package: "Starter Paket",
    qrCount: 8,
    scanCount: 4_800,
    usagePercent: 28,
    status: "active",
    joinedAt: "2026-01-18",
    lastActiveAt: "2026-07-03T10:00:00Z",
  },
  {
    id: "usr_5",
    name: "Ali Vural",
    email: "ali@magaza.net",
    package: "Pro Paket",
    qrCount: 35,
    scanCount: 52_100,
    usagePercent: 58,
    status: "inactive",
    joinedAt: "2025-06-02",
    lastActiveAt: "2026-06-20T08:00:00Z",
  },
  {
    id: "usr_6",
    name: "Selin Arslan",
    email: "selin@hotel.com",
    package: "Pro Paket",
    qrCount: 64,
    scanCount: 210_400,
    usagePercent: 83,
    status: "active",
    joinedAt: "2025-02-28",
    lastActiveAt: "2026-07-04T20:45:00Z",
  },
  {
    id: "usr_7",
    name: "Burak Tekin",
    email: "burak@startup.co",
    package: "Starter Paket",
    qrCount: 5,
    scanCount: 1_200,
    usagePercent: 12,
    status: "suspended",
    joinedAt: "2026-04-10",
    lastActiveAt: "2026-06-01T14:00:00Z",
  },
  {
    id: "usr_8",
    name: "Elif Şahin",
    email: "elif@cafe.com",
    package: "Starter Paket",
    qrCount: 15,
    scanCount: 22_800,
    usagePercent: 52,
    status: "active",
    joinedAt: "2025-10-15",
    lastActiveAt: "2026-07-04T17:20:00Z",
  },
];

const packages: PackageProduct[] = [
  {
    id: "pkg_1",
    name: "Starter Paket",
    type: "package",
    description: "Küçük işletmeler için temel QR çözümü",
    price: 149,
    currency: "TRY",
    billingPeriod: "monthly",
    qrLimit: 25,
    scanLimit: 50_000,
    subscriberCount: 842,
    status: "active",
  },
  {
    id: "pkg_2",
    name: "Pro Paket",
    type: "package",
    description: "Büyüyen işletmeler için gelişmiş özellikler",
    price: 499,
    currency: "TRY",
    billingPeriod: "monthly",
    qrLimit: 100,
    scanLimit: 250_000,
    subscriberCount: 312,
    status: "active",
  },
  {
    id: "pkg_3",
    name: "Enterprise Paket",
    type: "package",
    description: "Kurumsal ölçekte sınırsız QR ve API erişimi",
    price: 1499,
    currency: "TRY",
    billingPeriod: "monthly",
    qrLimit: null,
    scanLimit: null,
    subscriberCount: 93,
    status: "active",
  },
  {
    id: "prd_1",
    name: "Dinamik QR Eklentisi",
    type: "product",
    description: "QR içeriğini anlık güncelleme özelliği",
    price: 79,
    currency: "TRY",
    billingPeriod: "monthly",
    qrLimit: null,
    scanLimit: null,
    subscriberCount: 456,
    status: "active",
  },
  {
    id: "prd_2",
    name: "Analytics Pro",
    type: "product",
    description: "Detaylı tarama analitiği ve heatmap",
    price: 199,
    currency: "TRY",
    billingPeriod: "monthly",
    qrLimit: null,
    scanLimit: null,
    subscriberCount: 178,
    status: "active",
  },
  {
    id: "prd_3",
    name: "White Label",
    type: "product",
    description: "Markanıza özel QR arayüzü",
    price: 999,
    currency: "TRY",
    billingPeriod: "monthly",
    qrLimit: null,
    scanLimit: null,
    subscriberCount: 24,
    status: "active",
  },
  {
    id: "pkg_4",
    name: "Yıllık Pro",
    type: "package",
    description: "Pro paket yıllık abonelik (%20 indirimli)",
    price: 4790,
    currency: "TRY",
    billingPeriod: "yearly",
    qrLimit: 100,
    scanLimit: 250_000,
    subscriberCount: 67,
    status: "active",
  },
  {
    id: "prd_4",
    name: "API Erişim Paketi",
    type: "product",
    description: "REST API ile QR yönetimi",
    price: 349,
    currency: "TRY",
    billingPeriod: "monthly",
    qrLimit: null,
    scanLimit: null,
    subscriberCount: 41,
    status: "draft",
  },
];

const reportMetrics: ReportMetric[] = [
  { label: "Dönüşüm Oranı", value: "%4.2", change: 0.8 },
  { label: "Ort. Paket Süresi", value: "8.4 ay", change: 5.1 },
  { label: "Churn Oranı", value: "%2.1", change: -0.4 },
  { label: "ARPU", value: "₺382", change: 11.2 },
];

const demoStats: AlgoryStats = {
  totalUsers: 120,
  usersChange: 5.0,
  activeSubscriptions: 45,
  subscriptionsChange: 3.2,
  totalQrScans: 85_000,
  qrScansChange: 8.1,
  monthlyRevenue: 12_400,
  revenueChange: 4.5,
};

export function getProjectDetail(projectId: string): AlgoryProjectDetail | null {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  const isAlgory = projectId === ALGORYQR_PROJECT_ID;

  return {
    project,
    stats: isAlgory ? algoryStats : demoStats,
    usage: generateUsage(isAlgory ? 42000 : 5000),
    purchases: isAlgory ? purchases : purchases.slice(0, 2),
    users: isAlgory ? users : users.slice(0, 3),
    packages: isAlgory ? packages : packages.slice(0, 3),
    reportMetrics: isAlgory ? reportMetrics : reportMetrics.slice(0, 2),
  };
}

export function getAllProjects(): Project[] {
  return projects;
}

export function formatCurrency(amount: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("tr-TR").format(n);
}
