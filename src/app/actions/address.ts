"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/db/auth-stub";
import {
  dbClearDefaultAddresses,
  dbUpsertAddress,
  dbDeleteAddress,
} from "@/lib/db/repository";
import { addressSchema } from "@/lib/validations";

export async function saveAddress(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
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

  if (parsed.data.is_default) {
    const { error } = await dbClearDefaultAddresses(user.id);
    if (error) return { error: error.message };
  }

  const { error } = await dbUpsertAddress({
    id,
    user_id: user.id,
    ...parsed.data,
    line2: parsed.data.line2 ?? null,
    is_default: parsed.data.is_default ?? false,
  });
  if (error) return { error: error.message };

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: "Address saved" };
}

export async function deleteAddress(id: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await dbDeleteAddress(id, user.id);
  if (error) return { error: error.message };

  revalidatePath("/account/addresses");
  return { success: "Address deleted" };
}
