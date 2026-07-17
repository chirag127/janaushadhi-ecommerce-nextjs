import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  baseParams,
}: {
  page: number;
  totalPages: number;
  /** current query params, without `page` */
  baseParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(baseParams)) {
      if (v) params.set(k, v);
    }
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      <Link
        aria-disabled={page <= 1}
        href={makeHref(Math.max(1, page - 1))}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          page <= 1 && "pointer-events-none opacity-50"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {start > 1 && (
        <>
          <Link href={makeHref(1)} className={buttonVariants({ variant: "outline", size: "icon" })}>
            1
          </Link>
          <span className="px-1 text-muted-foreground">…</span>
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={makeHref(p)}
          className={buttonVariants({
            variant: p === page ? "default" : "outline",
            size: "icon",
          })}
        >
          {p}
        </Link>
      ))}

      {end < totalPages && (
        <>
          <span className="px-1 text-muted-foreground">…</span>
          <Link
            href={makeHref(totalPages)}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            {totalPages}
          </Link>
        </>
      )}

      <Link
        aria-disabled={page >= totalPages}
        href={makeHref(Math.min(totalPages, page + 1))}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          page >= totalPages && "pointer-events-none opacity-50"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
