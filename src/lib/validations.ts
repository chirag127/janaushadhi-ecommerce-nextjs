import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const addressSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Enter a valid 10-digit phone").max(15),
  line1: z.string().min(3, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  is_default: z.boolean().optional(),
});

export const reviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const productSchema = z.object({
  drug_code: z.string().min(1, "Drug code is required"),
  name: z.string().min(2, "Name is required"),
  unit_size: z.string().optional(),
  mrp: z.coerce.number().min(0),
  category_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
});

export const couponSchema = z.object({
  code: z.string().min(3, "Code is required").toUpperCase(),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.coerce.number().min(0),
  min_order_amount: z.coerce.number().min(0).default(0),
  max_discount_amount: z.coerce.number().min(0).optional(),
  usage_limit: z.coerce.number().int().min(0).optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CouponInput = z.infer<typeof couponSchema>;
