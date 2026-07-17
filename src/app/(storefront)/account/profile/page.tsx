import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/account/profile-form";
import { createClient } from "@/lib/insforge/server";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

export default async function ProfilePage() {
  const user = await getUser();
  const insforge = await createClient();
  const { data: profile } = await insforge.database
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user!.id)
    .single();

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Profile Information</h2>
      <Card>
        <CardContent className="pt-6">
          <ProfileForm
            email={user!.email ?? ""}
            fullName={profile?.full_name ?? ""}
            phone={profile?.phone ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
