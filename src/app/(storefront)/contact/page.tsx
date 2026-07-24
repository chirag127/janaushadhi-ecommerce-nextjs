"use client";

import { useActionState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { submitContact, type ActionState } from "@/app/actions/contact";

function ContactForm() {
  const params = useSearchParams();
  const product = params.get("product") ?? "";
  const defaultMessage = product ? `I'd like to enquire about: ${product}` : "";

  const [state, formAction] = useActionState<ActionState, FormData>(
    submitContact,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </div>
      )}
      {state?.success && (
        <div className="flex items-start gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {state.success}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required autoComplete="name" placeholder="Your full name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          defaultValue={defaultMessage}
          placeholder="Tell us how we can help…"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <SubmitButton className="w-full">Send Message</SubmitButton>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="container max-w-5xl py-12">
      <h1 className="mb-2 text-3xl font-bold">Contact Us</h1>
      <p className="mb-10 text-muted-foreground">
        Have a question or need help? Fill in the form and we&apos;ll get back to you within 1 business day.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <ContactForm />
            </Suspense>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 text-lg font-semibold">Store Information</h2>
              <dl className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <dd className="text-muted-foreground">
                    <span className="font-medium text-foreground">Jan Aushadhi Store</span>
                    <br />
                    Pradhan Mantri Bhartiya Janaushadhi Pariyojana
                    <br />
                    Bureau of Pharma PSUs of India (BPPI), India
                  </dd>
                </div>
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <dd>
                    <a href="mailto:support@janaushadhi.store" className="text-primary hover:underline">
                      support@janaushadhi.store
                    </a>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <dd className="text-muted-foreground">
                    <a href="tel:18001808080" className="text-primary hover:underline">
                      1800-180-8080
                    </a>
                    <br />
                    <span className="text-xs">Mon–Sat, 9 AM – 6 PM IST</span>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-2 font-semibold">About Jan Aushadhi</h3>
              <p className="text-sm text-muted-foreground">
                PMBJP provides quality generic medicines at affordable prices through
                dedicated Janaushadhi Kendras across India — the same efficacy at up to
                90% lower cost than branded alternatives.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
