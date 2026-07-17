"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/insforge/server";
import { addressSchema } from "@/lib/validations";

export async function saveAddress(_prev: unknown, formData: FormData) {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = addressSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    is_default: formData.get("is_default") === "on",
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const id = formData.get("id") as string | null;

  // If setting default, clear others first.
  if (parsed.data.is_default) {
    await insforge.database
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  if (id) {
    const { error } = await insforge.database
      .from("addresses")
      .update(parsed.data)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await insforge.database
      .from("addresses")
      .insert([{ ...parsed.data, user_id: user.id }]);
    if (error) return { error: error.message };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: "Address saved" };
}

export async function deleteAddress(id: string) {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await insforge.database
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account/addresses");
  return { success: "Address deleted" };
}
