/**
 * Unit tests for src/lib/utils.ts
 */
import { describe, it, expect } from "vitest";
import {
  cn,
  formatPrice,
  formatDate,
  slugify,
  formatDateTime,
  orderStatusVariant,
  computeShipping,
  SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
  PAGE_SIZE,
} from "../../src/lib/utils";

describe("computeShipping", () => {
  it("returns 0 for zero subtotal", () => {
    expect(computeShipping(0)).toBe(0);
  });
  it("returns 0 for negative subtotal", () => {
    expect(computeShipping(-10)).toBe(0);
  });
  it("charges flat shipping below threshold", () => {
    expect(computeShipping(FREE_SHIPPING_THRESHOLD - 0.01)).toBe(SHIPPING_FEE);
  });
  it("returns 0 at exactly the threshold", () => {
    expect(computeShipping(FREE_SHIPPING_THRESHOLD)).toBe(0);
  });
  it("returns 0 above threshold", () => {
    expect(computeShipping(1000)).toBe(0);
  });
});

describe("slugify", () => {
  it("lowercases", () => {
    expect(slugify("Paracetamol")).toBe("paracetamol");
  });
  it("replaces spaces with hyphens", () => {
    expect(slugify("Jan Aushadhi Store")).toBe("jan-aushadhi-store");
  });
  it("strips leading/trailing hyphens", () => {
    expect(slugify(" -hello- ")).toBe("hello");
  });
  it("collapses multiple separators", () => {
    expect(slugify("a  b---c")).toBe("a-b-c");
  });
  it("truncates at 90 chars", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBe(90);
  });
  it("handles special chars", () => {
    expect(slugify("Vitamin C (500mg)")).toBe("vitamin-c-500mg");
  });
});

describe("formatPrice", () => {
  it("formats a number as INR", () => {
    const r = formatPrice(100);
    expect(r).toContain("100");
  });
  it("handles zero", () => {
    const r = formatPrice(0);
    expect(r).toBeTruthy();
  });
  it("handles fractional values", () => {
    const r = formatPrice(99.5);
    expect(r).toContain("99");
  });
});

describe("formatDate", () => {
  it("returns a non-empty string", () => {
    expect(formatDate("2024-01-15")).toBeTruthy();
  });
  it("includes the year", () => {
    expect(formatDate("2024-01-15")).toContain("2024");
  });
  it("accepts a Date object", () => {
    expect(formatDate(new Date("2024-06-01"))).toContain("2024");
  });
});

describe("orderStatusVariant", () => {
  it("delivered → success", () => {
    expect(orderStatusVariant("delivered")).toBe("success");
  });
  it("cancelled → destructive", () => {
    expect(orderStatusVariant("cancelled")).toBe("destructive");
  });
  it("pending → warning", () => {
    expect(orderStatusVariant("pending")).toBe("warning");
  });
  it("shipped → default", () => {
    expect(orderStatusVariant("shipped")).toBe("default");
  });
  it("unknown → warning", () => {
    expect(orderStatusVariant("unknown")).toBe("warning");
  });
});

describe("cn (classnames merge)", () => {
  it("joins classes", () => {
    expect(cn("a", "b")).toContain("a");
  });
  it("filters falsy", () => {
    expect(cn("a", false as unknown as string, undefined, "b")).toBe("a b");
  });
});

describe("PAGE_SIZE", () => {
  it("is a positive integer", () => {
    expect(PAGE_SIZE).toBeGreaterThan(0);
    expect(Number.isInteger(PAGE_SIZE)).toBe(true);
  });
});
