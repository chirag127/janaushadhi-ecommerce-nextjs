import Link from "next/link";
import { Pill } from "lucide-react";
import { siteConfig } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Pill className="h-4 w-4" />
            </span>
            {siteConfig.shortName}
          </Link>
          <p className="text-sm text-muted-foreground">
            Quality generic medicines at affordable prices, inspired by the
            Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP).
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Shop</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/products" className="hover:text-primary">All Products</Link></li>
            <li><Link href="/categories" className="hover:text-primary">Categories</Link></li>
            <li><Link href="/products?featured=1" className="hover:text-primary">Featured</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Account</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/account" className="hover:text-primary">My Account</Link></li>
            <li><Link href="/account/orders" className="hover:text-primary">Order History</Link></li>
            <li><Link href="/cart" className="hover:text-primary">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">About</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="max-w-xs">
              Generic medicines are as safe and effective as branded
              equivalents, at a fraction of the cost.
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} {siteConfig.name}. All rights reserved.</p>
          <p>For demonstration purposes only. Not for actual medical use.</p>
        </div>
      </div>
    </footer>
  );
}
