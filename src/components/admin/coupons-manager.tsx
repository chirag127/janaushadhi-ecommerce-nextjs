"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { upsertCoupon, deleteCoupon } from "@/app/actions/admin";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Coupon } from "@/lib/types";

export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Coupon | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function action(formData: FormData) {
    setSaving(true);
    const res = await upsertCoupon(null, formData);
    setSaving(false);
    if (res?.error) toast.error(res.error);
    else {
      toast.success(res?.success ?? "Saved");
      setShowForm(false);
      setEditing(null);
      router.refresh();
    }
  }

  async function onDelete(c: Coupon) {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    const res = await deleteCoupon(c.id);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Deleted");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        {!showForm && (
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Coupon
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form action={action} className="space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    name="code"
                    required
                    className="uppercase"
                    defaultValue={editing?.code}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Type</Label>
                  <Select
                    id="discount_type"
                    name="discount_type"
                    defaultValue={editing?.discount_type ?? "percentage"}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="discount_value">Value</Label>
                  <Input
                    id="discount_value"
                    name="discount_value"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={editing?.discount_value}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_order_amount">Min order (₹)</Label>
                  <Input
                    id="min_order_amount"
                    name="min_order_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editing?.min_order_amount ?? 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Max discount (₹)</Label>
                  <Input
                    id="max_discount"
                    name="max_discount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editing?.max_discount ?? ""}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Usage limit</Label>
                  <Input
                    id="usage_limit"
                    name="usage_limit"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    defaultValue={editing?.usage_limit ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expires at</Label>
                  <Input
                    id="expires_at"
                    name="expires_at"
                    type="date"
                    defaultValue={
                      editing?.expires_at
                        ? editing.expires_at.slice(0, 10)
                        : ""
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={editing?.is_active ?? true}
                />
                Active
              </label>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Discount</th>
              <th className="p-3 font-medium">Min order</th>
              <th className="p-3 font-medium">Used</th>
              <th className="p-3 font-medium">Expires</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No coupons yet.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-accent/30">
                  <td className="p-3 font-mono font-medium">{c.code}</td>
                  <td className="p-3">
                    {c.discount_type === "percentage"
                      ? `${c.discount_value}%`
                      : formatPrice(c.discount_value)}
                  </td>
                  <td className="p-3">{formatPrice(c.min_order_amount)}</td>
                  <td className="p-3 text-muted-foreground">
                    {c.used_count}
                    {c.usage_limit != null ? ` / ${c.usage_limit}` : ""}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {c.expires_at ? formatDate(c.expires_at) : "—"}
                  </td>
                  <td className="p-3">
                    {c.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditing(c);
                          setShowForm(true);
                        }}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onDelete(c)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
