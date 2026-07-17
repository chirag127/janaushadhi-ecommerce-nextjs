import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/insforge/server";

/**
 * Lightweight autocomplete endpoint for the search box.
 * GET /api/search/autocomplete?q=para
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const insforge = await createClient();
  const { data, error } = await insforge.database
    .from("products")
    .select("id, name, slug, mrp, unit_size")
    .eq("is_active", true)
    .ilike("name", `%${q}%`)
    .order("name")
    .limit(8);

  if (error) return NextResponse.json({ results: [] });
  return NextResponse.json({ results: data ?? [] });
}
