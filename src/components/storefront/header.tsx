import Link from "next/link";
import { Pill, ShoppingCart, Heart, User, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/insforge/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/storefront/search-bar";
import { MobileNav } from "@/components/storefront/mobile-nav";
import { UserMenu } from "@/components/storefront/user-menu";
import { siteConfig } from "@/lib/site";

export async function Header() {
  const insforge = await createClient();
  const {
    data: { user },
  } = await insforge.auth.getCurrentUser();

  let cartCount = 0;
  let role: string | null = null;
  if (user) {
    const [{ count }, { data: profile }] = await Promise.all([
      insforge.database
        .from("cart_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      insforge.database
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single(),
    ]);
    cartCount = count ?? 0;
    role = (profile as { role?: string } | null)?.role ?? null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        <div className="flex items-center gap-2">
          <MobileNav isAuthed={!!user} isAdmin={role === "admin"} />
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Pill className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline text-lg leading-tight">
              {siteConfig.shortName}
            </span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
          <Link href="/products" className="hover:text-primary">
            Products
          </Link>
          <Link href="/categories" className="hover:text-primary">
            Categories
          </Link>
        </nav>

        <div className="flex-1 max-w-xl">
          <SearchBar />
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          {user && (
            <Button variant="ghost" size="icon" asChild aria-label="Wishlist">
              <Link href="/account/wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="Cart"
            className="relative"
          >
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  variant="accent"
                  className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]"
                >
                  {cartCount}
                </Badge>
              )}
            </Link>
          </Button>

          {role === "admin" && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="Admin"
              className="hidden sm:inline-flex"
            >
              <Link href="/admin">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {user ? (
            <UserMenu />
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/login">
                <User className="mr-1 h-4 w-4" /> Sign in
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
