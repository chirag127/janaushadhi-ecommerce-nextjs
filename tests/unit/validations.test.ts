/**
 * Unit tests for src/lib/validations.ts (Zod schemas).
 * No DB or network needed.
 */
import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  addressSchema,
  reviewSchema,
  productSchema,
  categorySchema,
  couponSchema,
  contactSchema,
} from "../../src/lib/validations";

// ---- contactSchema ----
describe("contactSchema", () => {
  const valid = { name: "Asha", email: "asha@example.com", message: "Hello there" };

  it("accepts valid input", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects short name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });
  it("rejects bad email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
  it("rejects short message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "Hi" }).success).toBe(false);
  });
});

// ---- loginSchema ----
describe("loginSchema", () => {
  const valid = { email: "user@test.com", password: "secret123" };

  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects bad email", () => {
    expect(loginSchema.safeParse({ ...valid, email: "bad" }).success).toBe(false);
  });
  it("rejects short password", () => {
    expect(loginSchema.safeParse({ ...valid, password: "abc" }).success).toBe(false);
  });
});

// ---- registerSchema ----
describe("registerSchema", () => {
  const valid = { fullName: "Test User", email: "t@t.com", password: "pass1234" };

  it("accepts valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects short fullName", () => {
    expect(registerSchema.safeParse({ ...valid, fullName: "X" }).success).toBe(false);
  });
});

// ---- forgotPasswordSchema ----
describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "notvalid" }).success).toBe(false);
  });
});

// ---- resetPasswordSchema ----
describe("resetPasswordSchema", () => {
  it("accepts 6+ char password", () => {
    expect(resetPasswordSchema.safeParse({ password: "newpass" }).success).toBe(true);
  });
  it("rejects short password", () => {
    expect(resetPasswordSchema.safeParse({ password: "abc" }).success).toBe(false);
  });
});

// ---- addressSchema ----
describe("addressSchema", () => {
  const valid = {
    full_name: "Priya Sharma",
    phone: "9876543210",
    line1: "123 Main St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  };

  it("accepts valid address", () => {
    expect(addressSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects invalid pincode", () => {
    expect(addressSchema.safeParse({ ...valid, pincode: "12345" }).success).toBe(false);
  });
  it("rejects short phone", () => {
    expect(addressSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
  });
  it("accepts optional line2", () => {
    expect(addressSchema.safeParse({ ...valid, line2: "Apt 4B" }).success).toBe(true);
  });
});

// ---- reviewSchema ----
describe("reviewSchema", () => {
  const valid = { product_id: "00000000-0000-0000-0000-000000000001", rating: 4 };

  it("accepts valid review", () => {
    expect(reviewSchema.safeParse(valid).success).toBe(true);
  });
  it("coerces string rating to number", () => {
    const r = reviewSchema.safeParse({ ...valid, rating: "3" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.rating).toBe(3);
  });
  it("rejects rating 0", () => {
    expect(reviewSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
  });
  it("rejects rating 6", () => {
    expect(reviewSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
  });
  it("rejects bad uuid", () => {
    expect(reviewSchema.safeParse({ ...valid, product_id: "not-a-uuid" }).success).toBe(false);
  });
});

// ---- productSchema ----
describe("productSchema", () => {
  const valid = {
    drug_code: "JANX001",
    name: "Paracetamol 500mg",
    mrp: 10.5,
    stock: 100,
  };

  it("accepts valid product", () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });
  it("coerces string mrp", () => {
    const r = productSchema.safeParse({ ...valid, mrp: "9.99" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.mrp).toBe(9.99);
  });
  it("rejects empty drug_code", () => {
    expect(productSchema.safeParse({ ...valid, drug_code: "" }).success).toBe(false);
  });
  it("rejects negative stock", () => {
    expect(productSchema.safeParse({ ...valid, stock: -1 }).success).toBe(false);
  });
  it("accepts optional image_url", () => {
    expect(productSchema.safeParse({ ...valid, image_url: "" }).success).toBe(true);
    expect(productSchema.safeParse({ ...valid, image_url: "https://example.com/img.png" }).success).toBe(true);
  });
});

// ---- categorySchema ----
describe("categorySchema", () => {
  it("accepts valid category", () => {
    expect(categorySchema.safeParse({ name: "Antibiotics" }).success).toBe(true);
  });
  it("rejects short name", () => {
    expect(categorySchema.safeParse({ name: "A" }).success).toBe(false);
  });
});

// ---- couponSchema ----
describe("couponSchema", () => {
  const valid = {
    code: "SAVE10",
    discount_type: "percent" as const,
    discount_value: 10,
    min_order_amount: 200,
  };

  it("accepts valid coupon", () => {
    expect(couponSchema.safeParse(valid).success).toBe(true);
  });
  it("coerces string discount_value", () => {
    const r = couponSchema.safeParse({ ...valid, discount_value: "15" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.discount_value).toBe(15);
  });
  it("rejects short code", () => {
    expect(couponSchema.safeParse({ ...valid, code: "AB" }).success).toBe(false);
  });
  it("rejects invalid discount_type", () => {
    expect(couponSchema.safeParse({ ...valid, discount_type: "unknown" as "percent" }).success).toBe(false);
  });
  it("accepts fixed type", () => {
    expect(couponSchema.safeParse({ ...valid, discount_type: "fixed" }).success).toBe(true);
  });
});
