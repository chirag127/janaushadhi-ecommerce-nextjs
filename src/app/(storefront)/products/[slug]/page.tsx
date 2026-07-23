import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Package, ShieldCheck, Truck, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/storefront/rating-stars";
import { ProductPurchase } from "@/components/storefront/product-purchase";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { ProductCard } from "@/components/storefront/product-card";
import { ReviewForm } from "@/components/storefront/review-form";
import {
  getProductBySlug,
  getRelatedProducts,
  getWishlistIds,
} from "@/lib/queries";
import { getProductReviews } from "@/lib/reviews";
import { getUser } from "@/lib/auth";
import { formatPrice, formatDate } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description:
      product.description ||
      `Buy ${product.name} online at an affordable price.`,
    openGraph: {
      title: product.name,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.is_active) notFound();

  const [reviews, related, wishlist, user] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product.category_id, product.id, 4),
    getWishlistIds(),
    getUser(),
  ]);
  const isAuthed = !!user;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.image_url ?? undefined,
    sku: product.drug_code,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.mrp,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${siteConfig.url}/products/${product.slug}`,
    },
    aggregateRating:
      reviews.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: reviews.average.toFixed(1),
            reviewCount: reviews.count,
          }
        : undefined,
  };

  return (
    <div className="container py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-primary">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-primary"
            >
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <Package className="h-24 w-24" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {product.is_featured && <Badge variant="accent">Featured</Badge>}
            {product.category && (
              <Badge variant="secondary">{product.category.name}</Badge>
            )}
            <Badge variant="outline">#{product.drug_code}</Badge>
          </div>

          <h1 className="text-3xl font-bold">{product.name}</h1>

          <div className="flex items-center gap-2">
            <RatingStars value={reviews.average} />
            <span className="text-sm text-muted-foreground">
              {reviews.count > 0
                ? `${reviews.average.toFixed(1)} (${reviews.count} reviews)`
                : "No reviews yet"}
            </span>
          </div>

          {!product.price || product.price <= 0 ? (
            <p className="text-2xl font-bold text-primary">Available on request</p>
          ) : (
            <p className="text-3xl font-bold text-primary">
              {formatPrice(product.price)}
            </p>
          )}

          {product.unit_size && (
            <p className="text-sm text-muted-foreground">
              Pack size: <span className="font-medium">{product.unit_size}</span>
            </p>
          )}

          <p>
            {product.stock > 0 ? (
              <Badge variant="success">In stock ({product.stock})</Badge>
            ) : (
              <Badge variant="destructive">Out of stock</Badge>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!product.price || product.price <= 0 ? (
              <Link
                href={`/contact?product=${encodeURIComponent(product.name)}`}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Request this medicine
              </Link>
            ) : (
              <ProductPurchase
                productId={product.id}
                isAuthed={isAuthed}
                maxStock={product.stock}
              />
            )}
            <WishlistButton
              productId={product.id}
              isAuthed={isAuthed}
              initialInWishlist={wishlist.has(product.id)}
              size="default"
            />
          </div>

          <div className="grid gap-3 pt-4 sm:grid-cols-2">
            <Card className="flex items-center gap-2 p-3 text-sm">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Quality-assured generic
            </Card>
            <Card className="flex items-center gap-2 p-3 text-sm">
              <Truck className="h-5 w-5 text-primary" />
              Free shipping over ₹500
            </Card>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">Description</h2>
          <p className="whitespace-pre-line text-muted-foreground">
            {product.description}
          </p>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="mb-4 text-xl font-bold">
            Customer Reviews ({reviews.count})
          </h2>
          {reviews.reviews.length === 0 ? (
            <p className="text-muted-foreground">
              Be the first to review this product.
            </p>
          ) : (
            <ul className="space-y-4">
              {reviews.reviews.map((r) => (
                <li key={r.id} className="rounded-lg border p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">{r.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <RatingStars value={r.rating} size={14} />
                  {r.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {r.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">
              {reviews.userReview ? "Update your review" : "Write a review"}
            </h3>
            <ReviewForm
              productId={product.id}
              isAuthed={isAuthed}
              initialRating={reviews.userReview?.rating ?? 0}
              initialComment={reviews.userReview?.comment ?? ""}
            />
          </Card>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isAuthed={isAuthed}
                inWishlist={wishlist.has(p.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
