"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitReview } from "@/app/actions/review";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Submit Review
    </Button>
  );
}

export function ReviewForm({
  productId,
  isAuthed,
  initialRating = 0,
  initialComment = "",
}: {
  productId: string;
  isAuthed: boolean;
  initialRating?: number;
  initialComment?: string;
}) {
  const router = useRouter();
  const [rating, setRating] = React.useState(initialRating);
  const [hover, setHover] = React.useState(0);

  if (!isAuthed) {
    return (
      <p className="text-sm text-muted-foreground">
        Please{" "}
        <a href="/login" className="text-primary underline">
          sign in
        </a>{" "}
        to write a review.
      </p>
    );
  }

  async function action(formData: FormData) {
    formData.set("rating", String(rating));
    const res = await submitReview(null, formData);
    if (res?.error) toast.error(res.error);
    else {
      toast.success(res?.success ?? "Review submitted");
      router.refresh();
    }
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="product_id" value={productId} />
      <div>
        <Label className="mb-2 block">Your rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${i} star`}
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  i <= (hover || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40"
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="comment" className="mb-2 block">
          Your review
        </Label>
        <Textarea
          id="comment"
          name="comment"
          rows={4}
          defaultValue={initialComment}
          placeholder="Share your experience with this product…"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
