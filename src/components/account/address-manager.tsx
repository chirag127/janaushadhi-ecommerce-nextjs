"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { saveAddress, deleteAddress } from "@/app/actions/address";
import type { Address } from "@/lib/types";

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Address | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(a: Address) {
    setEditing(a);
    setShowForm(true);
  }

  async function action(formData: FormData) {
    setSaving(true);
    const res = await saveAddress(null, formData);
    setSaving(false);
    if (res?.error) toast.error(res.error);
    else {
      toast.success(res?.success ?? "Saved");
      setShowForm(false);
      setEditing(null);
      router.refresh();
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    const res = await deleteAddress(id);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Deleted");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Add Address
        </Button>
      )}

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form action={action} className="space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    required
                    defaultValue={editing?.full_name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    defaultValue={editing?.phone}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="line1">Address line 1</Label>
                <Input
                  id="line1"
                  name="line1"
                  required
                  defaultValue={editing?.line1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="line2">Address line 2 (optional)</Label>
                <Input
                  id="line2"
                  name="line2"
                  defaultValue={editing?.line2 ?? ""}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    required
                    defaultValue={editing?.city}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    required
                    defaultValue={editing?.state}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    required
                    defaultValue={editing?.pincode}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_default"
                  defaultChecked={editing?.is_default}
                />
                Set as default address
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

      {addresses.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No addresses saved yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">{a.full_name}</p>
                  {a.is_default && (
                    <Badge variant="success">
                      <Star className="mr-1 h-3 w-3" /> Default
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{a.phone}</p>
                <p className="text-sm text-muted-foreground">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} –{" "}
                  {a.pincode}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => onDelete(a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
