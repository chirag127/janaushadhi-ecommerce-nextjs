"use client";

import * as React from "react";
import Link from "next/link";
import { User, Package, MapPin, Heart, LogOut, ChevronDown } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { href: "/account", label: "Dashboard", icon: User },
    { href: "/account/orders", label: "Orders", icon: Package },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  ];

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
      >
        <User className="h-5 w-5" />
        <ChevronDown className="hidden" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 overflow-hidden rounded-md border bg-card shadow-lg">
          <ul className="py-1 text-sm">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                >
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </Link>
              </li>
            ))}
            <li className="border-t">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
