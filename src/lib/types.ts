// Hand-written DB types matching the live InsForge (Postgres) schema.
export type UserRole = "customer" | "admin";
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type PaymentStatus =
  | "created"
  | "pending"
  | "captured"
  | "failed"
  | "refunded";
export type DiscountType = "percent" | "fixed";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  drug_code: string;
  name: string;
  slug: string;
  unit_size: string | null;
  mrp: number;
  price: number;
  category_id: string | null;
  description: string | null;
  image_url: string | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category: Pick<Category, "id" | "name" | "slug"> | null;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string | null;
  is_default: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

export interface WishlistItemWithProduct {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product: Product;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  per_user_limit: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

/** Snapshot of the delivery address stored on an order (orders.shipping_address jsonb). */
export interface ShippingAddress {
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country?: string | null;
  /** Payment method chosen at checkout, snapshotted into the order's jsonb. */
  _payment_method?: "cod" | "razorpay";
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;
  coupon_id: string | null;
  shipping_address: ShippingAddress | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  is_test_payment: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
}

export interface ReviewWithProfile extends Review {
  profile: Pick<Profile, "full_name"> | null;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
  pending_orders: number;
  low_stock: number;
}

export interface MonthlySales {
  month: string;
  revenue: number;
  orders: number;
}
