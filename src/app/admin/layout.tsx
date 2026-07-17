import { redirect } from "next/navigation";
import Link from "next/link";
import { Pill } from "lucide-react";
import { getProfile } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login?redirect=/admin");
  if (profile.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Pill className="h-4 w-4" />
            </span>
            <span>{siteConfig.shortName} Admin</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r p-4 lg:block">
          <AdminNav />
        </aside>
        <main className="flex-1 overflow-x-auto p-4 lg:p-6">
          {/* Mobile nav */}
          <div className="mb-4 lg:hidden">
            <AdminNav />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
