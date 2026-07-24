import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/account/profile-form";
import { dbGetProfileField } from "@/lib/db/repository";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

export default async function ProfilePage() {
  const user = await getUser();
  const { data: profile } = await dbGetProfileField(user!.id, ["full_name", "phone"]);

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
