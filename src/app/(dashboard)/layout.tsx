import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AlgoryDataProvider } from "@/context/algory-data-context";
import { ProjectProvider } from "@/context/project-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ProjectProvider>
        <AlgoryDataProvider>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="flex-1">
                <div className="mx-auto max-w-7xl p-3 sm:p-4 lg:p-6">{children}</div>
              </main>
            </div>
          </div>
        </AlgoryDataProvider>
      </ProjectProvider>
    </AuthGuard>
  );
}
