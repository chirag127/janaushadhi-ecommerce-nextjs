import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  IndianRupee,
  Pill,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/storefront/product-card";
import {
  getFeaturedProducts,
  getCategoriesWithCount,
  getWishlistIds,
} from "@/lib/queries";
import { getUser } from "@/lib/auth";

export default async function HomePage() {
  const [featured, categories, wishlist, user] = await Promise.all([
    getFeaturedProducts(8),
    getCategoriesWithCount(),
    getWishlistIds(),
    getUser(),
  ]);
  const isAuthed = !!user;
  const topCategories = categories
    .filter((c) => c.product_count > 0)
    .slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <Pill className="h-3.5 w-3.5 text-primary" />
              Quality generic medicines
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Affordable medicines,{" "}
              <span className="text-primary">real savings</span> for every
              family.
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Shop thousands of quality-assured generic medicines and health
              products at up to 90% lower prices.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/products">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/categories">Browse Categories</Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative mx-auto aspect-square max-w-sm rounded-3xl bg-primary/10 p-8">
              <div className="flex h-full w-full items-center justify-center rounded-2xl border bg-background/60 backdrop-blur">
                <Pill className="h-40 w-40 text-primary/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="container grid gap-4 py-10 sm:grid-cols-3">
        {[
          {
            icon: IndianRupee,
            title: "Lowest Prices",
            desc: "Generics at a fraction of branded costs.",
          },
          {
            icon: ShieldCheck,
            title: "Quality Assured",
            desc: "WHO-GMP standard products.",
          },
          {
            icon: Truck,
            title: "Fast Delivery",
            desc: "Free shipping on orders over ₹500.",
          },
        ].map((f) => (
          <Card key={f.title} className="flex items-start gap-3 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <f.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </Card>
        ))}
      </section>

      {/* Categories */}
      <section className="container py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Shop by Category</h2>
            <p className="text-muted-foreground">Find products by therapy area</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/categories">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {topCategories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`}>
              <Card className="flex h-full items-center gap-3 p-4 transition-colors hover:border-primary">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <Tag className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.product_count} products
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <p className="text-muted-foreground">Popular picks this week</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/products?featured=1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isAuthed={isAuthed}
              inWishlist={wishlist.has(p.id)}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-10">
        <Card className="flex flex-col items-center gap-4 bg-primary p-10 text-center text-primary-foreground">
          <h2 className="text-2xl font-bold">Save on every prescription</h2>
          <p className="max-w-lg opacity-90">
            Create a free account to track orders, save addresses, and build
            your wishlist.
          </p>
          <Button asChild size="lg" variant="accent">
            <Link href="/register">Create Account</Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}
