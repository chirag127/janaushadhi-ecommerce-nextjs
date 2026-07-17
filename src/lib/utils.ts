import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

export function formatPrice(value: number): string {
  return inrFormatter.format(value ?? 0);
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 90);
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type BadgeVariant =
  | "default"
  | "secondary"
  | "accent"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

export function orderStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "delivered":
      return "success";
    case "shipped":
    case "processing":
      return "default";
    case "cancelled":
      return "destructive";
    case "pending":
    default:
      return "warning";
  }
}

export const SHIPPING_FEE = 40;
export const FREE_SHIPPING_THRESHOLD = 500;

export function computeShipping(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export const PAGE_SIZE = 12;
