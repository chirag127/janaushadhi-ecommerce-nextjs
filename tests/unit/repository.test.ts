/**
 * Unit tests for src/lib/db/repository.ts
 *
 * The nextjs repo uses a module-level `db` proxy (client.ts).
 * We mock the entire client module so DATABASE_URL is never read.
 * Each test replaces the mock's method returns per-call via spies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- mock the db client BEFORE importing repository ----
const mockDb: Record<string, ReturnType<typeof vi.fn>> = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  offset: vi.fn(),
  leftJoin: vi.fn(),
  innerJoin: vi.fn(),
  orderBy: vi.fn(),
  returning: vi.fn(),
  values: vi.fn(),
  set: vi.fn(),
  onConflictDoUpdate: vi.fn(),
};

// Make every method return `mockDb` (chainable) by default.
Object.keys(mockDb).forEach((k) => {
  mockDb[k].mockReturnValue(mockDb);
});

vi.mock("../../src/lib/db/client", () => ({ db: mockDb }));

// Also mock drizzle-orm helpers used by repository (they only need to exist)
vi.mock("drizzle-orm", async (importOriginal) => {
  const orig = await importOriginal<typeof import("drizzle-orm")>();
  return orig;
});

// ---- helpers ----
function makeProductRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "prod-1",
    drug_code: "JANX001",
    name: "Paracetamol 500mg",
    slug: "paracetamol-500mg",
    description: "Pain reliever",
    category_id: "cat-1",
    unit_size: "10 tablets",
    mrp: "10.50",
    price: "7.00",
    stock: 100,
    image_url: null,
    is_active: true,
    is_featured: false,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-06-01"),
    category: { id: "cat-1", name: "Antibiotics", slug: "antibiotics" },
    ...overrides,
  };
}

// Reset all mocks before each test and restore default chainable behaviour.
beforeEach(() => {
  Object.keys(mockDb).forEach((k) => {
    mockDb[k].mockReset();
    mockDb[k].mockReturnValue(mockDb);
  });
});

// ---- coerceProduct (via dbGetProductBySlug) ----
describe("coerceProduct numeric coercion", () => {
  it("coerces mrp and price from string to number", async () => {
    const row = makeProductRow();
    mockDb.limit.mockResolvedValue([row]);

    const { dbGetProductBySlug } = await import("../../src/lib/db/repository");
    const result = await dbGetProductBySlug("paracetamol-500mg");

    expect(result.data).not.toBeNull();
    expect(typeof result.data!.mrp).toBe("number");
    expect(result.data!.mrp).toBeCloseTo(10.5);
    expect(typeof result.data!.price).toBe("number");
    expect(result.data!.price).toBeCloseTo(7.0);
  });

  it("preserves null image_url without throwing", async () => {
    const row = makeProductRow({ image_url: null });
    mockDb.limit.mockResolvedValue([row]);

    const { dbGetProductBySlug } = await import("../../src/lib/db/repository");
    const result = await dbGetProductBySlug("paracetamol-500mg");

    expect(result.data).not.toBeNull();
    expect(result.data!.image_url).toBeNull();
  });
});

// ---- dbGetProductBySlug null return ----
describe("dbGetProductBySlug", () => {
  it("returns null data for missing slug", async () => {
    mockDb.limit.mockResolvedValue([]);

    const { dbGetProductBySlug } = await import("../../src/lib/db/repository");
    const result = await dbGetProductBySlug("does-not-exist");

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it("returns product with category info", async () => {
    const row = makeProductRow();
    mockDb.limit.mockResolvedValue([row]);

    const { dbGetProductBySlug } = await import("../../src/lib/db/repository");
    const result = await dbGetProductBySlug("paracetamol-500mg");

    expect((result.data as unknown as { category?: { name: string } | null })?.category?.name).toBe("Antibiotics");
  });
});

// ---- dbGetCategoryBySlug null return ----
describe("dbGetCategoryBySlug", () => {
  it("returns null for missing slug", async () => {
    mockDb.limit.mockResolvedValue([]);

    const { dbGetCategoryBySlug } = await import("../../src/lib/db/repository");
    const result = await dbGetCategoryBySlug("nonexistent");

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it("returns category for existing slug", async () => {
    const row = { id: "c1", name: "Antibiotics", slug: "antibiotics", description: null, image_url: null, sort_order: 1, created_at: new Date() };
    mockDb.limit.mockResolvedValue([row]);

    const { dbGetCategoryBySlug } = await import("../../src/lib/db/repository");
    const result = await dbGetCategoryBySlug("antibiotics");

    expect(result.data!.name).toBe("Antibiotics");
  });
});

// ---- dbGetCategories ----
describe("dbGetCategories", () => {
  it("returns empty array when no rows", async () => {
    mockDb.orderBy.mockResolvedValue([]);

    const { dbGetCategories } = await import("../../src/lib/db/repository");
    const result = await dbGetCategories();

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("returns rows when present", async () => {
    const rows = [
      { id: "c1", name: "Analgesics", slug: "analgesics", description: null, image_url: null, sort_order: 1, created_at: new Date() },
    ];
    mockDb.orderBy.mockResolvedValue(rows);

    const { dbGetCategories } = await import("../../src/lib/db/repository");
    const result = await dbGetCategories();

    expect(result.data).toHaveLength(1);
    expect(result.data![0].name).toBe("Analgesics");
  });
});

// ---- dbGetCartItem ----
describe("dbGetCartItem", () => {
  it("returns null when no rows", async () => {
    mockDb.limit.mockResolvedValue([]);

    const { dbGetCartItem } = await import("../../src/lib/db/repository");
    const result = await dbGetCartItem("u1", "p1");

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it("returns item when found", async () => {
    mockDb.limit.mockResolvedValue([{ id: "ci-1", quantity: 3 }]);

    const { dbGetCartItem } = await import("../../src/lib/db/repository");
    const result = await dbGetCartItem("u1", "p1");

    expect(result.data!.quantity).toBe(3);
  });
});

// ---- dbCreateContactMessage ----
describe("dbCreateContactMessage", () => {
  it("calls insert without throwing", async () => {
    const fakeRow = { id: "msg-1", name: "Test", email: "t@t.com", message: "Hello" };
    mockDb.returning.mockResolvedValue([fakeRow]);

    const { dbCreateContactMessage } = await import("../../src/lib/db/repository");
    const result = await dbCreateContactMessage({ name: "Test", email: "t@t.com", message: "Hello" });

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });
});

// ---- coerceOrder (via dbGetRecentOrders) ----
describe("coerceOrder numeric coercion", () => {
  it("coerces order numeric strings to numbers", async () => {
    const orderRow = {
      id: "ord-1",
      order_number: "JA-20240101-ABCDE",
      user_id: "u-1",
      status: "pending",
      payment_status: "created",
      subtotal: "499.00",
      shipping: "40.00",
      total: "539.00",
      discount: "0.00",
      currency: "INR",
      coupon_id: null,
      shipping_address: {},
      razorpay_order_id: null,
      razorpay_payment_id: null,
      is_test_payment: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    mockDb.limit.mockResolvedValue([orderRow]);

    const { dbGetRecentOrders } = await import("../../src/lib/db/repository");
    const result = await dbGetRecentOrders("u-1", 5);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(typeof result.data![0].total).toBe("number");
    expect(result.data![0].total).toBeCloseTo(539);
    expect(result.data![0].shipping).toBeCloseTo(40);
    expect(result.data![0].subtotal).toBeCloseTo(499);
    expect(result.data![0].discount).toBeCloseTo(0);
  });
});
