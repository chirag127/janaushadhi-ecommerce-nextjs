"use server";

import { contactSchema } from "@/lib/validations";
import { dbCreateContactMessage } from "@/lib/db/repository";

export type ActionState = { error?: string; success?: string } | null;

export async function submitContact(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { error } = await dbCreateContactMessage(parsed.data);
  if (error) {
    return { error: "Failed to send message. Please try again." };
  }
  return { success: "Thank you! We'll respond within 1 business day." };
}
