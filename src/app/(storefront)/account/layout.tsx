import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AccountNav } from "@/components/account/account-nav";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login?redirect=/account");

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">My Account</h1>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <AccountNav />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
